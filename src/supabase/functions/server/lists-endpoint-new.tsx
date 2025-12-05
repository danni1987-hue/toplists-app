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
          
          // Get list of users that current user follows
          const { data: following, error: followError } = await supabase
            .from("followers")
            .select("followed_id")
            .eq("follower_id", currentUserId);
          
          if (followError) {
            console.error("⚠️ Error fetching following:", followError);
          } else {
            followingIds = following?.map(f => f.followed_id) || [];
            console.log(`🔍 User ${currentUserId} follows ${followingIds.length} users`);
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
        
        const shouldShow = userIsPublic || isOwnList || isFollowing;
        
        console.log(`📋 List "${list.title}" - user: ${list.users.username}, is_public: ${list.users.is_public}, show: ${shouldShow}`);
        
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
