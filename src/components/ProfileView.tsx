import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { User, Camera, Save, X, Upload, Users } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner";

interface ProfileViewProps {
  currentUser: {
    username: string;
    name: string;
    avatar: string;
    userId?: string | '';
  };
  accessToken: string;
  onProfileUpdate: (updatedUser: any) => void;
}

// Avatares predefinidos
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
];

export function ProfileView({ currentUser, accessToken, onProfileUpdate }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar);
  const [stats, setStats] = useState({ followers: 0, following: 0, lists: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  useEffect(() => {
    loadStats();
    loadFollowing();
    loadPendingRequests();
  }, [currentUser.userId]);

  const loadStats = async () => {
    try {
      if (currentUser.userId != null){
         const userStats = await api.getUserStats(currentUser.userId);
          setStats(userStats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadFollowing = async () => {
    try {
      setIsLoadingFollowing(true);
       if (currentUser.userId != null){
      const { following } = await api.getFollowing(currentUser.userId);
      setFollowingUsers(following);
       }
    } catch (error) {
      console.error("Error loading following:", error);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { requests } = await api.getOutgoingPendingRequests(accessToken);
      setPendingRequests(requests);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    try {
      await api.cancelFollowRequest(userId, accessToken);
      toast.success("Solicitud cancelada");
      loadPendingRequests();
      loadStats();
    } catch (error) {
      console.error("Error canceling request:", error);
      toast.error("Error al cancelar la solicitud");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { profile } = await api.updateProfile(
        {
          username,
          avatar_url: avatarUrl,
        },
        accessToken
      );

      onProfileUpdate({
        name: profile.username,
        username: profile.username,
        avatar: profile.avatar,
        userId: profile.id,
      });

      toast.success("Perfil actualizado exitosamente");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser.name);
    setUsername(currentUser.username);
    setAvatarUrl(currentUser.avatar);
    setIsEditing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast.info("Subiendo imagen...");
        const { avatarUrl: uploadedUrl } = await api.uploadAvatar(file, accessToken);
        setAvatarUrl(uploadedUrl);
        setAvatarDialogOpen(false);
        toast.success("Imagen subida exitosamente");
      } catch (error) {
        console.error("Error uploading avatar:", error);
        toast.error("Error al subir la imagen");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Card */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar Section */}
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <img src={avatarUrl} alt={name} className="object-cover" />
            </Avatar>
            {isEditing && (
              <Button
                size="icon"
                variant="default"
                className="absolute bottom-0 right-0 rounded-full shadow-lg"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl mb-1">{name}</h1>
                  <p className="text-muted-foreground">@{username}</p>
                </div>

                {/* Stats */}
                <div className="flex gap-6 justify-center md:justify-start">
                  <div className="text-center">
                    <p className="text-2xl">{stats.lists}</p>
                    <p className="text-sm text-muted-foreground">Listas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl">{stats.followers}</p>
                    <p className="text-sm text-muted-foreground">Seguidores</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl">{stats.following}</p>
                    <p className="text-sm text-muted-foreground">Siguiendo</p>
                  </div>
                </div>

                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Información de la cuenta</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miembro desde</span>
            <span>Noviembre 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de likes recibidos</span>
            <span>🔥 En desarrollo</span>
          </div>
        </div>
      </Card>

      {/* Following Card */}
      <Card className="p-6">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Siguiendo ({followingUsers.length})
        </h3>
        {isLoadingFollowing ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : followingUsers.length > 0 ? (
          <div className="space-y-3">
            {followingUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <Avatar className="h-10 w-10">
                  <img src={user.avatar} alt={user.username} className="object-cover" />
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.name || user.username}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sigues a nadie todavía</p>
        )}
        
        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <>
            <div className="border-t my-4" />
            <h4 className="text-md mb-3 text-muted-foreground">Solicitudes pendientes ({pendingRequests.length})</h4>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.requestId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="h-10 w-10">
                    <img src={request.user.avatar} alt={request.user.username} className="object-cover" />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.user.username}</p>
                    <p className="text-sm text-muted-foreground">{request.timestamp}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelRequest(request.user.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Avatar Selection Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar foto de perfil</DialogTitle>
            <DialogDescription>
              Sube una imagen o selecciona un avatar predefinido
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload" className="block mb-2">Subir imagen</Label>
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* URL Input */}
            <div>
              <Label htmlFor="avatar-url" className="block mb-2">O ingresa una URL</Label>
              <Input
                id="avatar-url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            {/* Preset Avatars */}
            <div>
              <Label className="block mb-3">O selecciona un avatar</Label>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setAvatarUrl(avatar);
                      setAvatarDialogOpen(false);
                      toast.success("Avatar seleccionado");
                    }}
                    className={`relative rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                      avatarUrl === avatar ? "border-primary ring-2 ring-primary ring-offset-2" : "border-muted"
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover aspect-square" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setAvatarDialogOpen(false)} variant="outline" className="flex-1">
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}