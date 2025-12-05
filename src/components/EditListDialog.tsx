import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogFooter, DialogDescription  } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, X, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { getCategories } from "../utils/api";
import { toast } from "sonner";
import { ratingCriteria, getCriteriaKey, calculateAverageRating } from "../utils/ratingCriteria";
import { RatingStars } from "./RatingStars";
import { MovieSeriesAutocomplete } from "./MovieSeriesAutocomplete";
import { BoardGameAutocomplete } from "./BoardGameAutocomplete";
import { BookAutocomplete } from "./BookAutocomplete";
import { MusicAutocomplete } from "./MusicAutocomplete";
import { VideogameAutocomplete } from "./VideogameAutocomplete";


interface ListItem {
  rank: number;
  name?: string;
  title?: string;
  description?: string;
  image?: string;
  rating?: number;
  ratings?: Record<string, number>;
}

interface Category {
  id: string;
  category_name: string;
  subcategories?: { id: string; subcategory_name: string }[];
}

interface EditListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: {
    id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    items: ListItem[];
  } | null;
  onUpdateList: (id: string, updatedList: any) => void;
}

export function EditListDialog({ open, onOpenChange, list, onUpdateList }: EditListDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    if (list) {
      setTitle(list.title);
      setDescription(list.description);
      setCategory(list.category);
      setSubcategory(list.subcategory || "");
      setItems(list.items.map(item => ({ 
        ...item,
        title: item.name || item.title || "",
      })));
    }
  }, [list]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setLoadingCategories(false);
    }
  };

  const selectedCategoryData = categories.find(c => c.category_name === category);
  const availableSubcategories = selectedCategoryData?.subcategories || [];

  const addItem = () => {
    setItems([...items, { rank: items.length + 1, title: "", description: "", image: "", rating: 0 }]);
  };

  const removeItem = (rank: number) => {
    const newItems = items.filter(item => item.rank !== rank)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    setItems(newItems);
  };

  const updateItem = (rank: number, field: string, value: string | number | Record<string, number>) => {
    setItems(items.map(item => {
      if (item.rank === rank) {
        const updated = { ...item, [field]: value };
        // If ratings changed, recalculate the overall rating
        if (field === "ratings" && typeof value === "object") {
          updated.rating = calculateAverageRating(value as Record<string, number>);
        }
        return updated;
      }
      return item;
    }));
  };

  // Update a specific rating criterion for an item
  const updateItemRating = (rank: number, criterionKey: string, value: number) => {
    const item = items.find(i => i.rank === rank);
    if (!item) return;
    
    const newRatings = { ...item.ratings, [criterionKey]: value };
    updateItem(rank, "ratings", newRatings);
  };

  const handleSubmit = () => {
    if (!list || !title || !category) {
      toast.error("Completa el título y categoría");
      return;
    }

    const validItems = items.filter(item => item.title);
    if (validItems.length < 3) {
      toast.error("Debes tener al menos 3 items con título");
      return;
    }

    const updatedList = {
      title,
      description,
      category,
      subcategory: subcategory || undefined,
      items: validItems.map(item => ({
        name: item.title,
        description: item.description,
        image: item.image,
        rating: item.rating,
        ratings: item.ratings || {}, // Include detailed ratings
      })),
    };

    onUpdateList(list.id, updatedList);
    onOpenChange(false);
  };

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lista</DialogTitle>
          <DialogDescription>Modifica los detalles de tu lista.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="edit-title">Título de la lista</Label>
            <Input 
              id="edit-title"
              placeholder="Ej: Mis 5 películas favoritas de 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="edit-description">Descripción (opcional)</Label>
            <Textarea 
              id="edit-description"
              placeholder="Comparte por qué elegiste estas opciones..."
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setDescription(value);
                }
              }}
              className="mt-1 resize-none"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/1000 caracteres
            </p>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Categoría</Label>
              <Select 
                value={category} 
                onValueChange={(value) => {
                  setCategory(value);
                  setSubcategory(""); // Reset subcategory when category changes
                }}
                disabled={loadingCategories}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingCategories ? "Cargando..." : "Selecciona una categoría"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-subcategory">Subcategoría (opcional)</Label>
              <Select 
                value={subcategory} 
                onValueChange={setSubcategory}
                disabled={!category || availableSubcategories.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={
                    !category 
                      ? "Primero selecciona categoría" 
                      : availableSubcategories.length === 0 
                        ? "Sin subcategorías" 
                        : "Selecciona subcategoría"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.subcategory_name}>
                      {subcat.subcategory_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div>
            <Label>Items de la lista</Label>
            <div className="space-y-3 mt-2">
              {items.map((item) => (
                <div key={item.rank} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <span className="text-sm font-medium text-primary">{item.rank}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* Title input - use autocomplete for Movies/Series/Books/Music/Board Games, regular input for others */}
                    {category === "Películas" || category === "Series" ? (
                      <MovieSeriesAutocomplete
                        value={item.title || ""}
                        onChange={(value) => {
                          updateItem(item.rank, "title", value);
                        }}
                        onSelect={(media) => {
                          updateItem(item.rank, "title", media.title);
                          updateItem(item.rank, "description", media.description);
                          updateItem(item.rank, "image", media.image);
                        }}
                        placeholder="Buscar película o serie..."
                      />
                    ) : category === "Música" ? (
                      <MusicAutocomplete
                        value={item.title || ""}
                        onChange={(value) => {
                          updateItem(item.rank, "title", value);
                        }}
                        onSelect={(music) => {
                          updateItem(item.rank, "title", music.title);
                          updateItem(item.rank, "description", music.description);
                          updateItem(item.rank, "image", music.image);
                        }}
                        placeholder="Buscar artista o álbum..."
                      />
                    ) : category === "Libros" ? (
                      <BookAutocomplete
                        value={item.title || ""}
                        onChange={(value) => {
                          updateItem(item.rank, "title", value);
                        }}
                        onSelect={(book) => {
                          updateItem(item.rank, "title", book.title);
                          updateItem(item.rank, "description", book.description);
                          updateItem(item.rank, "image", book.image);
                        }}
                        placeholder="Buscar libro..."
                      />
                    ) : category === "Juegos de mesa" ? (
                      <BoardGameAutocomplete
                        value={item.title || ""}
                        onChange={(value) => {
                          updateItem(item.rank, "title", value);
                        }}
                        onSelect={(game) => {
                          updateItem(item.rank, "title", game.title);
                          updateItem(item.rank, "description", game.description);
                          updateItem(item.rank, "image", game.image);
                        }}
                        placeholder="Buscar juego de mesa..."
                      />
                    ) : category === "Videojuegos" ? (
                      <VideogameAutocomplete
                        value={item.title || ""}
                        onChange={(value) => {
                          updateItem(item.rank, "title", value);
                        }}
                        onSelect={(game) => {
                          updateItem(item.rank, "title", game.title);
                          updateItem(item.rank, "description", game.description);
                          updateItem(item.rank, "image", game.image);
                        }}
                        placeholder="Buscar videojuego..."
                      />
                    ) : (
                      <Input 
                        placeholder="Título del item"
                        value={item.title}
                        onChange={(e) => updateItem(item.rank, "title", e.target.value)}
                      />
                    )}
                    <Input 
                      placeholder="Descripción (opcional)"
                      value={item.description || ""}
                      onChange={(e) => updateItem(item.rank, "description", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="URL de imagen (opcional)"
                        value={item.image || ""}
                        onChange={(e) => updateItem(item.rank, "image", e.target.value)}
                      />
                    </div>
                    
                    {/* Rating Criteria - Only show if category is selected */}
                    {category && ratingCriteria[category] && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Criterios de Puntuación
                          </Label>
                          <span className="text-sm font-medium text-primary">
                            {item.rating && item.rating > 0 ? `${item.rating.toFixed(1)}/10` : "0/10"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {ratingCriteria[category].map((criterion) => {
                            const criterionKey = getCriteriaKey(criterion);
                            const value = item.ratings?.[criterionKey] || 0;
                            return (
                              <div key={criterionKey} className="flex items-center justify-between gap-3">
                                <Label className="text-xs flex-1">{criterion}</Label>
                                <RatingStars
                                  value={value}
                                  onChange={(val) => updateItemRating(item.rank, criterionKey, val)}
                                  size="sm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {items.length > 3 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.rank)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {items.length < 10 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Item
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}