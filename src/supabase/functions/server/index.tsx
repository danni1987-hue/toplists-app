import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Environment variables
const publicAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Middleware
app.use("*", cors());
app.use("*", logger(console.log));

// Helper to create Supabase client
function getSupabaseClient(useServiceRole = false) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    useServiceRole 
      ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      : Deno.env.get("SUPABASE_ANON_KEY")!
  );
}

// Helper to get authenticated user from database
async function getAuthenticatedUser(request: Request) {
  const supabase = getSupabaseClient(true);
  
  const accessToken = request.headers.get("Authorization")?.split(" ")[1];
  if (!accessToken) {
    return null;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }
  
  // Get user profile from database
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (profileError || !profile) {
    return null;
  }
  
  return profile;
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es-ES");
}

// Sign up route
app.post("/make-server-e2505fcb/signup", async (c) => {
  try {
    const { email, password, name, username } = await c.req.json();
    
    if (!email || !password || !name || !username) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const supabase = getSupabaseClient(true);
    
    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    
    if (existingUser) {
      return c.json({ error: "Username already taken" }, 400);
    }
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, username },
      email_confirm: true,
    });
    
    if (authError) {
      return c.json({ error: authError.message }, 400);
    }
    
    // Store user profile in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        username,
        email,
        avatar_url: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=100",
        is_public: true, // Public by default
      })
      .select()
      .single();
    
    if (userError) {
      return c.json({ error: "Error creating user profile" }, 500);
    }
    
    return c.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        name,
      },
    });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// Get user profile
app.get("/make-server-e2505fcb/profile", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const supabase = getSupabaseClient();
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user: authUser } } = await supabase.auth.getUser(accessToken!);
    
    return c.json({ 
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        name: authUser?.user_metadata?.name || user.username,
        is_public: user.is_public !== false, // Default to true if not set
      }
    });
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update user settings (privacy, etc)
app.put("/make-server-e2505fcb/profile/settings", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { is_public } = await c.req.json();
    const supabase = getSupabaseClient(true);

    console.log(`🔐 Updating settings for user ${user.username}: is_public=${is_public}`);

    // Update user settings
    const { data, error } = await supabase
      .from("users")
      .update({ is_public })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user settings:", error);
      return c.json({ error: "Error updating settings" }, 500);
    }

    console.log(`✅ Successfully updated settings for ${user.username}`);

    return c.json({
      success: true,
      profile: {
        is_public: data.is_public,
      },
    });
  } catch (error) {
    console.error("Error in profile settings update:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all lists (respecting privacy settings)
app.get("/make-server-e2505fcb/lists", async (c) => {
  try {
    console.log("🚀 Starting /lists endpoint");
    
    // Use service role to bypass RLS
    const supabase = getSupabaseClient(true);
    
    // Try to get authenticated user (optional for this endpoint)
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    let currentUserId = null;
    let followingIds: string[] = [];
    
    console.log("🔐 Access token present:", !!accessToken);
    
    if (accessToken && accessToken !== publicAnonKey) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
        if (authUser) {
          currentUserId = authUser.id;
          console.log("👤 Authenticated user:", currentUserId);
          
          // Get list of users that current user follows (with accepted status only)
          const { data: following, error: followError } = await supabase
            .from("followers")
            .select("followed_id")
            .eq("follower_id", currentUserId)
            .eq("status", "accepted"); // Only consider accepted follow requests
          
          if (followError) {
            console.error("⚠️ Error fetching following:", followError);
          } else {
            followingIds = following?.map(f => f.followed_id) || [];
            console.log(`🔍 User ${currentUserId} follows ${followingIds.length} users (accepted only)`);
          }
        }
      } catch (error) {
        console.log("⚠️ No authenticated user for /lists endpoint:", error);
      }
    }
    
    console.log("🔍 Fetching lists from database...");
    
    const { data: lists, error } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url, is_public),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*),
        comments (count)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("❌ Database error fetching lists:", error);
      return c.json({ error: `Error fetching lists: ${error.message}` }, 500);
    }
    
    console.log(`📊 Fetched ${lists?.length || 0} lists from database`);
    
    if (!lists || lists.length === 0) {
      console.log("📭 No lists found in database");
      return c.json({ lists: [] });
    }
    
    // Filter lists based on privacy settings
    console.log("🔒 Starting privacy filter...");
    const filteredLists = lists.filter((list: any) => {
      try {
        // Skip lists with no user data
        if (!list.users) {
          console.log(`⚠️ List "${list.title}" (${list.id}) has no user data, skipping`);
          return false;
        }
        
        const userIsPublic = list.users.is_public !== false; // Default to true if not set
        const isOwnList = currentUserId && list.users.id === currentUserId;
        const isFollowing = currentUserId && followingIds.includes(list.users.id);
        
        // If user profile is public, always show
        // If user profile is private, only show if it's own list OR current user follows them (with accepted status)
        const shouldShow = userIsPublic || isOwnList || (!userIsPublic && isFollowing);
        
        console.log(`📋 List "${list.title}" - user: ${list.users.username}, userId: ${list.users.id}, is_public: ${list.users.is_public}, currentUserId: ${currentUserId}, isOwnList: ${isOwnList}, isFollowing: ${isFollowing}, followingIds: [${followingIds.join(', ')}], shouldShow: ${shouldShow}`);
        
        return shouldShow;
      } catch (filterError) {
        console.error(`❌ Error filtering list ${list.id}:`, filterError);
        return false;
      }
    });
    
    console.log(`✅ After privacy filter: ${filteredLists.length}/${lists.length} lists`);
    
    // Format lists
    console.log("🔄 Formatting lists...");
    const formattedLists = filteredLists.map((list: any) => {
      try {
        return {
          id: list.id,
          category: list.categories?.category_name || "General",
          subcategory: list.subcategories?.subcategory_name,
          genre: list.subcategories?.subcategory_name,
          title: list.title,
          description: list.description,
          author: {
            userId: list.users?.id,
            name: list.users?.username,
            username: list.users?.username,
            avatar: list.users?.avatar_url,
          },
          items: (list.items || [])
            .sort((a: any, b: any) => (a.item_order || 0) - (b.item_order || 0))
            .map((item: any, index: number) => ({
              rank: index + 1,
              title: item.name,
              name: item.name,
              rating: item.rating,
              ratings: item.ratings || {},
              image: item.image_url,
              description: item.description,
            })),
          coverImage: list.items?.[0]?.image_url || "",
          likes: 0,
          comments: list.comments?.[0]?.count || 0,
          timestamp: getRelativeTime(list.created_at),
          createdAt: list.created_at,
        };
      } catch (formatError) {
        console.error(`❌ Error formatting list ${list.id}:`, formatError);
        throw formatError;
      }
    });
    
    console.log(`✅ Successfully formatted ${formattedLists.length} lists`);
    return c.json({ lists: formattedLists });
  } catch (error) {
    console.error("❌ FATAL ERROR in /lists endpoint:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return c.json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, 500);
  }
});

