import { useState, useEffect } from "react";
import { TopListCard } from "./TopListCard";
import { Star, Loader2 } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner";

interface FavoriteListsViewProps {
  accessToken: string;
  currentUser: {
    userId?: string | '';
    username: string;
    name: string;
    status?: string;
    avatar: string;
  };

  onViewList: (listId: string) => void;
  onViewProfile: (userId: string) => void;
}

export function FavoriteListsView({
  accessToken,
  currentUser,
  onViewList,
  onViewProfile,
}: FavoriteListsViewProps) {
  const [favoriteLists, setFavoriteLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const { lists } = await api.getFavorites(accessToken);
      setFavoriteLists(lists || []);
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast.error("Error al cargar favoritos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (listId: string) => {
    try {
      await api.toggleFavorite(listId, accessToken);
      
      // Remove from local state
      setFavoriteLists(prev => prev.filter(list => list.id !== listId));
      
      toast.success("Eliminado de favoritos");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Error al eliminar de favoritos");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 mx-auto text-violet-500 animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando favoritos...</p>
      </div>
    );
  }

  if (favoriteLists.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Star className="w-12 h-12 text-white" fill="white" />
            </div>
          </div>
          <h2 className="mb-3">No tienes listas favoritas</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Cuando encuentres listas que te gusten, guárdalas en favoritos para encontrarlas fácilmente más tarde.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> Haz clic en el icono de estrella ⭐ en cualquier lista para añadirla a favoritos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
          <Star className="h-5 w-5 text-white" fill="white" />
        </div>
        <div>
          <h1 className="mb-0">Favoritos</h1>
          <p className="text-sm text-muted-foreground">
            {favoriteLists.length} {favoriteLists.length === 1 ? "lista guardada" : "listas guardadas"}
          </p>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="space-y-6">
        {favoriteLists.map((list) => (
          <TopListCard
            key={list.id}
            {...list}
            accessToken={accessToken}
            currentUser={currentUser}
            onRemoveFavorite={handleRemoveFavorite}
            isFavoriteView={true}
          />
        ))}
      </div>
    </div>
  );
}