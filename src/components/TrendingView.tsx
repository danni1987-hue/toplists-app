import { useState, useEffect } from "react";
import { TopListPreview } from "./TopListPreview";
import { ListDetailDialog } from "./ListDetailDialog";
import { api } from "../utils/api";
import { toast } from "sonner";
import { TrendingUp, Flame, Trophy } from "lucide-react";
import { Card } from "./ui/card";

interface TrendingViewProps {
  accessToken?: string | null;
  currentUser?: {
    username: string;
    avatar: string;
    userId?: string;
  } | null;
}

export function TrendingView({ accessToken, currentUser }: TrendingViewProps) {
  const [trendingLists, setTrendingLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      setIsLoading(true);
      const { lists } = await api.getTrending(20);
      setTrendingLists(lists);
    } catch (error) {
      console.error("Error loading trending:", error);
      toast.error("Error al cargar las tendencias");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (listId: string) => {
    setSelectedListId(listId);
    setDetailDialogOpen(true);
  };

  const getFireEmoji = (likes: number) => {
    if (likes >= 10) return "🔥🔥🔥";
    if (likes >= 5) return "🔥🔥";
    if (likes >= 1) return "🔥";
    return "💙";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Flame className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando tendencias...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary to-purple-600 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl">🔥 Tendencias</h2>
              <p className="text-muted-foreground text-sm">Las listas más populares del momento</p>
            </div>
          </div>
          
          {trendingLists.length > 0 && (
            <div className="mt-4 flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 rounded-full px-4 py-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Top {trendingLists.length} listas</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 rounded-full px-4 py-2">
                <Flame className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  Total: {trendingLists.reduce((acc, list) => acc + list.likes, 0)} likes
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Trending Lists Grid */}
        {trendingLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingLists.map((list, index) => (
              <div key={list.id} className="relative">
                {/* Rank Badge */}
                <div className="absolute -top-2 -left-2 z-10 bg-gradient-to-br from-primary to-purple-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-white font-bold text-sm">#{index + 1}</span>
                </div>

                {/* Fire emoji indicator */}
                <div className="absolute -top-2 -right-2 z-10 text-2xl">
                  {getFireEmoji(list.likes)}
                </div>

                <TopListPreview
                  {...list}
                  onViewDetail={handleViewDetail}
                />

                {/* Likes counter */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-sm font-medium">❤️ {list.likes}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Flame className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl mb-2">No hay tendencias aún</h3>
            <p className="text-muted-foreground">
              Sé el primero en crear una lista viral 🚀
            </p>
          </Card>
        )}
      </div>

      {/* List Detail Dialog */}
      <ListDetailDialog
        listId={selectedListId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        accessToken={accessToken}
        currentUser={currentUser}
      />
    </>
  );
}