// Get user's lists
app.get("/make-server-e2505fcb/my-lists", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const supabase = getSupabaseClient(true);
    
    const { data: lists, error } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*),
        comments (count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      return c.json({ error: "Error fetching user lists" }, 500);
    }
    
    const formattedLists = (lists || []).map((list: any) => ({
      id: list.id,
      category: list.categories?.category_name || "General",
      subcategory: list.subcategories?.subcategory_name,
      genre: list.subcategories?.subcategory_name,
      title: list.title,
      description: list.description,
      author: {
        userId: list.users.id,
        name: list.users.username,
        username: list.users.username,
        avatar: list.users.avatar_url,
      },
      items: (list.items || [])
        .sort((a: any, b: any) => a.item_order - b.item_order)
        .map((item: any, index: number) => ({
          rank: index + 1,
          title: item.name,
          name: item.name,
          rating: item.rating,
          ratings: item.ratings || {},
          image: item.image_url,
          description: item.description,
        })),
      coverImage: list.items?.[0]?.image_url || "",
      likes: 0,
      comments: list.comments?.[0]?.count || 0,
      timestamp: getRelativeTime(list.created_at),
      createdAt: list.created_at,
    }));
    
    return c.json({ lists: formattedLists });
  } catch (error) {
    console.error("❌ Error in /my-lists endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a new list
app.post("/make-server-e2505fcb/lists", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { category, subcategory, title, description, items } = await c.req.json();
    
    if (!title || !items || !Array.isArray(items)) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const supabase = getSupabaseClient(true);
    
    // Get category_id
    let categoryId = null;
    if (category) {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("category_name", category)
        .maybeSingle();
      categoryId = categoryData?.id;
    }
    
    // Get subcategory_id
    let subcategoryId = null;
    if (subcategory && categoryId) {
      const { data: subcategoryData } = await supabase
        .from("subcategories")
        .select("id")
        .eq("subcategory_name", subcategory)
        .eq("category_id", categoryId)
        .maybeSingle();
      subcategoryId = subcategoryData?.id;
    }
    
    // Create the list
    const { data: newList, error: listError } = await supabase
      .from("lists")
      .insert({
        user_id: user.id,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        title,
        description: description || "",
      })
      .select()
      .single();
    
    if (listError) {
      return c.json({ error: "Error creating list" }, 500);
    }
    
    // Insert items into the list
    const itemsToInsert = items.map((item: any, index: number) => ({
      list_id: newList.id,
      name: item.name,
      description: item.description || "",
      image_url: item.image || "",
      rating: item.rating || 0,
      ratings: item.ratings || null, // Store detailed ratings as JSONB
      item_order: index + 1,
    }));
    
    const { error: itemsError } = await supabase
      .from("items")
      .insert(itemsToInsert);
    
    if (itemsError) {
      await supabase.from("lists").delete().eq("id", newList.id);
      return c.json({ error: "Error creating list items" }, 500);
    }
    
    const formattedList = {
      id: newList.id,
      category: category || "General",
      subcategory,
      genre: subcategory,
      title: newList.title,
      description: newList.description,
      author: {
        userId: user.id,
        name: user.username,
        username: user.username,
        avatar: user.avatar_url,
      },
      items: items.map((item: any, index: number) => ({
        rank: index + 1,
        title: item.name,
        name: item.name,
        rating: item.rating,
        image: item.image,
        description: item.description,
      })),
      coverImage: items[0]?.image || "",
      likes: 0,
      comments: 0,
      timestamp: "Justo ahora",
      createdAt: newList.created_at,
    };
    
    return c.json({ success: true, list: formattedList });
  } catch (error) {
    console.error("❌ Error in POST /lists endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update a list
app.put("/make-server-e2505fcb/lists/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const listId = c.req.param("id");
    const supabase = getSupabaseClient(true);
    
    const { data: existingList } = await supabase
      .from("lists")
      .select("*")
      .eq("id", listId)
      .single();
    
    if (!existingList || existingList.user_id !== user.id) {
      return c.json({ error: "List not found or unauthorized" }, 404);
    }
    
    const { category, subcategory, title, description, items } = await c.req.json();
    
    // Get category_id
    let categoryId = null;
    if (category) {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("category_name", category)
        .maybeSingle();
      categoryId = categoryData?.id;
    }
    
    // Get subcategory_id
    let subcategoryId = null;
    if (subcategory && categoryId) {
      const { data: subcategoryData } = await supabase
        .from("subcategories")
        .select("id")
        .eq("subcategory_name", subcategory)
        .eq("category_id", categoryId)
        .maybeSingle();
      subcategoryId = subcategoryData?.id;
    }
    
    // Update list
    await supabase
      .from("lists")
      .update({
        category_id: categoryId,
        subcategory_id: subcategoryId,
        title,
        description: description || "",
      })
      .eq("id", listId);
    
    // Delete old items
    await supabase.from("items").delete().eq("list_id", listId);
    
    // Insert new items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any, index: number) => ({
        list_id: listId,
        name: item.name,
        description: item.description || "",
        image_url: item.image || "",
        rating: item.rating || 0,
        ratings: item.ratings || null, // Store detailed ratings as JSONB
        item_order: index + 1,
      }));
      
      await supabase.from("items").insert(itemsToInsert);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error in PUT /lists/:id endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a list
app.delete("/make-server-e2505fcb/lists/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const listId = c.req.param("id");
    const supabase = getSupabaseClient(true);
    
    const { data: existingList } = await supabase
      .from("lists")
      .select("user_id")
      .eq("id", listId)
      .single();
    
    if (!existingList || existingList.user_id !== user.id) {
      return c.json({ error: "List not found or unauthorized" }, 404);
    }
    
    await supabase.from("items").delete().eq("list_id", listId);
    await supabase.from("lists").delete().eq("id", listId);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error in DELETE /lists/:id endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get categories
app.get("/make-server-e2505fcb/categories", async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: categories, error } = await supabase
      .from("categories")
      .select(`
        *,
        subcategories (*)
      `)
      .order("category_name");
    
    if (error) {
      return c.json({ error: "Error fetching categories" }, 500);
    }
    
    return c.json({ categories });
  } catch (error) {
    console.error("❌ Error in GET /categories endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Unsplash image search
app.get("/make-server-e2505fcb/search-image", async (c) => {
  try {
    const query = c.req.query("q");
    if (!query) {
      return c.json({ error: "Query parameter required" }, 400);
    }
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=gUonRR_b-X5Ul0JHNLWeF_S3sf3RiBerpovijest8pTc`
    );
    
    if (!response.ok) {
      return c.json({ error: "Error searching images" }, 500);
    }
    
    const data = await response.json();
    const imageUrl = data.results?.[0]?.urls?.regular || "";
    
    return c.json({ imageUrl });
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// LIKES ENDPOINTS
// ============================================

// Toggle like on a list
app.post("/make-server-e2505fcb/lists/:listId/like", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const listId = c.req.param("listId");
    const supabase = getSupabaseClient(true);

    // Check if like already exists
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("list_id", listId)
      .maybeSingle();

    if (existingLike) {
      // Unlike - remove the like
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("list_id", listId);

      if (error) {
        return c.json({ error: "Error removing like" }, 500);
      }

      // Get updated count
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("list_id", listId);

      return c.json({ liked: false, likesCount: count || 0 });
    } else {
      // Like - add the like
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, list_id: listId });

      if (error) {
        return c.json({ error: "Error adding like" }, 500);
      }

      // Get updated count
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("list_id", listId);

      return c.json({ liked: true, likesCount: count || 0 });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get like status and count for a list
app.get("/make-server-e2505fcb/lists/:listId/likes", async (c) => {
  try {
    const listId = c.req.param("listId");
    const supabase = getSupabaseClient(true);

    // Get total count
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("list_id", listId);

    // Check if current user liked (if authenticated)
    let isLiked = false;
    
    // Try to get authenticated user, but don't fail if token is invalid
    try {
      const user = await getAuthenticatedUser(c.req.raw);
      if (user) {
        const { data: userLike } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("list_id", listId)
          .maybeSingle();
        
        isLiked = !!userLike;
      }
    } catch (authError) {
      // Token might be invalid, just return isLiked as false
      console.log("Could not authenticate user for like status, returning default values");
    }

    return c.json({ 
      likesCount: count || 0,
      isLiked 
    });
  } catch (error) {
    console.error("Error getting likes:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// FOLLOWERS ENDPOINTS
// ============================================

// Follow/unfollow a user (sends follow request that needs approval)
app.post("/make-server-e2505fcb/users/:userId/follow", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userIdToFollow = c.req.param("userId");
    
    // Prevent following yourself
    if (user.id === userIdToFollow) {
      return c.json({ error: "Cannot follow yourself" }, 400);
    }

    const supabase = getSupabaseClient(true);

    console.log(`🔄 Follow request from ${user.username} (${user.id}) to user ${userIdToFollow}`);

    // Check if there's any existing relationship (pending or accepted)
    const { data: existingFollow, error: checkError } = await supabase
      .from("followers")
      .select("id, status")
      .eq("follower_id", user.id)
      .eq("followed_id", userIdToFollow)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking existing follow:", checkError);
      console.error("❌ Error details:", JSON.stringify(checkError, null, 2));
      console.error("❌ Error code:", checkError.code);
      console.error("❌ Error hint:", checkError.hint);
      if (checkError.code === '42703') {
        console.error("🔴 ERROR 42703: Column 'status' does not exist in 'followers' table");
        console.error("🔴 SOLUCIÓN: Ejecuta DATABASE_FIX.sql en Supabase SQL Editor");
      }
      return c.json({ 
        error: `Error checking follow status: ${checkError.message}`,
        code: checkError.code || 'UNKNOWN',
        hint: checkError.hint || 'No hint',
        solution: checkError.code === '42703' ? 'Execute DATABASE_FIX.sql' : 'Check logs'
      }, 500);
    }

    if (existingFollow) {
      // Cancel follow request or unfollow
      console.log(`❌ Canceling/removing follow relationship (status: ${existingFollow.status})`);
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", userIdToFollow);

      if (error) {
        console.error("Error canceling follow:", error);
        return c.json({ error: "Error canceling follow request" }, 500);
      }

      return c.json({ 
        following: false, 
        status: null,
        message: existingFollow.status === 'pending' ? 'Follow request canceled' : 'Unfollowed'
      });
    } else {
      // Send follow request (status = 'pending')
      console.log(`✉️ Sending follow request (status: pending)`);
      console.log(`📝 Insert data: follower_id=${user.id}, followed_id=${userIdToFollow}, status=pending`);
      
      const { data: insertData, error: insertError } = await supabase
        .from("followers")
        .insert({ 
          follower_id: user.id, 
          followed_id: userIdToFollow,
          status: 'pending'
        })
        .select();

      if (insertError) {
        console.error("❌ Error sending follow request:", insertError);
        console.error("❌ Error message:", insertError.message);
        console.error("❌ Error code:", insertError.code);
        console.error("❌ Error hint:", insertError.hint);
        console.error("❌ Error details:", insertError.details);
        console.error("❌ Full error object:", JSON.stringify(insertError, null, 2));
        
        // Información específica para el error 42703
        if (insertError.code === '42703') {
          console.error("🔴 ERROR 42703: Column does not exist");
          console.error("🔴 La columna 'status' NO EXISTE en la tabla 'followers'");
          console.error("🔴 SOLUCIÓN: Ejecuta el archivo DATABASE_FIX.sql en Supabase SQL Editor");
          console.error("🔴 Link: https://supabase.com/dashboard/project/wvrmgdmfgudrwwiyxlzn/sql/new");
        }
        
        return c.json({ 
          error: `Error sending follow request: ${insertError.message}`,
          code: insertError.code || 'UNKNOWN',
          hint: insertError.hint || 'No hint available',
          details: insertError.details || 'No additional details',
          solution: insertError.code === '42703' 
            ? 'Execute DATABASE_FIX.sql in Supabase SQL Editor' 
            : 'Check server logs for more information'
        }, 500);
      }

      console.log(`✅ Follow request sent successfully`);
      console.log(`✅ Inserted data:`, insertData);
      return c.json({ 
        following: false, 
        status: 'pending',
        message: 'Follow request sent'
      });
    }
  } catch (error) {
    console.error("❌ FATAL ERROR in follow endpoint:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack available");
    return c.json({ 
      error: "Internal server error in follow endpoint",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get follow status (including pending requests)
app.get("/make-server-e2505fcb/users/:userId/follow-status", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ isFollowing: false, status: null });
    }

    const userId = c.req.param("userId");
    const supabase = getSupabaseClient(true);

    const { data: follow } = await supabase
      .from("followers")
      .select("id, status")
      .eq("follower_id", user.id)
      .eq("followed_id", userId)
      .maybeSingle();

    return c.json({ 
      isFollowing: follow?.status === 'accepted',
      status: follow?.status || null,
      isPending: follow?.status === 'pending'
    });
  } catch (error) {
    console.error("Error getting follow status:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's followers (only accepted follows)
app.get("/make-server-e2505fcb/users/:userId/followers", async (c) => {
  try {
    const userId = c.req.param("userId");
    const supabase = getSupabaseClient(true);

    // First, get the follower relationships
    const { data: followers, error } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("followed_id", userId)
      .eq("status", "accepted"); // Only show accepted followers

    if (error) {
      console.error("Error fetching followers:", error);
      return c.json({ error: "Error fetching followers" }, 500);
    }

    if (!followers || followers.length === 0) {
      return c.json({ followers: [] });
    }

    // Then, get user details for each follower_id
    const followerIds = followers.map((f: any) => f.follower_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .in("id", followerIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return c.json({ error: "Error fetching user details" }, 500);
    }

    const formattedFollowers = (users || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.username,
      avatar: u.avatar_url,
    }));

    return c.json({ followers: formattedFollowers });
  } catch (error) {
    console.error("Error getting followers:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get users that a user is following (only accepted follows)
app.get("/make-server-e2505fcb/users/:userId/following", async (c) => {
  try {
    const userId = c.req.param("userId");
    const supabase = getSupabaseClient(true);

    // First get the followed_ids (only accepted)
    const { data: followingData, error: followError } = await supabase
      .from("followers")
      .select("followed_id")
      .eq("follower_id", userId)
      .eq("status", "accepted"); // Only show accepted follows

    if (followError) {
      console.error("Error fetching following relationships:", followError);
      return c.json({ error: "Error fetching following" }, 500);
    }

    // If not following anyone, return empty array
    if (!followingData || followingData.length === 0) {
      return c.json({ following: [] });
    }

    // Get the user details for each followed_id
    const followingIds = followingData.map((f: any) => f.followed_id);
    
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .in("id", followingIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return c.json({ error: "Error fetching user details" }, 500);
    }

    const formattedFollowing = (users || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      name: user.username,
      avatar: user.avatar_url,
    }));

    return c.json({ following: formattedFollowing });
  } catch (error) {
    console.error("Error getting following:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get feed from followed users
app.get("/make-server-e2505fcb/following-feed", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);

    console.log(`🔍 Getting following feed for user ${user.id} (${user.username})`);

    // Get users that current user is following (only accepted)
    const { data: following, error: followError } = await supabase
      .from("followers")
      .select("followed_id")
      .eq("follower_id", user.id)
      .eq("status", "accepted"); // Only get accepted follows

    if (followError) {
      console.error("❌ Error fetching following:", followError);
      return c.json({ error: "Error fetching following" }, 500);
    }

    // If not following anyone, return empty array
    if (!following || following.length === 0) {
      console.log(`⚠️ User ${user.username} is not following anyone yet`);
      return c.json({ lists: [] });
    }

    const followingIds = following.map((f: any) => f.followed_id);
    console.log(`✅ User ${user.username} is following ${followingIds.length} users (accepted): ${followingIds.join(", ")}`);

    // Get lists from followed users
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*),
        comments (count)
      `)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false });

    if (listsError) {
      console.error("❌ Error fetching lists from followed users:", listsError);
      return c.json({ error: "Error fetching lists" }, 500);
    }

    console.log(`📋 Found ${lists?.length || 0} lists from followed users`);

    // Format lists with like counts
    const formattedLists = await Promise.all(
      (lists || []).map(async (list: any) => {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("list_id", list.id);

        return {
          id: list.id,
          category: list.categories?.category_name || "General",
          subcategory: list.subcategories?.subcategory_name,
          genre: list.subcategories?.subcategory_name,
          title: list.title,
          description: list.description,
          author: {
            userId: list.users.id,
            name: list.users.username,
            username: list.users.username,
            avatar: list.users.avatar_url,
          },
          items: (list.items || [])
            .sort((a: any, b: any) => a.item_order - b.item_order)
            .map((item: any, index: number) => ({
              rank: index + 1,
              title: item.name,
              name: item.name,
              rating: item.rating,
              image: item.image_url,
              description: item.description,
            })),
          coverImage: list.items?.[0]?.image_url || "",
          likes: count || 0,
          comments: list.comments?.[0]?.count || 0,
          timestamp: getRelativeTime(list.created_at),
          createdAt: list.created_at,
        };
      })
    );

    return c.json({ lists: formattedLists });
  } catch (error) {
    console.error("Error getting following feed:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// FOLLOW REQUESTS ENDPOINTS
// ============================================

// Get pending follow requests for current user (people who want to follow you)
app.get("/make-server-e2505fcb/follow-requests/pending", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);

    console.log(`📬 Getting pending follow requests for user ${user.username} (${user.id})`);

    // First, get the follow requests
    const { data: requests, error } = await supabase
      .from("followers")
      .select("id, follower_id, created_at")
      .eq("followed_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending requests:", error);
      return c.json({ error: "Error fetching follow requests" }, 500);
    }

    if (!requests || requests.length === 0) {
      console.log(`✅ No pending requests found`);
      return c.json({ requests: [] });
    }

    // Then, get user details for each follower_id
    const followerIds = requests.map((r: any) => r.follower_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .in("id", followerIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return c.json({ error: "Error fetching user details" }, 500);
    }

    // Combine the data
    const usersMap = new Map(users?.map((u: any) => [u.id, u]) || []);
    const formattedRequests = requests.map((r: any) => {
      const userData = usersMap.get(r.follower_id);
      return {
        requestId: r.id,
        user: {
          id: userData?.id || r.follower_id,
          username: userData?.username || "Unknown",
          avatar: userData?.avatar_url || "",
        },
        createdAt: r.created_at,
        timestamp: getRelativeTime(r.created_at),
      };
    });

    console.log(`✅ Found ${formattedRequests.length} pending requests`);

    return c.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error getting follow requests:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Accept a follow request
app.post("/make-server-e2505fcb/follow-requests/:requestId/accept", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const requestId = c.req.param("requestId");
    const supabase = getSupabaseClient(true);

    console.log(`✅ User ${user.username} accepting follow request ${requestId}`);

    const { data: request, error: fetchError } = await supabase
      .from("followers")
      .select("*")
      .eq("id", requestId)
      .eq("followed_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchError || !request) {
      return c.json({ error: "Follow request not found" }, 404);
    }

    // Update status to accepted
    const { error } = await supabase
      .from("followers")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (error) {
      console.error("Error accepting follow request:", error);
      return c.json({ error: "Error accepting follow request" }, 500);
    }

    console.log(`✅ Follow request ${requestId} accepted`);

    return c.json({ success: true, message: "Follow request accepted" });
  } catch (error) {
    console.error("Error accepting follow request:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Reject a follow request
app.post("/make-server-e2505fcb/follow-requests/:requestId/reject", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const requestId = c.req.param("requestId");
    const supabase = getSupabaseClient(true);

    console.log(`❌ User ${user.username} rejecting follow request ${requestId}`);

    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("id", requestId)
      .eq("followed_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("Error rejecting follow request:", error);
      return c.json({ error: "Error rejecting follow request" }, 500);
    }

    console.log(`✅ Follow request ${requestId} rejected and removed`);

    return c.json({ success: true, message: "Follow request rejected" });
  } catch (error) {
    console.error("Error rejecting follow request:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get count of pending follow requests
app.get("/make-server-e2505fcb/follow-requests/count", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);

    console.log(`📊 Counting pending follow requests for user ${user.username} (${user.id})`);

    const { count, error } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("❌ Error counting pending requests:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error details:", error.details);
      console.error("❌ Error hint:", error.hint);
      return c.json({ 
        error: "Error counting follow requests", 
        code: error.code,
        details: error.message || error.details || "Unknown error"
      }, 500);
    }

    console.log(`✅ Pending requests count: ${count || 0}`);
    return c.json({ count: count || 0 });
  } catch (error) {
    console.error("❌ Exception in counting follow requests:", error);
    return c.json({ error: "Internal server error", details: String(error) }, 500);
  }
});

// Get outgoing pending follow requests (requests I sent)
app.get("/make-server-e2505fcb/follow-requests/outgoing", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);

    console.log(`📤 Getting outgoing pending follow requests for user ${user.username} (${user.id})`);

    // First, get the follow requests
    const { data: requests, error } = await supabase
      .from("followers")
      .select("id, followed_id, created_at")
      .eq("follower_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching outgoing requests:", error);
      return c.json({ error: "Error fetching outgoing follow requests" }, 500);
    }

    if (!requests || requests.length === 0) {
      console.log(`✅ No outgoing pending requests found`);
      return c.json({ requests: [] });
    }

    // Then, get user details for each followed_id
    const followedIds = requests.map((r: any) => r.followed_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .in("id", followedIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return c.json({ error: "Error fetching user details" }, 500);
    }

    // Combine the data
    const usersMap = new Map(users?.map((u: any) => [u.id, u]) || []);
    const formattedRequests = requests.map((r: any) => {
      const userData = usersMap.get(r.followed_id);
      return {
        requestId: r.id,
        user: {
          id: userData?.id || r.followed_id,
          username: userData?.username || "Unknown",
          avatar: userData?.avatar_url || "",
        },
        createdAt: r.created_at,
        timestamp: getRelativeTime(r.created_at),
      };
    });

    console.log(`✅ Found ${formattedRequests.length} outgoing pending requests`);

    return c.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error getting outgoing follow requests:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// PROFILE ENDPOINTS
// ============================================

// Upload profile image to Supabase Storage
app.post("/make-server-e2505fcb/upload-avatar", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    console.log("Uploading avatar for user:", user.id, "File:", file.name, file.type);

    const supabase = getSupabaseClient(true);

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketName = "Perfil_Imagen";
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.log("Creating bucket:", bucketName);
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    console.log("Uploading to:", filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return c.json({ error: "Error uploading file" }, 500);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log("Upload successful, public URL:", publicUrlData.publicUrl);

    // Update user's avatar_url in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user avatar_url:", updateError);
      return c.json({ error: "Error updating profile" }, 500);
    }

    return c.json({ 
      success: true, 
      avatarUrl: publicUrlData.publicUrl 
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update user profile
app.put("/make-server-e2505fcb/profile", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { username, avatar_url } = await c.req.json();
    const supabase = getSupabaseClient(true);

    // Check if new username is already taken (if username is being changed)
    if (username && username !== user.username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .maybeSingle();

      if (existingUser) {
        return c.json({ error: "Username already taken" }, 400);
      }
    }

    // Update user profile (only username and avatar_url, no 'name' field)
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return c.json({ error: "Error updating profile" }, 500);
    }

    return c.json({
      profile: {
        id: updatedUser.id,
        username: updatedUser.username,
        avatar: updatedUser.avatar_url,
        email: updatedUser.email,
        name: updatedUser.username, // Use username as name
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user stats (followers, following, lists count)
app.get("/make-server-e2505fcb/users/:userId/stats", async (c) => {
  try {
    const userId = c.req.param("userId");
    const supabase = getSupabaseClient(true);

    // Get followers count
    const { count: followersCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    // Get lists count
    const { count: listsCount } = await supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return c.json({
      followers: followersCount || 0,
      following: followingCount || 0,
      lists: listsCount || 0,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user public profile
app.get("/make-server-e2505fcb/users/:userId/profile", async (c) => {
  try {
    const userId = c.req.param("userId");
    const supabase = getSupabaseClient(true);

    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username, avatar_url, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      profile: {
        id: user.id,
        username: user.username,
        avatar: user.avatar_url,
        email: user.email,
        name: user.username,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's top lists (most liked, max 5) - respects privacy
app.get("/make-server-e2505fcb/users/:userId/top-lists", async (c) => {
  try {
    const userId = c.req.param("userId");
    const limit = parseInt(c.req.query("limit") || "5");
    const supabase = getSupabaseClient(true);

    // Check if user is public or if current user follows them
    const { data: targetUser } = await supabase
      .from("users")
      .select("is_public")
      .eq("id", userId)
      .single();

    const isPublic = targetUser?.is_public !== false;

    // Try to get current user
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    let currentUserId = null;
    let isFollowing = false;

    if (accessToken && accessToken !== publicAnonKey) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
        currentUserId = authUser?.id;

        if (currentUserId && currentUserId !== userId) {
          // Check if current user follows this user
          const { data: followData } = await supabase
            .from("followers")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("following_id", userId)
            .single();

          isFollowing = !!followData;
        }
      } catch (error) {
        console.log("No authenticated user for top-lists");
      }
    }

    // If user is private and current user doesn't follow them and isn't viewing their own profile
    if (!isPublic && !isFollowing && currentUserId !== userId) {
      return c.json({ lists: [] }); // Return empty array
    }

    // Get user's lists
    const { data: lists, error } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url, is_public),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user lists:", error);
      return c.json({ error: "Error fetching lists" }, 500);
    }

    // Get like counts for each list
    const listsWithLikes = await Promise.all(
      (lists || []).map(async (list: any) => {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("list_id", list.id);

        return {
          id: list.id,
          category: list.categories?.category_name || "General",
          subcategory: list.subcategories?.subcategory_name,
          genre: list.subcategories?.subcategory_name,
          title: list.title,
          description: list.description,
          author: {
            userId: list.users.id,
            name: list.users.username,
            username: list.users.username,
            avatar: list.users.avatar_url,
          },
          items: (list.items || [])
            .sort((a: any, b: any) => a.item_order - b.item_order)
            .map((item: any, index: number) => ({
              rank: index + 1,
              title: item.name,
              name: item.name,
              rating: item.rating,
              image: item.image_url,
              description: item.description,
            })),
          coverImage: list.items?.[0]?.image_url || "",
          likes: count || 0,
          comments: 0,
          timestamp: getRelativeTime(list.created_at),
          createdAt: list.created_at,
        };
      })
    );

    // Sort by likes (descending) and take top N
    const topLists = listsWithLikes
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);

    return c.json({ lists: topLists });
  } catch (error) {
    console.error("Error getting user top lists:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// COMMENTS ENDPOINTS
// ============================================

// Get comments for a list
app.get("/make-server-e2505fcb/lists/:listId/comments", async (c) => {
  try {
    const listId = c.req.param("listId");
    const supabase = getSupabaseClient(true);

    console.log(`💬 Fetching comments for list ${listId}`);

    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        users (
          id,
          username,
          avatar_url
        )
      `)
      .eq("list_id", listId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching comments:", error);
      return c.json({ error: "Error fetching comments" }, 500);
    }

    console.log(`✅ Found ${comments?.length || 0} comments`);

    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      timestamp: getRelativeTime(comment.created_at),
      user: {
        id: comment.users?.id || comment.user_id,
        username: comment.users?.username || "Usuario",
        avatar: comment.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`,
      },
    }));

    return c.json({ comments: formattedComments });
  } catch (error) {
    console.error("Error getting comments:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a comment to a list
app.post("/make-server-e2505fcb/lists/:listId/comments", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const listId = c.req.param("listId");
    const { content } = await c.req.json();

    if (!content || content.trim().length === 0) {
      return c.json({ error: "Comment cannot be empty" }, 400);
    }

    const supabase = getSupabaseClient(true);

    console.log(`💬 Adding comment to list ${listId} by user ${user.username}`);

    // Insert comment into database
    const { data: newComment, error } = await supabase
      .from("comments")
      .insert({
        list_id: listId,
        user_id: user.id,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Error creating comment:", error);
      return c.json({ error: "Error creating comment" }, 500);
    }

    console.log(`✅ Comment created successfully: ${newComment.id}`);

    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      createdAt: newComment.created_at,
      timestamp: getRelativeTime(newComment.created_at),
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar_url,
      },
    };

    return c.json({ comment: formattedComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a comment
app.delete("/make-server-e2505fcb/comments/:commentId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const commentId = c.req.param("commentId");
    const supabase = getSupabaseClient(true);

    // Check if comment exists and belongs to user
    const { data: comment } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment || comment.user_id !== user.id) {
      return c.json({ error: "Comment not found or unauthorized" }, 404);
    }

    // Delete comment from database
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("❌ Error deleting comment:", error);
      return c.json({ error: "Error deleting comment" }, 500);
    }

    console.log(`✅ Comment ${commentId} deleted successfully`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// TRENDING ENDPOINTS
// ============================================

// Get trending lists (most liked)
app.get("/make-server-e2505fcb/trending", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const limit = parseInt(c.req.query("limit") || "20");

    // Get all lists with their like counts (only public users)
    const { data: lists, error } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url, is_public),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*)
      `)
      .order("created_at", { ascending: false })
      .limit(100); // Get more to have a good pool for sorting

    if (error) {
      console.error("Error fetching lists:", error);
      return c.json({ error: "Error fetching trending lists" }, 500);
    }

    // Filter only public users for trending
    const publicLists = (lists || []).filter((list: any) => list.users.is_public !== false);

    // Get like counts for each list
    const listsWithLikes = await Promise.all(
      publicLists.map(async (list: any) => {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("list_id", list.id);

        return {
          id: list.id,
          category: list.categories?.category_name || "General",
          subcategory: list.subcategories?.subcategory_name,
          genre: list.subcategories?.subcategory_name,
          title: list.title,
          description: list.description,
          author: {
            userId: list.users.id,
            name: list.users.username,
            username: list.users.username,
            avatar: list.users.avatar_url,
          },
          items: (list.items || [])
            .sort((a: any, b: any) => a.item_order - b.item_order)
            .map((item: any, index: number) => ({
              rank: index + 1,
              title: item.name,
              name: item.name,
              rating: item.rating,
              image: item.image_url,
              description: item.description,
            })),
          coverImage: list.items?.[0]?.image_url || "",
          likes: count || 0,
          comments: 0,
          timestamp: getRelativeTime(list.created_at),
          createdAt: list.created_at,
        };
      })
    );

    // Sort by likes (descending) and take top N
    const trending = listsWithLikes
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);

    return c.json({ lists: trending });
  } catch (error) {
    console.error("Error getting trending:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// SUGGESTED USERS & SEARCH ENDPOINTS
// ============================================

// Get suggested users (up to 5, excluding current user and already followed)
app.get("/make-server-e2505fcb/users/suggested", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    const supabase = getSupabaseClient(true);

    let query = supabase
      .from("users")
      .select("id, username, avatar_url")
      .limit(5);

    // Exclude current user if authenticated
    if (user) {
      query = query.neq("id", user.id);

      // Get users that current user is already following or has pending requests to
      const { data: following } = await supabase
        .from("followers")
        .select("followed_id")
        .eq("follower_id", user.id);

      if (following && following.length > 0) {
        const followingIds = following.map((f: any) => f.followed_id);
        query = query.not("id", "in", `(${followingIds.join(",")})`);
      }
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching suggested users:", error);
      return c.json({ error: "Error fetching suggested users" }, 500);
    }

    const suggestedUsers = (users || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar_url,
    }));

    return c.json({ users: suggestedUsers });
  } catch (error) {
    console.error("Error getting suggested users:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Search users and lists
app.get("/make-server-e2505fcb/search", async (c) => {
  try {
    const query = c.req.query("q");
    console.log("Search query received:", query);
    
    if (!query || query.trim().length === 0) {
      return c.json({ users: [], lists: [] });
    }

    const supabase = getSupabaseClient(true);
    const searchTerm = `%${query.toLowerCase()}%`;
    console.log("Search term prepared:", searchTerm);

    // Search users by username, name or email
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar_url, email")
      .or(`username.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10);

    console.log("Users search result:", { count: users?.length || 0, error: usersError });
    if (usersError) {
      console.error("Error searching users:", usersError);
    }

    // Try to get current user for privacy check
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    let currentUserId = null;
    let followingIds: string[] = [];

    if (accessToken && accessToken !== publicAnonKey) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
        if (authUser) {
          currentUserId = authUser.id;
          
          // Get list of users that current user follows
          const { data: following } = await supabase
            .from("followers")
            .select("following_id")
            .eq("follower_id", currentUserId);
          
          followingIds = following?.map(f => f.following_id) || [];
        }
      } catch (error) {
        console.log("No authenticated user for search");
      }
    }

    // Search lists
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select(`
        id,
        title,
        description,
        created_at,
        users!lists_user_id_fkey (id, username, avatar_url, is_public),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name)
      `)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(20); // Get more to have enough after filtering

    console.log("Lists search result:", { count: lists?.length || 0, error: listsError });
    if (listsError) {
      console.error("Error searching lists:", listsError);
    }

    // Filter lists based on privacy settings
    const filteredLists = (lists || []).filter((list: any) => {
      const userIsPublic = list.users.is_public !== false;
      const isOwnList = currentUserId && list.users.id === currentUserId;
      const isFollowing = currentUserId && followingIds.includes(list.users.id);
      
      return userIsPublic || isOwnList || isFollowing;
    }).slice(0, 10); // Take top 10 after filtering

    const formattedUsers = (users || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name || u.username,
      avatar: u.avatar_url,
    }));

    const formattedLists = filteredLists.map((list: any) => ({
      id: list.id,
      title: list.title,
      description: list.description,
      category: list.categories?.category_name || "General",
      subcategory: list.subcategories?.subcategory_name,
      author: {
        userId: list.users.id,
        username: list.users.username,
        avatar: list.users.avatar_url,
      },
      timestamp: getRelativeTime(list.created_at),
    }));

    console.log("Formatted results:", { users: formattedUsers.length, lists: formattedLists.length });

    return c.json({ 
      users: formattedUsers, 
      lists: formattedLists 
    });
  } catch (error) {
    console.error("Error searching:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get list detail by ID
app.get("/make-server-e2505fcb/lists/:listId/detail", async (c) => {
  try {
    const listId = c.req.param("listId");
    const supabase = getSupabaseClient(true);

    const { data: list, error } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*)
      `)
      .eq("id", listId)
      .single();

    if (error || !list) {
      return c.json({ error: "List not found" }, 404);
    }

    // Get like count
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("list_id", listId);

    const formattedList = {
      id: list.id,
      category: list.categories?.category_name || "General",
      subcategory: list.subcategories?.subcategory_name,
      genre: list.subcategories?.subcategory_name,
      title: list.title,
      description: list.description,
      author: {
        userId: list.users.id,
        name: list.users.username,
        username: list.users.username,
        avatar: list.users.avatar_url,
      },
      items: (list.items || [])
        .sort((a: any, b: any) => a.item_order - b.item_order)
        .map((item: any, index: number) => ({
          rank: index + 1,
          title: item.name,
          name: item.name,
          rating: item.rating,
          image: item.image_url,
          description: item.description,
        })),
      coverImage: list.items?.[0]?.image_url || "",
      likes: likesCount || 0,
      comments: 0,
      timestamp: getRelativeTime(list.created_at),
      createdAt: list.created_at,
    };

    return c.json({ list: formattedList });
  } catch (error) {
    console.error("Error getting list detail:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get top rated items by category
app.get("/make-server-e2505fcb/top-items", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const categoryParam = c.req.query("category");
    
    console.log("🏆 Fetching top rated items", categoryParam ? `for category: ${categoryParam}` : "for all categories");

    // Get all items with their list's category
    const { data: items, error } = await supabase
      .from("items")
      .select(`
        id,
        name,
        rating,
        image_url,
        description,
        lists!items_list_id_fkey (
          id,
          category_id,
          categories!lists_category_id_fkey (id, category_name)
        )
      `)
      .gt("rating", 0); // Only items with rating > 0

    if (error) {
      console.error("❌ Error fetching items:", error);
      return c.json({ error: "Error fetching top items" }, 500);
    }

    console.log(`✅ Found ${items?.length || 0} rated items`);

    // Group items by category and calculate average rating per unique item name
    const itemsByCategory: any = {};

    items?.forEach((item: any) => {
      const categoryName = item.lists?.categories?.category_name || "General";
      
      // Filter by category if specified
      if (categoryParam && categoryName !== categoryParam) {
        return;
      }

      if (!itemsByCategory[categoryName]) {
        itemsByCategory[categoryName] = {};
      }

      const itemName = item.name.toLowerCase().trim();
      
      if (!itemsByCategory[categoryName][itemName]) {
        itemsByCategory[categoryName][itemName] = {
          name: item.name, // Keep original name
          totalRating: 0,
          count: 0,
          image: item.image_url,
          description: item.description,
        };
      }

      itemsByCategory[categoryName][itemName].totalRating += item.rating;
      itemsByCategory[categoryName][itemName].count += 1;
      
      // Keep the best image (prefer non-empty)
      if (item.image_url && !itemsByCategory[categoryName][itemName].image) {
        itemsByCategory[categoryName][itemName].image = item.image_url;
      }
    });

    // Calculate averages and format response
    const topItemsByCategory: any = {};

    Object.keys(itemsByCategory).forEach(category => {
      const itemsMap = itemsByCategory[category];
      const itemsArray = Object.values(itemsMap).map((item: any) => ({
        name: item.name,
        averageRating: item.totalRating / item.count,
        appearances: item.count,
        image: item.image,
        description: item.description,
      }));

      // Sort by average rating (descending) and take top 10
      topItemsByCategory[category] = itemsArray
        .sort((a: any, b: any) => b.averageRating - a.averageRating)
        .slice(0, 10)
        .map((item: any, index: number) => ({
          rank: index + 1,
          ...item,
        }));
    });

    console.log(`✅ Calculated top items for ${Object.keys(topItemsByCategory).length} categories`);

    return c.json({ topItems: topItemsByCategory });
  } catch (error) {
    console.error("❌ Error getting top items:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get top categories with most lists
app.get("/make-server-e2505fcb/top-categories", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    
    console.log("📊 Fetching top categories...");

    // Get all lists with their categories and subcategories
    const { data: lists, error } = await supabase
      .from("lists")
      .select(`
        id,
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name)
      `);

    if (error) {
      console.error("❌ Error fetching lists for top categories:", error);
      return c.json({ error: "Error fetching top categories" }, 500);
    }

    console.log(`✅ Found ${lists?.length || 0} lists`);

    // Count lists by category/subcategory combination
    const categoryCounts: any = {};

    lists?.forEach((list: any) => {
      const categoryName = list.categories?.category_name || "General";
      const subcategoryName = list.subcategories?.subcategory_name;

      let key: string;
      let displayName: string;

      if (subcategoryName) {
        // If there's a subcategory, use "Category - Subcategory" format
        key = `${categoryName}-${subcategoryName}`;
        displayName = subcategoryName; // Show only subcategory name
      } else {
        key = categoryName;
        displayName = categoryName;
      }

      if (!categoryCounts[key]) {
        categoryCounts[key] = {
          name: displayName,
          category: categoryName,
          subcategory: subcategoryName,
          count: 0,
        };
      }

      categoryCounts[key].count += 1;
    });

    // Convert to array and sort by count (descending)
    const topCategories = Object.values(categoryCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5) // Get top 5
      .map((cat: any) => ({
        name: cat.name,
        category: cat.category,
        subcategory: cat.subcategory,
        listsCount: cat.count,
      }));

    console.log(`✅ Top categories calculated:`, topCategories);

    return c.json({ topCategories });
  } catch (error) {
    console.error("❌ Error getting top categories:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Search movies and TV shows from TMDb
app.get("/make-server-e2505fcb/search-media", async (c) => {
  try {
    const query = c.req.query("query");
    
    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }
    
    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (!apiKey) {
      console.error("❌ TMDB_API_KEY not configured");
      return c.json({ error: "TMDb API key not configured" }, 500);
    }
    
    // Search both movies and TV shows
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=es-ES&page=1`
    );
    
    if (!response.ok) {
      console.error("❌ TMDb API error:", response.status, response.statusText);
      return c.json({ error: "Error searching TMDb" }, 500);
    }
    
    const data = await response.json();
    
    // Filter only movies and TV shows, format results
    const results = (data.results || [])
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.media_type === "movie" ? item.title : item.name,
        originalTitle: item.media_type === "movie" ? item.original_title : item.original_name,
        year: item.media_type === "movie" 
          ? item.release_date?.split("-")[0] 
          : item.first_air_date?.split("-")[0],
        type: item.media_type === "movie" ? "Película" : "Serie",
        image: item.poster_path 
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
          : null,
        overview: item.overview,
        rating: item.vote_average ? item.vote_average.toFixed(1) : null,
      }));
    
    return c.json({ results });
  } catch (error) {
    console.error("❌ Error in search-media endpoint:", error);
    return c.json({ error: "Internal server error while searching media" }, 500);
  }
});

// Search board games - Using Board Game Geek API
app.get("/make-server-e2505fcb/search-boardgames", async (c) => {
  try {
    const query = c.req.query("query");
    
    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }
    
    console.log(`🎲 Searching BGG for: ${query}`);
    
    // Step 1: Search BGG for games
    const searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
    console.log(`📡 BGG Search URL: ${searchUrl}`);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'BoardGameTopList/1.0 (contact@toplist.app)',
        'Accept': 'application/xml'
      }
    });
    if (!searchResponse.ok) {
      console.error(`❌ BGG search failed: ${searchResponse.status}`);
      return c.json({ results: [] });
    }
    
    const searchXml = await searchResponse.text();
    console.log(`📄 BGG XML response received`);
    
    // Parse XML to extract game IDs
    const gameIdMatches = searchXml.matchAll(/<item[^>]+id="(\d+)"[^>]*>/g);
    const gameIds: string[] = [];
    const nameMap: { [key: string]: { name: string; year: string } } = {};
    
    for (const match of gameIdMatches) {
      const id = match[1];
      gameIds.push(id);
      
      // Extract name and year from this item
      const itemStart = match.index || 0;
      const itemEnd = searchXml.indexOf('</item>', itemStart);
      const itemXml = searchXml.substring(itemStart, itemEnd);
      
      const nameMatch = itemXml.match(/<name[^>]+value="([^"]+)"/);
      const yearMatch = itemXml.match(/<yearpublished[^>]+value="([^"]+)"/);
      
      if (nameMatch) {
        nameMap[id] = {
          name: nameMatch[1],
          year: yearMatch ? yearMatch[1] : 'N/A'
        };
      }
    }
    
    if (gameIds.length === 0) {
      console.log(`ℹ️ No games found for query: ${query}`);
      return c.json({ results: [] });
    }
    
    console.log(`✅ Found ${gameIds.length} games, fetching details...`);
    
    // Step 2: Get details for up to 10 games
    const limitedIds = gameIds.slice(0, 10);
    const detailsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${limitedIds.join(',')}&stats=1`;
    console.log(`📡 BGG Details URL: ${detailsUrl}`);
    
    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'User-Agent': 'BoardGameTopList/1.0 (contact@toplist.app)',
        'Accept': 'application/xml'
      }
    });
    if (!detailsResponse.ok) {
      console.error(`❌ BGG details failed: ${detailsResponse.status}`);
      return c.json({ results: [] });
    }
    
    const detailsXml = await detailsResponse.text();
    
    // Parse details XML
    const results = [];
    const itemMatches = detailsXml.matchAll(/<item[^>]+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const id = match[1];
      const itemContent = match[2];
      
      // Extract data from XML
      const nameMatch = itemContent.match(/<name[^>]+type="primary"[^>]+value="([^"]+)"/);
      const yearMatch = itemContent.match(/<yearpublished[^>]+value="(\d+)"/);
      const imageMatch = itemContent.match(/<image>([^<]+)<\/image>/);
      const descMatch = itemContent.match(/<description>([^<]+)<\/description>/);
      const ratingMatch = itemContent.match(/<average[^>]+value="([^"]+)"/);
      
      const name = nameMatch ? nameMatch[1] : (nameMap[id]?.name || 'Unknown');
      const year = yearMatch ? yearMatch[1] : (nameMap[id]?.year || 'N/A');
      const image = imageMatch ? imageMatch[1] : null;
      const description = descMatch ? descMatch[1].replace(/&#10;/g, ' ').substring(0, 200) : '';
      const rating = ratingMatch && ratingMatch[1] !== '0' ? parseFloat(ratingMatch[1]).toFixed(1) : null;
      
      results.push({
        id: parseInt(id),
        title: name,
        year: year,
        image: image,
        description: description,
        rating: rating
      });
    }
    
    console.log(`✅ Returning ${results.length} board games with details`);
    
    return c.json({ results });
  } catch (error) {
    console.error("❌ Error in search-boardgames endpoint:", error);
    return c.json({ error: "Internal server error while searching board games" }, 500);
  }
});

// Search books from Google Books API
app.get("/make-server-e2505fcb/search-books", async (c) => {
  try {
    const query = c.req.query("query");
    
    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }
    
    console.log(`📚 Searching books for: ${query}`);
    
    // Call Google Books API - no API key needed for basic searches
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&langRestrict=es&orderBy=relevance`
    );
    
    if (!response.ok) {
      console.error("❌ Google Books API error:", response.status, response.statusText);
      return c.json({ error: "Error searching Google Books" }, 500);
    }
    
    const data = await response.json();
    
    // Format results
    const results = (data.items || [])
      .map((item: any) => {
        const volumeInfo = item.volumeInfo || {};
        
        return {
          id: item.id,
          title: volumeInfo.title || "Sin título",
          authors: volumeInfo.authors || [],
          year: volumeInfo.publishedDate ? volumeInfo.publishedDate.split("-")[0] : "N/A",
          image: volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || null,
          description: volumeInfo.description || "Sin descripción disponible",
        };
      })
      .slice(0, 10);
    
    console.log(`✅ Found ${results.length} matching books`);
    
    return c.json({ results });
  } catch (error) {
    console.error("❌ Error in search-books endpoint:", error);
    return c.json({ error: "Internal server error while searching books" }, 500);
  }
});

// Search music from TheAudioDB API
app.get("/make-server-e2505fcb/search-music", async (c) => {
  try {
    const query = c.req.query("query");
    
    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }
    
    console.log(`🎵 Searching music for: ${query}`);
    
    const results: any[] = [];
    
    // Search for artists
    try {
      const artistResponse = await fetch(
        `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(query)}`
      );
      
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        
        if (artistData.artists) {
          artistData.artists.forEach((artist: any) => {
            results.push({
              id: `artist-${artist.idArtist}`,
              title: artist.strArtist,
              artist: artist.strArtist,
              year: artist.intFormedYear || "N/A",
              type: "Artista",
              image: artist.strArtistThumb || artist.strArtistLogo || null,
              description: artist.strBiographyES || artist.strBiographyEN || `Artista de ${artist.strGenre || "música"}`,
            });
          });
        }
      }
    } catch (error) {
      console.log("⚠️ Artist search failed:", error);
    }
    
    // Search for albums
    try {
      const albumResponse = await fetch(
        `https://www.theaudiodb.com/api/v1/json/2/searchalbum.php?s=${encodeURIComponent(query)}`
      );
      
      if (albumResponse.ok) {
        const albumData = await albumResponse.json();
        
        if (albumData.album) {
          albumData.album.forEach((album: any) => {
            results.push({
              id: `album-${album.idAlbum}`,
              title: album.strAlbum,
              artist: album.strArtist,
              year: album.intYearReleased || "N/A",
              type: "Álbum",
              image: album.strAlbumThumb || null,
              description: album.strDescriptionES || album.strDescriptionEN || `Álbum de ${album.strArtist}`,
            });
          });
        }
      }
    } catch (error) {
      console.log("⚠️ Album search failed:", error);
    }
    
    // Sort results: artists first, then albums, and limit to 10
    const sortedResults = [
      ...results.filter(r => r.type === "Artista"),
      ...results.filter(r => r.type === "Álbum"),
    ].slice(0, 10);
    
    console.log(`✅ Found ${sortedResults.length} matching music results (${results.filter(r => r.type === "Artista").length} artists, ${results.filter(r => r.type === "Álbum").length} albums)`);
    
    return c.json({ results: sortedResults });
  } catch (error) {
    console.error("❌ Error in search-music endpoint:", error);
    return c.json({ error: "Internal server error while searching music" }, 500);
  }
});

// Search videogames from RAWG Video Games Database
app.get("/make-server-e2505fcb/search-videogames", async (c) => {
  try {
    const query = c.req.query("query");
    
    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }
    
    const apiKey = Deno.env.get("RAWG_API_KEY");
    if (!apiKey) {
      console.error("❌ RAWG_API_KEY not configured");
      return c.json({ error: "RAWG API key not configured" }, 500);
    }
    
    console.log(`🎮 Searching videogames for: ${query}`);
    
    // Search videogames using RAWG API
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=10`
    );
    
    if (!response.ok) {
      console.error("❌ RAWG API error:", response.status, response.statusText);
      return c.json({ error: "Error searching RAWG" }, 500);
    }
    
    const data = await response.json();
    
    // Format results
    const results = (data.results || [])
      .map((game: any) => ({
        id: game.id,
        title: game.name,
        year: game.released ? game.released.split("-")[0] : "N/A",
        platforms: game.platforms?.map((p: any) => p.platform.name).join(", ") || "N/A",
        genres: game.genres?.map((g: any) => g.name).join(", ") || "N/A",
        image: game.background_image || null,
        rating: game.rating ? game.rating.toString() : null,
        metacritic: game.metacritic || null,
      }))
      .slice(0, 10);
    
    console.log(`✅ Found ${results.length} matching videogames`);
    
    return c.json({ results });
  } catch (error) {
    console.error("❌ Error in search-videogames endpoint:", error);
    return c.json({ error: "Internal server error while searching videogames" }, 500);
  }
});

// ==================== FAVORITES ENDPOINTS ====================

// Toggle favorite (add/remove)
app.post("/make-server-e2505fcb/lists/:listId/favorite", async (c) => {
  try {
    const listId = c.req.param("listId");
    const user = await getAuthenticatedUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const supabase = getSupabaseClient(true);
    
    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("list_id", listId)
      .single();
    
    if (existing) {
      // Remove from favorites
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("list_id", listId);
      
      console.log(`✅ User ${user.username} removed list ${listId} from favorites`);
      return c.json({ favorited: false });
    } else {
      // Add to favorites
      await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          list_id: listId,
        });
      
      console.log(`✅ User ${user.username} added list ${listId} to favorites`);
      return c.json({ favorited: true });
    }
  } catch (error) {
    console.error("❌ Error toggling favorite:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check if list is favorited
app.get("/make-server-e2505fcb/lists/:listId/is-favorited", async (c) => {
  try {
    const listId = c.req.param("listId");
    
    // Try to get authenticated user, but don't fail if token is invalid
    let user = null;
    try {
      user = await getAuthenticatedUser(c.req.raw);
    } catch (authError) {
      console.log("Could not authenticate user for favorite status, returning false");
      return c.json({ isFavorited: false });
    }
    
    if (!user) {
      return c.json({ isFavorited: false });
    }
    
    const supabase = getSupabaseClient(true);
    
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("list_id", listId)
      .single();
    
    return c.json({ isFavorited: !!data });
  } catch (error) {
    console.error("❌ Error checking favorite status:", error);
    return c.json({ isFavorited: false });
  }
});

// Get user's favorite lists
app.get("/make-server-e2505fcb/favorites", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const supabase = getSupabaseClient(true);
    
    // Get favorite list IDs
    const { data: favorites, error: favError } = await supabase
      .from("favorites")
      .select("list_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (favError) {
      console.error("Error fetching favorites:", favError);
      return c.json({ error: "Failed to fetch favorites" }, 500);
    }
    
    if (!favorites || favorites.length === 0) {
      return c.json({ lists: [] });
    }
    
    const listIds = favorites.map(f => f.list_id);
    
    // Get full list details
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select(`
        *,
        users!lists_user_id_fkey (id, username, avatar_url),
        categories!lists_category_id_fkey (id, category_name),
        subcategories!lists_subcategory_id_fkey (id, subcategory_name),
        items (*),
        comments (count)
      `)
      .in("id", listIds);
    
    if (listsError) {
      console.error("Error fetching favorite lists:", listsError);
      return c.json({ error: "Failed to fetch favorite lists" }, 500);
    }
    
    // Format the response with like counts
    const formattedLists = await Promise.all(
      (lists || []).map(async (list: any) => {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("list_id", list.id);
        
        return {
          id: list.id,
          title: list.title,
          description: list.description,
          category: list.categories?.category_name || "General",
          subcategory: list.subcategories?.subcategory_name,
          genre: list.subcategories?.subcategory_name,
          items: (list.items || [])
            .sort((a: any, b: any) => a.item_order - b.item_order)
            .map((item: any, index: number) => ({
              rank: index + 1,
              title: item.name,
              name: item.name,
              rating: item.rating,
              image: item.image_url,
              description: item.description,
            })),
          coverImage: list.items?.[0]?.image_url || "",
          author: {
            userId: list.users.id,
            name: list.users.username,
            username: list.users.username,
            avatar: list.users.avatar_url,
          },
          likes: count || 0,
          comments: list.comments?.[0]?.count || 0,
          timestamp: new Date(list.created_at).toISOString(),
          createdAt: list.created_at,
        };
      })
    );
    
    // Sort by when they were favorited (most recent first)
    const favoritesMap = new Map(favorites.map(f => [f.list_id, f.created_at]));
    formattedLists.sort((a, b) => {
      const aTime = new Date(favoritesMap.get(a.id) || 0).getTime();
      const bTime = new Date(favoritesMap.get(b.id) || 0).getTime();
      return bTime - aTime;
    });
    
    console.log(`✅ Fetched ${formattedLists.length} favorite lists for user ${user.username}`);
    return c.json({ lists: formattedLists });
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== RADAR ENDPOINTS ====================

// Add item to radar
app.post("/make-server-e2505fcb/radar", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { itemTitle, itemDescription, itemImage, category, listId, listTitle, notes } = await c.req.json();

    if (!itemTitle || !category) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = getSupabaseClient(true);

    // Insert into radar table
    const { data: radarItem, error } = await supabase
      .from("radar")
      .insert({
        user_id: user.id,
        item_title: itemTitle,
        item_description: itemDescription || "",
        item_image: itemImage || "",
        category,
        list_id: listId || "",
        list_title: listTitle || "",
        notes: notes || "",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error adding item to radar:", error);
      return c.json({ error: "Error adding item to radar" }, 500);
    }

    // Format response to match frontend expectations
    const formattedItem = {
      id: radarItem.id,
      userId: radarItem.user_id,
      itemTitle: radarItem.item_title,
      itemDescription: radarItem.item_description,
      itemImage: radarItem.item_image,
      category: radarItem.category,
      listId: radarItem.list_id,
      listTitle: radarItem.list_title,
      notes: radarItem.notes,
      addedAt: radarItem.added_at,
    };

    console.log(`✅ Item added to radar for user ${user.username}`);
    return c.json({ radarItem: formattedItem });
  } catch (error) {
    console.error("❌ Error adding item to radar:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all radar items for user
app.get("/make-server-e2505fcb/radar", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);

    const { data: items, error } = await supabase
      .from("radar")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching radar items:", error);
      return c.json({ error: "Error fetching radar items" }, 500);
    }

    // Format response to match frontend expectations
    const radarItems = (items || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      itemTitle: item.item_title,
      itemDescription: item.item_description,
      itemImage: item.item_image,
      category: item.category,
      listId: item.list_id,
      listTitle: item.list_title,
      notes: item.notes,
      addedAt: item.added_at,
    }));

    console.log(`✅ Retrieved ${radarItems.length} radar items for user ${user.username}`);
    return c.json({ radarItems });
  } catch (error) {
    console.error("❌ Error fetching radar items:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update radar item notes
app.put("/make-server-e2505fcb/radar/:radarItemId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const radarItemId = c.req.param("radarItemId");
    const { notes } = await c.req.json();

    const supabase = getSupabaseClient(true);

    // Update the notes
    const { data: updatedItem, error } = await supabase
      .from("radar")
      .update({ notes: notes || "" })
      .eq("id", radarItemId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating radar item:", error);
      return c.json({ error: "Radar item not found or unauthorized" }, 404);
    }

    // Format response to match frontend expectations
    const formattedItem = {
      id: updatedItem.id,
      userId: updatedItem.user_id,
      itemTitle: updatedItem.item_title,
      itemDescription: updatedItem.item_description,
      itemImage: updatedItem.item_image,
      category: updatedItem.category,
      listId: updatedItem.list_id,
      listTitle: updatedItem.list_title,
      notes: updatedItem.notes,
      addedAt: updatedItem.added_at,
    };

    console.log(`✅ Updated notes for radar item ${radarItemId}`);
    return c.json({ radarItem: formattedItem });
  } catch (error) {
    console.error("❌ Error updating radar item:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Remove item from radar
app.delete("/make-server-e2505fcb/radar/:radarItemId", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const radarItemId = c.req.param("radarItemId");

    const supabase = getSupabaseClient(true);

    const { error } = await supabase
      .from("radar")
      .delete()
      .eq("id", radarItemId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Error removing radar item:", error);
      return c.json({ error: "Error removing radar item" }, 500);
    }

    console.log(`✅ Removed item from radar for user ${user.username}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error removing radar item:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check if item is in radar
app.get("/make-server-e2505fcb/radar/check", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const itemTitle = c.req.query("itemTitle");
    const category = c.req.query("category");

    if (!itemTitle || !category) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    const supabase = getSupabaseClient(true);

    const { data: existingItem, error } = await supabase
      .from("radar")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_title", itemTitle)
      .eq("category", category)
      .maybeSingle();

    if (error) {
      console.error("❌ Error checking radar status:", error);
      return c.json({ error: "Error checking radar status" }, 500);
    }

    return c.json({ 
      inRadar: !!existingItem,
      radarItemId: existingItem?.id || null
    });
  } catch (error) {
    console.error("❌ Error checking radar status:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get trending radar items from the community
app.get("/make-server-e2505fcb/radar/trending", async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);

    // Get radar items from the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: radarItems, error } = await supabase
      .from("radar")
      .select("item_title, item_image, category, added_at")
      .gte("added_at", threeMonthsAgo.toISOString())
      .order("added_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching trending radar items:", error);
      return c.json({ error: "Error fetching trending radar items" }, 500);
    }

    // Count occurrences of each item (by itemTitle + category)
    const itemCounts: Record<string, { 
      title: string; 
      category: string; 
      count: number;
      image: string;
    }> = {};
    
    (radarItems || []).forEach((item: any) => {
      const key = `${item.item_title}-${item.category}`;
      if (!itemCounts[key]) {
        itemCounts[key] = { 
          title: item.item_title,
          category: item.category,
          count: 0,
          image: item.item_image || ""
        };
      }
      itemCounts[key].count++;
    });

    // Sort by count and get top 10
    const trendingItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log(`✅ Retrieved ${trendingItems.length} trending radar items`);
    return c.json({ trendingItems });
  } catch (error) {
    console.error("❌ Error fetching trending radar items:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);