import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { User, UserPlus, UserMinus, Lock } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner";

interface UserProfileViewProps {
  userId: string;
  accessToken: string;
  currentUser?: {
    username: string;
    name: string;
    avatar: string;
    userId?: string;
  };
  onBack: () => void;
  onViewList: (listId: string) => void;
}


export function UserProfileView({ userId, accessToken, onBack, onViewList }: UserProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, lists: 0 });
  const [topLists, setTopLists] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const [profileData, statsData, listsData, followStatusData] = await Promise.all([
        api.getUserProfile(userId),
        api.getUserStats(userId),
        api.getUserTopLists(userId, 5),
        api.getFollowStatus(userId, accessToken),
      ]);

      setProfile(profileData.profile);
      setStats(statsData);
      setTopLists(listsData.lists || []);
      setIsFollowing(followStatusData.isFollowing);
      setFollowStatus(followStatusData.status || 'none');
    } catch (error: any) {
      console.error("Error loading user profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const result = await api.toggleFollow(userId, accessToken);
      setIsFollowing(result.following);
      setFollowStatus(result.status || 'none');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        followers: result.following ? prev.followers + 1 : prev.followers - 1,
      }));

      // Show appropriate message based on status
      if (result.status === 'pending') {
        toast.success("Solicitud de seguimiento enviada");
      } else if (result.following) {
        toast.success("Siguiendo");
      } else {
        toast.success(result.message || "Dejaste de seguir");
      }
      
      // Reload lists if we just started following (to show private lists)
      if (result.following) {
        const listsData = await api.getUserTopLists(userId, 5);
        setTopLists(listsData.lists || []);
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast.error("Error al actualizar seguimiento");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontró el perfil</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Back Button */}
      <Button onClick={onBack} variant="outline" size="sm">
        ← Volver
      </Button>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar} alt={profile.username} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <h1 className="text-2xl">{profile.username}</h1>
                <div className="flex gap-6 text-sm text-gray-600">
                  <span>
                    <strong>{stats.lists}</strong> listas
                  </span>
                  <span>
                    <strong>{stats.followers}</strong> seguidores
                  </span>
                  <span>
                    <strong>{stats.following}</strong> siguiendo
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleToggleFollow}
              variant={isFollowing || followStatus === 'pending' ? "outline" : "default"}
              className={!isFollowing && followStatus !== 'pending' ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 w-full sm:w-auto" : "w-full sm:w-auto"}
            >
              {followStatus === 'pending' ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Solicitud enviada
                </>
              ) : isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Dejar de seguir
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Seguir
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Top 5 Lists */}
      <div className="space-y-4">
        <h2 className="text-xl">Top 5 Listas Más Populares</h2>

        {topLists.length === 0 && !isFollowing ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Este perfil es privado</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Solo los seguidores pueden ver las listas de este usuario. Síguelo para ver su contenido.
                  </p>
                </div>
                <Button
                  onClick={handleToggleFollow}
                  className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Seguir para ver listas
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : topLists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Este usuario aún no tiene listas
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topLists.map((list) => (
              <Card
                key={list.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onViewList(list.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Cover Image */}
                    {list.coverImage && (
                      <img
                        src={list.coverImage}
                        alt={list.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    {/* List Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium line-clamp-2">{list.title}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {list.likes} 💖
                        </span>
                      </div>

                      {list.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {list.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-gradient-to-r from-purple-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent font-medium">
                          {list.category}
                        </span>
                        <span>{list.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* First 3 items preview */}
                  {list.items && list.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {list.items.slice(0, 3).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden relative"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                                #{idx + 1}
                              </div>
                            )}
                          </div>
                        ))}
                        {list.items.length > 3 && (
                          <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                            +{list.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}