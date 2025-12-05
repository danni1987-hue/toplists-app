import { useState } from "react";
import { TopListCard } from "./components/TopListCard";
import { CreateListDialog } from "./components/CreateListDialog";
import { LoginDialog } from "./components/LoginDialog";
import { MyListsView } from "./components/MyListsView";
import { Button } from "./components/ui/button";
import { LandingBanner } from "./components/LandingBanner";
import { LogoWithText } from "./components/LogoWithText";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Avatar } from "./components/ui/avatar";
import { ProfileView } from "./components/ProfileView";
import { TrendingView } from "./components/TrendingView";
import { TopListPage } from "./components/TopListPage";
import { SearchDialog } from "./components/SearchDialog";
import { ListDetailDialog } from "./components/ListDetailDialog";
import { UserProfileView } from "./components/UserProfileView";
import { SettingsView } from "./components/SettingsView";
import { FavoriteListsView } from "./components/FavoriteListsView";
import { RadarView } from "./components/RadarView";
import { FollowRequestsSheet } from "./components/FollowRequestsSheet";
import { UserGuideDialog } from "./components/UserGuideDialog";
import './styles/globals.css' ; // o './globals.css'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
import {
  Bell,
  Search,
  Home,
  TrendingUp,
  User,
  List,
  LogIn,
  LogOut,
  Settings,
  Trophy,
  Grid3x3,
  Star,
  HelpCircle,
  ChevronDown,
  Menu,
  Radar,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "./utils/api";
import { getCategoryIcon } from "./utils/categoryIcons";
import { getSupabaseClient } from "./utils/supabase/client";
import { Toaster } from "./components/ui/sonner";
import React, { useEffect } from 'react';





export default function App() {
  console.log("🔴🔴🔴 APP COMPONENT MOUNTED - NEW CODE VERSION 2.1 🔴🔴🔴");
  const [lists, setLists] = useState<any[]>([]);
  console.log("📊 Current lists state in this render:", lists.length, lists.map(l => ({ title: l.title, author: l.author?.username })));
  const [activeTab, setActiveTab] = useState("todos");
  const [currentView, setCurrentView] = useState<
    "feed" | "myLists" | "profile" | "trending" | "userProfile" | "topRankings" | "settings" | "favorites" | "radar"
  >("feed");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    name: string;
    avatar: string;
    userId?: string;
  } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [listDetailId, setListDetailId] = useState<string | null>(null);
  const [listDetailDialogOpen, setListDetailDialogOpen] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [trendingLists, setTrendingLists] = useState<any[]>([]);
  const [trendingRadarItems, setTrendingRadarItems] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [followRequestsOpen, setFollowRequestsOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [userGuideOpen, setUserGuideOpen] = useState(false);

  // Load suggested users
  useEffect(() => {
    const loadSuggestedUsers = async () => {
      try {
        const { users } = await api.getSuggestedUsers(accessToken || undefined);
        setSuggestedUsers(users);
      } catch (error) {
        console.error("Error loading suggested users:", error);
      }
    };

    loadSuggestedUsers();
  }, [accessToken]);

  // Load pending follow requests count
  useEffect(() => {
    const loadPendingRequestsCount = async () => {
      if (!accessToken) {
        setPendingRequestsCount(0);
        return;
      }
      
      try {
        const { count } = await api.getPendingFollowRequestsCount(accessToken);
        setPendingRequestsCount(count);
      } catch (error) {
        console.error("Error loading pending requests count:", error);
      }
    };

    loadPendingRequestsCount();
    
    // Refresh count every 30 seconds if logged in
    const interval = accessToken ? setInterval(loadPendingRequestsCount, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [accessToken]);

  // Load top categories
  useEffect(() => {
    const loadTopCategories = async () => {
      try {
        const { topCategories: categories } = await api.getTopCategories();
        setTopCategories(categories || []);
      } catch (error) {
        console.error("Error loading top categories:", error);
      }
    };

    loadTopCategories();
  }, [lists]); // Reload when lists change

  // Load trending lists and radar items (last 3 months)
  useEffect(() => {
    const loadTrending = async () => {
      try {
        // Get lists from last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const recentLists = lists.filter((list: any) => {
          const listDate = new Date(list.createdAt);
          return listDate >= threeMonthsAgo;
        });

        // Count by category for trending lists
        const listCategoryCounts: Record<string, { name: string; count: number }> = {};
        recentLists.forEach((list: any) => {
          const category = list.category;
          if (!listCategoryCounts[category]) {
            listCategoryCounts[category] = { name: category, count: 0 };
          }
          listCategoryCounts[category].count++;
        });

        const sortedListTrends = Object.values(listCategoryCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTrendingLists(sortedListTrends);

        // Get radar trending data from the community - TRENDING ITEMS
        if (accessToken) {
          const { trendingItems } = await api.getTrendingRadarItems(accessToken);
          setTrendingRadarItems(trendingItems || []);
        }
      } catch (error) {
        console.error("Error loading trending data:", error);
      }
    };

    loadTrending();
  }, [lists, accessToken]);

  // Load lists from backend (following feed if logged in)
  const loadLists = async (token?: string | null) => {
    console.log("🚀 loadLists() called");
    const effectiveToken = token !== undefined ? token : accessToken;
    console.log("🔐 Current state - isLoggedIn:", isLoggedIn, "effectiveToken:", !!effectiveToken);
    try {
      setIsLoadingLists(true);
      if (effectiveToken) {
        console.log("🔍 Loading feed for logged in user...");
        console.log("📝 Access token exists:", !!effectiveToken);
        console.log("👤 Current user:", currentUser?.username);
        
        // Load all public lists (respecting privacy settings) with auth token
        const { lists: allLists } = await api.getLists(effectiveToken);
        
        console.log(`📊 Feed stats: ${allLists.length} total lists`);
        
        // Sort by creation date (most recent first)
        const sorted: any[] = allLists.sort((a: any, b: any) => 
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
)
        setLists(sorted);
        console.log(`✅ Loaded ${sorted.length} lists for feed`);
      } else {
        // Load all lists if not logged in
        console.log("🔓 Not logged in, loading all public lists");
        const { lists: fetchedLists } = await api.getLists();
        console.log(`📋 Loaded ${fetchedLists.length} public lists`);
        setLists(fetchedLists);
      }
    } catch (error) {
      console.error("❌ Error loading lists:", error);
      toast.error("Error al cargar las listas");
    } finally {
      setIsLoadingLists(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        const supabase = getSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          // User has an active session
          const { profile } = await api.getProfile(session.access_token);
          setCurrentUser({
            name: profile.name,
            username: profile.username,
            avatar: profile.avatar,
            userId: profile.id || '',
          });
          setAccessToken(session.access_token);
          setIsLoggedIn(true);
          // Pass the token directly to loadLists to avoid reading stale state
          await loadLists(session.access_token);
        } else {
          // No session - load public lists
          await loadLists(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        await loadLists(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    // Set up auth state listener to handle token refresh
    const supabase = getSupabaseClient();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event, "Session exists:", !!session);
      
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log("✅ Token refreshed, updating access token");
        setAccessToken(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out");
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAccessToken(null);
        await loadLists(null);
      } else if (event === 'SIGNED_IN' && session) {
        console.log("🎉 User signed in");
        try {
          const { profile } = await api.getProfile(session.access_token);
          setCurrentUser({
            name: profile.name,
            username: profile.username,
            avatar: profile.avatar,
            userId: profile.id || '',
          });
          setAccessToken(session.access_token);
          setIsLoggedIn(true);
          await loadLists(session.access_token);
        } catch (error) {
          console.error("Error updating user after sign in:", error);
        }
      }
    });

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load my lists when view changes to myLists or when accessToken changes
  useEffect(() => {
    if (currentView === "myLists" && accessToken) {
      loadMyLists();
    }
  }, [currentView, accessToken]);

  const handleCreateList = async (newList: any) => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para crear listas");
      return;
    }

    console.log("Creating list with token:", accessToken.substring(0, 20) + "...");
    console.log("List data:", newList);

    try {
      const { list } = await api.createList(newList, accessToken);
      console.log("List created successfully:", list);
      setLists([list, ...lists]);
      // Reload my lists if we're on that view
      if (currentView === "myLists") {
        await loadMyLists();
      }
      toast.success("Lista creada exitosamente");
    } catch (error: any) {
      console.error("Error creating list:", error);
      toast.error("Error al crear la lista: " + (error.message || ""));
    }
  };

  const handleUpdateList = async (id: string, updatedList: any) => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para editar listas");
      return;
    }

    try {
      await api.updateList(id, updatedList, accessToken);
      // Reload lists
      await loadLists();
      await loadMyLists();
      toast.success("Lista actualizada exitosamente");
    } catch (error) {
      console.error("Error updating list:", error);
      toast.error("Error al actualizar la lista");
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para eliminar listas");
      return;
    }

    try {
      await api.deleteList(id, accessToken);
      // Reload lists
      await loadLists();
      await loadMyLists();
      toast.success("Lista eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Error al actualizar la lista");
    }
  };

  const handleLogin = async (
    userData: {
      name: string;
      username: string;
      avatar: string;
      userId?: string;
    },
    token: string
  ) => {
    console.log("🔐 handleLogin called with token:", token.substring(0, 20) + "...");
    setCurrentUser(userData);
    setAccessToken(token);
    setIsLoggedIn(true);
    console.log("🔐 State updated - isLoggedIn:", true);
    await loadLists(token); // Pass token directly to avoid reading stale state
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setCurrentUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);
      setCurrentView("feed");
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const handleHelp = () => {
    toast.info(
      "Para soporte técnico o consultas, envía un correo a soporte@toplists.com o visita nuestra sección de ayuda.",
      {
        duration: 5000,
      }
    );
  };

  // Load user's lists from backend
  const [myLists, setMyLists] = useState<any[]>([]);
  const [isLoadingMyLists, setIsLoadingMyLists] = useState(false);

  const loadMyLists = async () => {
    if (!accessToken) return;
    try {
      setIsLoadingMyLists(true);
      console.log("📋 Loading my lists from backend...");
      const { lists: fetchedMyLists } = await api.getMyLists(accessToken);
      setMyLists(fetchedMyLists);
      console.log(`✅ Loaded ${fetchedMyLists.length} lists for current user`);
    } catch (error) {
      console.error("Error loading my lists:", error);
      toast.error("Error al cargar tus listas");
    } finally {
      setIsLoadingMyLists(false);
    }
  };

  console.log(`📋 Total lists: ${lists.length}, My lists: ${myLists.length}, Current user: ${currentUser?.username}`);

  const filteredLists =
    activeTab === "todos"
      ? lists
      : lists.filter(
          (list) =>
            list.category.toLowerCase() ===
            activeTab.toLowerCase(),
        );

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
        <Toaster />
      </div>
    );
  }

  // Show landing page if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <LandingBanner onGetStarted={() => setLoginDialogOpen(true)} />
        <LoginDialog
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
          onLogin={handleLogin}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu - Navigation */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <SheetDescription className="sr-only">
                  Accede a las diferentes secciones de la aplicación
                </SheetDescription>
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <LogoWithText />
                  </div>

                  <nav className="flex-1 space-y-1">
                    <Button
                      variant={currentView === "feed" ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setCurrentView("feed");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Home className="h-5 w-5" />
                      Inicio
                    </Button>
                    {isLoggedIn && (
                      <>
                        <Button
                          variant={currentView === "myLists" ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            setCurrentView("myLists");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <List className="h-5 w-5" />
                          Mis Listas
                        </Button>
                        <Button
                          variant={currentView === "favorites" ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            setCurrentView("favorites");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Star className="h-5 w-5" />
                          Favoritos
                        </Button>
                        <Button
                          variant={currentView === "radar" ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            setCurrentView("radar");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Radar className="h-5 w-5" />
                          Radar
                        </Button>
                      </>
                    )}
                    <Button
                      variant={currentView === "trending" ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setCurrentView("trending");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <TrendingUp className="h-5 w-5" />
                      Tendencias
                    </Button>
                    <Button
                      variant={currentView === "topRankings" ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setCurrentView("topRankings");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Trophy className="h-5 w-5" />
                      Top Rankings
                    </Button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            <LogoWithText />
          </div>

          <button 
            onClick={() => setSearchDialogOpen(true)}
            className="hidden md:flex items-center gap-2 bg-muted rounded-full px-4 py-2 w-96 cursor-text hover:bg-muted/80 transition-colors"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Buscar listas o usuarios...</span>
          </button>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex relative"
                onClick={() => setFollowRequestsOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {pendingRequestsCount}
                  </span>
                )}
              </Button>
            )}
            
            {isLoggedIn && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-accent transition-colors">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="hidden md:inline max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p>{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{currentUser.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      setCurrentView("myLists");
                    }}
                  >
                    <List className="mr-2 h-4 w-4" />
                    Mis Listas
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      setCurrentView("profile");
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      setCurrentView("settings");
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      handleHelp();
                    }}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Obtener Asistencia
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setLoginDialogOpen(true)}
                className="gap-2"
                size="sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden md:inline">Iniciar Sesión</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              <nav className="space-y-1">
                <Button
                  variant={
                    currentView === "feed"
                      ? "secondary"
                      : "ghost"
                  }
                  className="w-full justify-start gap-3"
                  onClick={() => setCurrentView("feed")}
                >
                  <Home className="h-5 w-5" />
                  Inicio
                </Button>
                {isLoggedIn && (
                  <>
                    <Button
                      variant={
                        currentView === "myLists"
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start gap-3"
                      onClick={() => setCurrentView("myLists")}
                    >
                      <List className="h-5 w-5" />
                      Mis Listas
                    </Button>
                    <Button
                      variant={
                        currentView === "favorites"
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start gap-3"
                      onClick={() => setCurrentView("favorites")}
                    >
                      <Star className="h-5 w-5" />
                      Favoritos
                    </Button>
                    <Button
                      variant={
                        currentView === "radar"
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start gap-3"
                      onClick={() => setCurrentView("radar")}
                    >
                      <Radar className="h-5 w-5" />
                      Radar
                    </Button>
                  </>
                )}
                <Button
                  variant={
                    currentView === "trending"
                      ? "secondary"
                      : "ghost"
                  }
                  className="w-full justify-start gap-3"
                  onClick={() => setCurrentView("trending")}
                >
                  <TrendingUp className="h-5 w-5" />
                  Tendencias
                </Button>
                <Button
                  variant={
                    currentView === "topRankings"
                      ? "secondary"
                      : "ghost"
                  }
                  className="w-full justify-start gap-3"
                  onClick={() => setCurrentView("topRankings")}
                >
                  <Trophy className="h-5 w-5" />
                  Top Rankings
                </Button>
              </nav>

              {isLoggedIn ? (
                <div className="pt-4">
                  <CreateListDialog
                    onCreateList={handleCreateList}
                    accessToken={accessToken}
                  />
                </div>
              ) : (
                <div className="pt-4">
                  <Button
                    onClick={() => setLoginDialogOpen(true)}
                    className="w-full gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Crear Lista
                  </Button>
                </div>
              )}

              {/* Suggested Users */}
              <div className="pt-4 border-t border-border">
                <h3 className="mb-4 text-muted-foreground text-sm">Usuarios sugeridos</h3>
                <div className="space-y-3">
                  {suggestedUsers.map((user, i) => (
                    <div
                      key={user.id || i}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="object-cover"
                          />
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={async () => {
                          if (!accessToken) {
                            toast.error("Debes iniciar sesión para seguir usuarios");
                            setLoginDialogOpen(true);
                            return;
                          }
                          try {
                            const { following, status } = await api.toggleFollow(user.id, accessToken);
                            
                            // Show appropriate message based on the action
                            if (status === 'pending') {
                              toast.success(`Solicitud de seguimiento enviada a @${user.username}`);
                            } else if (following) {
                              toast.success(`Ahora sigues a @${user.username}`);
                            } else {
                              toast.success(`Solicitud cancelada`);
                            }
                            
                            // Reload suggested users to update the list
                            const { users } = await api.getSuggestedUsers(accessToken);
                            setSuggestedUsers(users);
                            // Reload feed to show new user's lists
                            await loadLists();
                          } catch (error) {
                            console.error("Error following user:", error);
                            toast.error("Error al seguir al usuario");
                          }
                        }}
                      >
                        Seguir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-6">
            {currentView === "feed" ? (
              <>
                <div className="mb-6">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="w-full h-auto flex gap-2 p-2">
                      <TabsTrigger value="todos" className="gap-2">
                        <Grid3x3 className="h-4 w-4" />
                        <span>Todos</span>
                      </TabsTrigger>
                      {["Películas", "Música", "Viajes", "Series", "Libros", "Juegos de mesa", "Escape room"].map((cat) => {
                        const IconComponent = getCategoryIcon(cat);
                        return (
                          <TabsTrigger key={cat} value={cat.toLowerCase()} className="gap-2" title={cat}>
                            <IconComponent className="h-4 w-4" />
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-6">
                  {isLoadingLists ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Cargando listas...
                      </p>
                    </div>
                  ) : (
                    <>
                      {filteredLists.map((list) => (
                        <TopListCard 
                          key={list.id} 
                          {...list} 
                          accessToken={accessToken}
                          currentUser={currentUser}
                        />
                      ))}

                      {filteredLists.length === 0 && lists.length === 0 && (
                        <div className="text-center py-16 px-4">
                          <div className="max-w-md mx-auto space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
                              <List className="w-10 h-10 text-violet-500" />
                            </div>
                            <h3>¡Bienvenido a tu feed!</h3>
                            <p className="text-muted-foreground">
                              Aún no tienes listas ni sigues a nadie. Crea tu primera lista o descubre usuarios para seguir en la sección de "Usuarios sugeridos".
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <CreateListDialog onCreateList={handleCreateList} accessToken={accessToken} />
                              <Button
                                variant="outline"
                                onClick={() => setCurrentView("trending")}
                              >
                                Explorar tendencias
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {filteredLists.length === 0 && lists.length > 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">
                            No hay listas en esta categoría todavía
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setActiveTab("todos")}
                          >
                            Ver todas las listas
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : currentView === "trending" ? (
              <TrendingView 
                accessToken={accessToken}
                currentUser={currentUser}
              />
            ) : currentView === "topRankings" ? (
              <TopListPage />
              /*
            ) : currentView === "profile" && isLoggedIn && currentUser && accessToken ? (
              <ProfileView 
                currentUser={currentUser}
                accessToken={accessToken}
                onProfileUpdate={(updatedUser) => {
                  setCurrentUser(updatedUser);
                }}
              />
              */
            ) : currentView === "userProfile" && viewingUserId && accessToken ? (
              <UserProfileView
                userId={viewingUserId}
                accessToken={accessToken}
                onBack={() => setCurrentView("feed")}
                onViewList={(listId) => {
                  setListDetailId(listId);
                  setListDetailDialogOpen(true);
                }}
              />
            ) : currentView === "myLists" && isLoggedIn && currentUser ? (
              <>
                {isLoadingMyLists ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground">Cargando tus listas...</p>
                  </div>
                ) : (
                  <MyListsView
                    lists={myLists}
                    onUpdateList={handleUpdateList}
                    onDeleteList={handleDeleteList}
                  />
                )}
              </>
            ) : currentView === "settings" && isLoggedIn && currentUser && accessToken ? (
              <SettingsView
                currentUser={currentUser}
                accessToken={accessToken}
                onSettingsUpdate={async () => {
                  // Reload feed after settings change (privacy settings affect what's visible)
                  await loadLists();
                }}
              />
              
            ) : currentView === "favorites" && isLoggedIn  && currentUser?.userId  && accessToken ? (
              <FavoriteListsView
                accessToken={accessToken}
                currentUser={currentUser}
                onViewList={(listId) => {
                  setListDetailId(listId);
                  setListDetailDialogOpen(true);
                }}
                onViewProfile={(userId) => {
                  setViewingUserId(userId);
                  setCurrentView("userProfile");
                }}
              />
            ) : currentView === "radar" && isLoggedIn && currentUser && accessToken ? (
              <RadarView
                accessToken={accessToken}
              />
            ) : (
              <div className="text-center py-12">
                <h2 className="mb-4">Inicia sesión para acceder a esta sección</h2>
                <p className="text-muted-foreground mb-6">
                  Crea una cuenta para empezar a crear y compartir tus listas favoritas
                </p>
                <Button
                  onClick={() => setLoginDialogOpen(true)}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              {/* Trending Lists - Last 3 months */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="mb-3 flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Listas en tendencia
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Últimos 3 meses
                </p>
                <div className="space-y-3">
                  {trendingLists.length > 0 ? (
                    trendingLists.map((cat, i) => {
                      const IconComponent = getCategoryIcon(cat.name);
                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {cat.count} {cat.count === 1 ? "lista" : "listas"}
                              </p>
                            </div>
                          </div>
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay listas creadas recientemente
                    </p>
                  )}
                </div>
              </div>

              {/* Trending Radar Items - Last 3 months */}
              {isLoggedIn && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="mb-3 flex items-center gap-2">
                    <Radar className="h-4 w-4" />
                    Radar en tendencia
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Últimos 3 meses
                  </p>
                  <div className="space-y-3">
                    {trendingRadarItems.length > 0 ? (
                      trendingRadarItems.map((cat, i) => {
                        const IconComponent = getCategoryIcon(cat.category);
                        return (
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{cat.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {cat.count} {cat.count === 1 ? "item" : "items"}
                                </p>
                              </div>
                            </div>
                            <TrendingUp className="h-4 w-4 text-violet-500" />
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay items añadidos recientemente
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile FAB */}
      {isLoggedIn ? (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <CreateListDialog onCreateList={handleCreateList} accessToken={accessToken} />
        </div>
      ) : (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setLoginDialogOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <LogIn className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Help Button - Fixed bottom right */}
      {isLoggedIn && (
        <div className="fixed bottom-6 right-6 z-30 lg:bottom-8 lg:right-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 hover:shadow-xl transition-all hover:scale-110"
              >
                <HelpCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
              <DropdownMenuLabel>Ayuda y Recursos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={(e) => {
                  handleHelp();
                }}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Contactar Soporte
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => {
                  setUserGuideOpen(true);
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                Guía de Usuario
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => {
                  toast.info("Tutoriales próximamente");
                }}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Tutoriales
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Login Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLogin={handleLogin}
      />

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectList={(listId) => {
          setListDetailId(listId);
          setListDetailDialogOpen(true);
        }}
        onSelectUser={(userId) => {
          setViewingUserId(userId);
          setCurrentView("userProfile");
        }}
      />

      {/* List Detail Dialog */}
      <ListDetailDialog
        listId={listDetailId}
        open={listDetailDialogOpen}
        onOpenChange={setListDetailDialogOpen}
        accessToken={accessToken}
        currentUser={currentUser}
      />

      {/* Follow Requests Sheet */}
      <FollowRequestsSheet
        open={followRequestsOpen}
        onOpenChange={(open) => {
          setFollowRequestsOpen(open);
          // Refresh count when closing
          if (!open && accessToken) {
            api.getPendingFollowRequestsCount(accessToken).then(({ count }) => {
              setPendingRequestsCount(count);
            });
          }
        }}
        accessToken={accessToken}
      />

      {/* User Guide Dialog */}
      <UserGuideDialog
        open={userGuideOpen}
        onOpenChange={setUserGuideOpen}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}