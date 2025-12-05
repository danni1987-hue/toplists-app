import { Card } from "./ui/card";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Share2, MoreVertical, Star, Circle, Crown, Radar } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { getCategoryIcon } from "../utils/categoryIcons";
import { api } from "../utils/api";
import { toast } from "sonner";
import { ratingCriteria, getCriteriaKey } from "../utils/ratingCriteria";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";

interface TopListItem {
  rank: number;
  title: string;
  description?: string;
  image?: string;
  rating?: number;
  ratings?: Record<string, number>;
}

interface TopListCardProps {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    userId?: string;
  };
  title: string;
  description: string;
  items: TopListItem[];
  category: string;
  genre?: string;
  likes: number;
  comments: number;
  timestamp: string;
  coverImage?: string;
  accessToken?: string | null;
  currentUser?: {
    username: string;
    avatar: string;
    userId?: string;
  } | null;
  onRemoveFavorite?: (listId: string) => void;
  isFavoriteView?: boolean;
}

// Instagram Icon Component
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export function TopListCard({
  id,
  author,
  title,
  description,
  items,
  category,
  genre,
  likes: initialLikes,
  comments: initialComments,
  timestamp,
  coverImage,
  accessToken,
  currentUser,
  onRemoveFavorite,
  isFavoriteView
}: TopListCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [radarItems, setRadarItems] = useState<Map<string, string>>(new Map()); // Map of itemTitle -> radarItemId
  const [isLoadingRadar, setIsLoadingRadar] = useState<Set<string>>(new Set()); // Set of item titles being processed

  // Load like status on mount
  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        const { likesCount, isLiked: userLiked } = await api.getLikes(id, accessToken || undefined);
        setLikes(likesCount);
        setIsLiked(userLiked);
      } catch (error: any) {
        // Only log non-auth errors
        if (!error.message?.includes('Invalid JWT') && !error.message?.includes('Unauthorized')) {
          console.error("Error loading like status:", error);
        }
      }
    };

    loadLikeStatus();
  }, [id, accessToken]);

  // Load follow status on mount
  useEffect(() => {
    const loadFollowStatus = async () => {
      if (!accessToken || !author.userId || author.userId === currentUser?.userId) {
        return;
      }

      try {
        const { isFollowing: userFollowing, isPending: userPending } = await api.getFollowStatus(author.userId, accessToken);
        setIsFollowing(userFollowing);
        setIsPending(userPending || false);
      } catch (error: any) {
        // Only log non-auth errors
        if (!error.message?.includes('Invalid JWT') && !error.message?.includes('Unauthorized')) {
          console.error("Error loading follow status:", error);
        }
      }
    };

    loadFollowStatus();
  }, [author.userId, accessToken, currentUser?.userId]);

  // Load favorite status on mount
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!accessToken) {
        return;
      }

      try {
        const { isFavorited: favoriteStatus } = await api.checkFavorite(id, accessToken);
        setIsFavorited(favoriteStatus);
      } catch (error: any) {
        // Only log non-auth errors
        if (!error.message?.includes('Invalid JWT') && !error.message?.includes('Unauthorized')) {
          console.error("Error loading favorite status:", error);
        }
      }
    }

    loadFavoriteStatus();
  }, [id, accessToken]);

  // Load radar status for all items
  useEffect(() => {
    const loadRadarStatus = async () => {
      if (!accessToken || items.length === 0) {
        return;
      }

      try {
        const radarMap = new Map<string, string>();
        
        // Check each item
        for (const item of items) {
          const { inRadar, radarItemId } = await api.checkRadarStatus(
            item.title,
            category,
            accessToken
          );
          if (inRadar && radarItemId) {
            radarMap.set(item.title, radarItemId);
          }
        }
        
        setRadarItems(radarMap);
      } catch (error: any) {
        // Only log non-auth errors
        if (!error.message?.includes('Invalid JWT') && !error.message?.includes('Unauthorized')) {
          console.error("Error loading radar status:", error);
        }
      }
    };

    loadRadarStatus();
  }, [accessToken, items, category]);

  // Load comments count on mount
  useEffect(() => {
    const loadCommentsCount = async () => {
      try {
        const { comments } = await api.getComments(id);
        setCommentsCount(comments.length);
      } catch (error) {
        console.error("Error loading comments count:", error);
        toast.error("Error al cargar los comentarios");
      }
    };

    loadCommentsCount();
  }, [id]);

  // Load comments when showComments changes to true
  useEffect(() => {
    const loadComments = async () => {
      if (!showComments) return;
      
      try {
        setIsLoadingComments(true);
        const { comments } = await api.getComments(id);
        setCommentsList(comments);
        setCommentsCount(comments.length); // Update count when loading full comments
      } catch (error) {
        console.error("Error loading comments:", error);
        toast.error("Error al cargar los comentarios");
      } finally {
        setIsLoadingComments(false);
      }
    };

    loadComments();
  }, [showComments, id]);

  const handleLike = async () => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para dar like");
      return;
    }

    if (isLoadingLikes) return;

    try {
      setIsLoadingLikes(true);
      const { liked, likesCount } = await api.toggleLike(id, accessToken);
      setIsLiked(liked);
      setLikes(likesCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Error al actualizar el like");
    } finally {
      setIsLoadingLikes(false);
    }
  };

  const handleFollow = async () => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para seguir usuarios");
      return;
    }

    if (!author.userId) {
      toast.error("Usuario no disponible");
      return;
    }

    if (isLoadingFollow) return;

    try {
      setIsLoadingFollow(true);
      const { following, status } = await api.toggleFollow(author.userId, accessToken);
      
      // Update states based on response
      setIsFollowing(following);
      setIsPending(status === 'pending');
      
      // Show appropriate message based on the action
      if (status === 'pending') {
        toast.success(`Solicitud de seguimiento enviada a @${author.username}`);
      } else if (following) {
        toast.success(`Ahora sigues a @${author.username}`);
      } else {
        // User canceled pending request or unfollowed
        if (isPending) {
          toast.success(`Solicitud de seguimiento cancelada`);
        } else {
          toast.success(`Dejaste de seguir a @${author.username}`);
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Error al actualizar el seguimiento");
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    if (!accessToken) {
      toast.error("Debes iniciar sesión para comentar");
      return;
    }

    try {
      setIsSubmittingComment(true);
      console.log("💬 Enviando comentario...");
      const { comment } = await api.addComment(id, newComment.trim(), accessToken);
      console.log("✅ Comentario recibido del servidor:", comment);
      setCommentsList([comment, ...commentsList]);
      setCommentsCount(commentsCount + 1);
      setNewComment("");
      toast.success("Comentario publicado");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error al publicar el comentario");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'instagram') => {
    const shareUrl = window.location.href;
    const shareText = `Mira esta lista: ${title}`;
    
    if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
      window.open(whatsappUrl, '_blank');
    } else if (platform === 'instagram') {
      // Instagram doesn't have a direct web share URL
      // Copy to clipboard and show instructions
      navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado al portapapeles. Pégalo en tu Instagram Story o Bio.');
    }
  };

  const handleFavorite = async () => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      return;
    }

    if (isLoadingFavorite) return;

    try {
      setIsLoadingFavorite(true);
      const { favorited } = await api.toggleFavorite(id, accessToken);
      setIsFavorited(favorited);
      
      // If we're in favorite view and removing, call the callback
      if (!favorited && isFavoriteView && onRemoveFavorite) {
        onRemoveFavorite(id);
      }
      
      toast.success(favorited ? "Añadido a favoritos ⭐" : "Eliminado de favoritos");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Error al actualizar favoritos");
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleRadarToggle = async (item: TopListItem) => {
    if (!accessToken) {
      toast.error("Debes iniciar sesión para usar el radar");
      return;
    }

    const isInRadar = radarItems.has(item.title);
    
    if (isLoadingRadar.has(item.title)) return;

    try {
      setIsLoadingRadar(new Set(isLoadingRadar).add(item.title));

      if (isInRadar) {
        // Remove from radar
        const radarItemId = radarItems.get(item.title);
        if (radarItemId) {
          await api.removeFromRadar(radarItemId, accessToken);
          const newRadarItems = new Map(radarItems);
          newRadarItems.delete(item.title);
          setRadarItems(newRadarItems);
          toast.success("Eliminado del radar");
        }
      } else {
        // Add to radar
        const { radarItem } = await api.addToRadar(
          {
            itemTitle: item.title,
            itemDescription: item.description || "",
            itemImage: item.image || "",
            category,
            listId: id,
            listTitle: title,
          },
          accessToken
        );
        const newRadarItems = new Map(radarItems);
        newRadarItems.set(item.title, radarItem.id);
        setRadarItems(newRadarItems);
        toast.success("Añadido a tu radar 🎯");
      }
    } catch (error) {
      console.error("Error toggling radar:", error);
      toast.error("Error al actualizar el radar");
    } finally {
      const newLoadingRadar = new Set(isLoadingRadar);
      newLoadingRadar.delete(item.title);
      setIsLoadingRadar(newLoadingRadar);
    }
  };

  // Render rating with stars for high ratings (>=7) or dots for lower ratings (<7)
  const renderRating = (rating: number) => {
    const useStars = rating >= 7;
    const Icon = useStars ? Star : Circle;
    const fullCount = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex items-center">
          {Array.from({ length: 10 }).map((_, index) => {
            const isFilled = index < fullCount || (index === fullCount && hasHalf);
            return (
              <Icon
                key={index}
                className={`h-2.5 w-2.5 ${
                  isFilled
                    ? useStars
                      ? "fill-yellow-500 text-yellow-500"
                      : "fill-violet-500 text-violet-500"
                    : "fill-muted text-muted"
                }`}
              />
            );
          })}
        </div>
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    );
  };

  const CategoryIcon = getCategoryIcon(category);

  return (
    <Card className="overflow-hidden border-border bg-card">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <img src={author.avatar} alt={author.name} className="object-cover" />
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{author.name}</p>
            <p className="text-sm text-muted-foreground">@{author.username} · {timestamp}</p>
          </div>
          {accessToken && author.userId && currentUser?.userId !== author.userId && (
            <Button 
              variant={isFollowing || isPending ? "outline" : "default"} 
              size="sm"
              onClick={handleFollow}
              disabled={isLoadingFollow}
              className="shrink-0"
            >
              {isLoadingFollow ? "..." : isFollowing ? "Siguiendo" : isPending ? "Pendiente" : "Seguir"}
            </Button>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {coverImage && (
        <div className="w-full h-48 overflow-hidden bg-muted">
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1">
            <CategoryIcon className="h-3 w-3" />
            {category}
          </span>
          {genre && (
            <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
              {genre}
            </span>
          )}
        </div>
        <h3 className="mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap">{description}</p>

        {/* Top List Items */}
        <div className="space-y-2">
          {items.map((item) => {
            // Get criteria labels for this category
            const criteria = category && ratingCriteria[category] ? ratingCriteria[category] : [];
            const hasRatings = item.ratings && Object.keys(item.ratings).length > 0;
            
            // Capitalizar primera letra del título
            const capitalizedTitle = item.title.charAt(0).toUpperCase() + item.title.slice(1);
            
            const isInRadar = radarItems.has(item.title);
            const isLoadingThisItem = isLoadingRadar.has(item.title);
            
            return (
              <div 
                key={item.rank} 
                className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{item.rank}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Título con puntuación al lado */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{capitalizedTitle}</p>
                    {item.rating && item.rating > 0 && (
                      <span className="text-sm font-bold text-primary">
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                    {/* Radar Button */}
                    {accessToken && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isInRadar ? 'opacity-100' : ''
                        }`}
                        onClick={() => handleRadarToggle(item)}
                        disabled={isLoadingThisItem}
                        title={isInRadar ? "Eliminar del radar" : "Incluir en mi radar"}
                      >
                        <Radar className={`h-3.5 w-3.5 ${isInRadar ? 'fill-cyan-500 text-cyan-500' : ''}`} />
                        <span className="text-xs hidden sm:inline">
                          {isLoadingThisItem ? "..." : isInRadar ? "En radar" : "Radar"}
                        </span>
                      </Button>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  
                  {/* Show individual criterion ratings with crowns */}
                  {hasRatings && criteria.length > 0 && (
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2">
                      {criteria.map((criterion) => {
                        const criterionKey = getCriteriaKey(criterion);
                        const value = item.ratings?.[criterionKey];
                        if (!value || value === 0) return null;
                        
                        return (
                          <div key={criterionKey} className="flex items-center gap-1">
                            <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-muted-foreground">{criterion}:</span>
                            <span className="text-xs font-medium text-primary">{value.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {item.image && (
                  <div className="flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="h-5 w-5" />
            <span>{commentsCount}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {accessToken && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={handleFavorite}
              disabled={isLoadingFavorite}
            >
              <Star className={`h-5 w-5 ${isFavorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              <span className="hidden sm:inline">{isFavorited ? "Guardado" : "Guardar"}</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-5 w-5" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                <WhatsAppIcon className="mr-2 h-4 w-4" />
                <span>WhatsApp</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('instagram')}>
                <InstagramIcon className="mr-2 h-4 w-4" />
                <span>Instagram</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-border">
          {accessToken && currentUser && (
            <div className="flex gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <img src={currentUser.avatar} alt="You" className="object-cover" />
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario... 😊 Los emojis son bienvenidos! 🎉"
                  className="min-h-[60px]"
                  disabled={isSubmittingComment}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    💡 Tip: Usa emojis para expresarte mejor
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!accessToken && (
            <div className="text-center py-4 bg-muted/50 rounded-lg mb-3">
              <p className="text-sm text-muted-foreground">
                Inicia sesión para comentar
              </p>
            </div>
          )}

          {isLoadingComments ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
            </div>
          ) : commentsList.length > 0 ? (
            <div className="space-y-3 pt-3 border-t">
              {commentsList.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <img src={comment.user.avatar} alt={comment.user.username} className="object-cover" />
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="font-medium text-sm">@{comment.user.username}</p>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-3">
                      {comment.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-t">
              <p className="text-sm text-muted-foreground">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}