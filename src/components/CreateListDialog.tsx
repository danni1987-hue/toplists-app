import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, X, Loader2, Image as ImageIcon, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getCategories } from "../utils/api";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getCategoryIcon } from "../utils/categoryIcons";
import { ImageSearchDialog } from "./ImageSearchDialog";
import { ratingCriteria, getCriteriaKey, calculateAverageRating, getDefaultRatings } from "../utils/ratingCriteria";
import { RatingStars } from "./RatingStars";
import { MovieSeriesAutocomplete } from "./MovieSeriesAutocomplete";
import { BoardGameAutocomplete } from "./BoardGameAutocomplete";
import { BookAutocomplete } from "./BookAutocomplete";
import { MusicAutocomplete } from "./MusicAutocomplete";
import { VideogameAutocomplete } from "./VideogameAutocomplete";

interface Category {
  id: string;
  category_name: string;
  subcategories?: { id: string; subcategory_name: string }[];
}

interface CreateListDialogProps {
  onCreateList: (list: any) => void;
  accessToken?: string | null;
}

export function CreateListDialog({ onCreateList, accessToken }: CreateListDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [currentSearchingRank, setCurrentSearchingRank] = useState<number | null>(null);
  const [items, setItems] = useState([
    { rank: 1, title: "", description: "", image: "", rating: 0, ratings: {} },
    { rank: 2, title: "", description: "", image: "", rating: 0, ratings: {} },
    { rank: 3, title: "", description: "", image: "", rating: 0, ratings: {} },
  ]);

  // Load categories when dialog opens
  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open]);

  // Initialize ratings when category changes
  useEffect(() => {
    if (category) {
      const defaultRatings = getDefaultRatings(category);
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          ratings: defaultRatings
        }))
      );
    }
  }, [category]);

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

  // Get subcategories for selected category
  const selectedCategoryData = categories.find(c => c.category_name === category);
  const availableSubcategories = selectedCategoryData?.subcategories || [];

  const addItem = () => {
    setItems([...items, { rank: items.length + 1, title: "", description: "", image: "", rating: 0, ratings: {} }]);
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

  // Auto-fetch image from Unsplash based on item title
  const handleFetchImage = async (rank: number) => {
    const item = items.find(i => i.rank === rank);
    
    if (!item || !item.title.trim()) {
      toast.error("Primero escribe un título para el item");
      return;
    }

    setLoadingImages(prev => ({ ...prev, [rank]: true }));
    
    try {
      // Use a reliable placeholder image service that works instantly
      // We'll use picsum.photos with a seed based on the title for consistent images
      const seed = encodeURIComponent(item.title.toLowerCase().replace(/\s+/g, '-'));
      const imageUrl = `https://picsum.photos/seed/${seed}/400/400`;
      
      updateItem(rank, "image", imageUrl);
      toast.success("Imagen cargada automáticamente");
    } catch (error) {
      console.error("Error fetching image:", error);
      toast.error("Error al cargar la imagen");
    } finally {
      setLoadingImages(prev => ({ ...prev, [rank]: false }));
    }
  };

  const handleSubmit = () => {
    console.log("🎯 CreateListDialog handleSubmit - accessToken:", accessToken ? `${accessToken.substring(0, 20)}...` : "NULL/UNDEFINED");
    console.log("📋 Items actuales:", items);
    
    if (!accessToken) {
      toast.error("Debes iniciar sesión para crear listas");
      setOpen(false);
      return;
    }

    if (!title || !category || items.length < 3) {
      toast.error("Completa el título, categoría y al menos 3 items");
      return;
    }

    const validItems = items.filter(item => item.title);
    console.log("✅ Items válidos (con título):", validItems);
    console.log("📊 Total items válidos:", validItems.length);
    
    if (validItems.length < 3) {
      toast.error("Debes agregar al menos 3 items con título");
      return;
    }

    const newList = {
      title,
      description,
      category,
      subcategory: subcategory || undefined,
      items: validItems.map(item => ({
        name: item.title,
        description: item.description,
        image: item.image,
        rating: item.rating,
        ratings: item.ratings, // Include detailed ratings
      })),
    };

    console.log("🎯 Calling onCreateList with list:", newList);
    onCreateList(newList);
    
    // Reset form
    setTitle("");
    setDescription("");
    setCategory("");
    setSubcategory("");
    setItems([
      { rank: 1, title: "", description: "", image: "", rating: 0, ratings: {} },
      { rank: 2, title: "", description: "", image: "", rating: 0, ratings: {} },
      { rank: 3, title: "", description: "", image: "", rating: 0, ratings: {} },
    ]);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2 rounded-full shadow-lg">
            <Plus className="h-5 w-5" />
            Crear Lista
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Lista Top</DialogTitle>
            <DialogDescription>Comparte tus favoritos en una lista top</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Título de la lista</Label>
              <Input 
                id="title"
                placeholder="Ej: Mis 5 películas favoritas de 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea 
                id="description"
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
                <Label htmlFor="category">Categoría</Label>
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
                    {categories.map((cat) => {
                      const IconComponent = getCategoryIcon(cat.category_name);
                      return (
                        <SelectItem key={cat.id} value={cat.category_name}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {cat.category_name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subcategory">Subcategoría (opcional)</Label>
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
                          value={item.title}
                          onChange={(value) => {
                            console.log("✍️ Usuario escribiendo:", value);
                            updateItem(item.rank, "title", value);
                          }}
                          onSelect={(media) => {
                            console.log("📥 Recibido en CreateListDialog:", media);
                            console.log("📝 Actualizando item rank:", item.rank);
                            updateItem(item.rank, "title", media.title);
                            updateItem(item.rank, "description", media.description);
                            updateItem(item.rank, "image", media.image);
                            console.log("✅ Items actualizados");
                          }}
                          placeholder="Buscar película o serie..."
                        />
                      ) : category === "Música" ? (
                        <MusicAutocomplete
                          value={item.title}
                          onChange={(value) => {
                            console.log("✍️ Usuario escribiendo música:", value);
                            updateItem(item.rank, "title", value);
                          }}
                          onSelect={(music) => {
                            console.log("🎵 Recibido en CreateListDialog:", music);
                            console.log("📝 Actualizando item rank:", item.rank);
                            updateItem(item.rank, "title", music.title);
                            updateItem(item.rank, "description", music.description);
                            updateItem(item.rank, "image", music.image);
                            console.log("✅ Items actualizados");
                          }}
                          placeholder="Buscar artista o álbum..."
                        />
                      ) : category === "Libros" ? (
                        <BookAutocomplete
                          value={item.title}
                          onChange={(value) => {
                            console.log("✍️ Usuario escribiendo libro:", value);
                            updateItem(item.rank, "title", value);
                          }}
                          onSelect={(book) => {
                            console.log("📚 Recibido en CreateListDialog:", book);
                            console.log("📝 Actualizando item rank:", item.rank);
                            updateItem(item.rank, "title", book.title);
                            updateItem(item.rank, "description", book.description);
                            updateItem(item.rank, "image", book.image);
                            console.log("✅ Items actualizados");
                          }}
                          placeholder="Buscar libro..."
                        />
                      ) : category === "Juegos de mesa" ? (
                        <BoardGameAutocomplete
                          value={item.title}
                          onChange={(value) => {
                            console.log("✍️ Usuario escribiendo juego:", value);
                            updateItem(item.rank, "title", value);
                          }}
                          onSelect={(game) => {
                            console.log("🎲 Recibido en CreateListDialog:", game);
                            console.log("📝 Actualizando item rank:", item.rank);
                            updateItem(item.rank, "title", game.title);
                            updateItem(item.rank, "description", game.description);
                            updateItem(item.rank, "image", game.image);
                            console.log("✅ Items actualizados");
                          }}
                          placeholder="Buscar juego de mesa..."
                        />
                      ) : category === "Videojuegos" ? (
                        <VideogameAutocomplete
                          value={item.title}
                          onChange={(value) => {
                            console.log("✍️ Usuario escribiendo videojuego:", value);
                            updateItem(item.rank, "title", value);
                          }}
                          onSelect={(game) => {
                            console.log("🎮 Recibido en CreateListDialog:", game);
                            console.log("📝 Actualizando item rank:", item.rank);
                            updateItem(item.rank, "title", game.title);
                            updateItem(item.rank, "description", game.description);
                            updateItem(item.rank, "image", game.image);
                            console.log("✅ Items actualizados");
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
                        value={item.description}
                        onChange={(e) => updateItem(item.rank, "description", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-1">
                          <Input 
                            placeholder="URL de imagen (opcional)"
                            value={item.image}
                            onChange={(e) => updateItem(item.rank, "image", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => {
                              if (!item.title.trim()) {
                                toast.error("Primero escribe un título");
                                return;
                              }
                              setCurrentSearchingRank(item.rank);
                              setImageSearchOpen(true);
                            }}
                            disabled={!item.title}
                            title="Buscar imagen"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
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
                              {item.rating > 0 ? `${item.rating.toFixed(1)}/10` : "0/10"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {ratingCriteria[category].map((criterion) => {
                              const criterionKey = getCriteriaKey(criterion);
                              const value = (item.ratings as Record<string, number>)[criterionKey] || 0;
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
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                Publicar Lista
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Search Dialog */}
      {currentSearchingRank !== null && (
        <ImageSearchDialog
          open={imageSearchOpen}
          onOpenChange={setImageSearchOpen}
          searchQuery={items.find(i => i.rank === currentSearchingRank)?.title || ""}
          onSelectImage={(imageUrl) => {
            if (currentSearchingRank !== null) {
              updateItem(currentSearchingRank, "image", imageUrl);
              toast.success("Imagen seleccionada");
            }
          }}
        />
      )}
    </>
  );
}