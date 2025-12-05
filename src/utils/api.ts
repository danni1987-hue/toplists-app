import { projectId, publicAnonKey } from "./supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e2505fcb`;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
    ...options.headers,
  };

  console.log(`📡 API Call to ${endpoint}`);
  console.log(`🔑 Token:`, accessToken ? `${accessToken.substring(0, 20)}...` : "using publicAnonKey");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ API error on ${endpoint}:`, data);
    throw new Error(data.error || "API request failed");
  }

  console.log(`✅ API success on ${endpoint}`);
  return data;
}

export const api = {
  // Auth
  signup: async (email: string, password: string, name: string, username: string) => {
    return apiCall("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name, username }),
    });
  },

  getProfile: async (accessToken: string) => {
    return apiCall("/profile", {}, accessToken);
  },

  // Lists
  getLists: async (accessToken?: string) => {
    return apiCall("/lists", {}, accessToken);
  },

  getMyLists: async (accessToken: string) => {
    return apiCall("/my-lists", {}, accessToken);
  },

  createList: async (listData: any, accessToken: string) => {
    return apiCall(
      "/lists",
      {
        method: "POST",
        body: JSON.stringify(listData),
      },
      accessToken
    );
  },

  updateList: async (id: string, updates: any, accessToken: string) => {
    return apiCall(
      `/lists/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      },
      accessToken
    );
  },

  deleteList: async (id: string, accessToken: string) => {
    return apiCall(
      `/lists/${id}`,
      {
        method: "DELETE",
      },
      accessToken
    );
  },

  // Categories
  getCategories: async () => {
    return apiCall("/categories");
  },

  // Likes
  toggleLike: async (listId: string, accessToken: string) => {
    return apiCall(`/lists/${listId}/like`, { method: "POST" }, accessToken);
  },

  getLikes: async (listId: string, accessToken?: string) => {
    return apiCall(`/lists/${listId}/likes`, {}, accessToken);
  },

  // Followers
  toggleFollow: async (userId: string, accessToken: string) => {
    return apiCall(`/users/${userId}/follow`, { method: "POST" }, accessToken);
  },

  getFollowStatus: async (userId: string, accessToken?: string) => {
    return apiCall(`/users/${userId}/follow-status`, {}, accessToken);
  },

  getFollowers: async (userId: string) => {
    return apiCall(`/users/${userId}/followers`);
  },

  getFollowing: async (userId: string) => {
    return apiCall(`/users/${userId}/following`);
  },

  // Get feed from followed users
  getFollowingFeed: async (accessToken: string) => {
    return apiCall("/following-feed", {}, accessToken);
  },

  // Profile
  updateProfile: async (
    profile: { username?: string; avatar_url?: string },
    accessToken: string
  ) => {
    return apiCall(
      "/profile",
      {
        method: "PUT",
        body: JSON.stringify(profile),
      },
      accessToken
    );
  },

  updateSettings: async (
    settings: { is_public?: boolean },
    accessToken: string
  ) => {
    return apiCall(
      "/profile/settings",
      {
        method: "PUT",
        body: JSON.stringify(settings),
      },
      accessToken
    );
  },

  uploadAvatar: async (file: File, accessToken: string) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  },

  getUserStats: async (userId: string) => {
    return apiCall(`/users/${userId}/stats`);
  },

  getUserProfile: async (userId: string) => {
    return apiCall(`/users/${userId}/profile`);
  },

  getUserTopLists: async (userId: string, limit: number = 5) => {
    return apiCall(`/users/${userId}/top-lists?limit=${limit}`);
  },

  // Trending
  getTrending: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : "";
    return apiCall(`/trending${query}`);
  },

  // Suggested Users
  getSuggestedUsers: async (accessToken?: string) => {
    return apiCall("/users/suggested", {}, accessToken);
  },

  // Search
  search: async (query: string) => {
    return apiCall(`/search?q=${encodeURIComponent(query)}`);
  },

  // Follow Requests
  getFollowRequests: async (accessToken: string) => {
    return apiCall("/follow-requests/pending", {}, accessToken);
  },

  acceptFollowRequest: async (requestId: string, accessToken: string) => {
    return apiCall(
      `/follow-requests/${requestId}/accept`,
      { method: "POST" },
      accessToken
    );
  },

  rejectFollowRequest: async (requestId: string, accessToken: string) => {
    return apiCall(
      `/follow-requests/${requestId}/reject`,
      { method: "POST" },
      accessToken
    );
  },

  getPendingFollowRequestsCount: async (accessToken: string) => {
    return apiCall("/follow-requests/count", {}, accessToken);
  },

  // Get outgoing pending requests (requests I sent)
  getOutgoingPendingRequests: async (accessToken: string) => {
    return apiCall("/follow-requests/outgoing", {}, accessToken);
  },

  // Cancel outgoing follow request
  cancelFollowRequest: async (userId: string, accessToken: string) => {
    return apiCall(`/users/${userId}/follow`, { method: "POST" }, accessToken);
  },

  // Get list detail
  getListDetail: async (listId: string) => {
    return apiCall(`/lists/${listId}/detail`);
  },

  // Get top rated items by category
  getTopItems: async (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiCall(`/top-items${query}`);
  },

  // Get top categories with most lists
  getTopCategories: async () => {
    return apiCall("/top-categories");
  },

  // Comments
  getComments: async (listId: string) => {
    return apiCall(`/lists/${listId}/comments`);
  },

  addComment: async (listId: string, content: string, accessToken: string) => {
    return apiCall(
      `/lists/${listId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      accessToken
    );
  },

  deleteComment: async (commentId: string, accessToken: string) => {
    return apiCall(
      `/comments/${commentId}`,
      {
        method: "DELETE",
      },
      accessToken
    );
  },

  // Favorites
  toggleFavorite: async (listId: string, accessToken: string) => {
    return apiCall(`/lists/${listId}/favorite`, { method: "POST" }, accessToken);
  },

  getFavorites: async (accessToken: string) => {
    return apiCall("/favorites", {}, accessToken);
  },

  checkFavorite: async (listId: string, accessToken: string) => {
    return apiCall(`/lists/${listId}/is-favorited`, {}, accessToken);
  },

  // Radar
  addToRadar: async (
    itemData: {
      itemTitle: string;
      itemDescription?: string;
      itemImage?: string;
      category: string;
      listId?: string;
      listTitle?: string;
      notes?: string;
    },
    accessToken: string
  ) => {
    return apiCall(
      "/radar",
      {
        method: "POST",
        body: JSON.stringify(itemData),
      },
      accessToken
    );
  },

  getRadarItems: async (accessToken: string) => {
    return apiCall("/radar", {}, accessToken);
  },

  updateRadarNotes: async (radarItemId: string, notes: string, accessToken: string) => {
    return apiCall(
      `/radar/${radarItemId}`,
      {
        method: "PUT",
        body: JSON.stringify({ notes }),
      },
      accessToken
    );
  },

  removeFromRadar: async (radarItemId: string, accessToken: string) => {
    return apiCall(
      `/radar/${radarItemId}`,
      {
        method: "DELETE",
      },
      accessToken
    );
  },

  checkRadarStatus: async (itemTitle: string, category: string, accessToken: string) => {
    return apiCall(
      `/radar/check?itemTitle=${encodeURIComponent(itemTitle)}&category=${encodeURIComponent(category)}`,
      {},
      accessToken
    );
  },

  getTrendingRadarItems: async (accessToken: string) => {
    return apiCall("/radar/trending", {}, accessToken);
  },
};

// Helper function to get categories
export async function getCategories() {
  const response = await api.getCategories();
  return response.categories || [];
}