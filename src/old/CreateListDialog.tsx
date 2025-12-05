import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface CreateListDialogProps {
  onCreateList: (list: any) => void;
}

export function CreateListDialog({ onCreateList }: CreateListDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [genre, setGenre] = useState("");
  const [items, setItems] = useState([
    { rank: 1, title: "", description: "", image: "", rating: 0 },
    { rank: 2, title: "", description: "", image: "", rating: 0 },
    { rank: 3, title: "", description: "", image: "", rating: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { rank: items.length + 1, title: "", description: "", image: "", rating: 0 }]);
  };

  const removeItem = (rank: number) => {
    const newItems = items.filter(item => item.rank !== rank)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    setItems(newItems);
  };

  const updateItem = (rank: number, field: string, value: string | number) => {
    setItems(items.map(item => 
      item.rank === rank ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = () => {
    if (!title || !category || items.length < 3) return;

    const newList = {
      id: Date.now().toString(),
      author: {
        name: "Tú",
        avatar: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=100",
        username: "usuario"
      },
      title,
      description,
      category,
      genre: genre || undefined,
      items: items.filter(item => item.title),
      likes: 0,
      comments: 0,
      timestamp: "Ahora"
    };

    onCreateList(newList);
    
    // Reset form
    setTitle("");
    setDescription("");
    setCategory("");
    setGenre("");
    setItems([
      { rank: 1, title: "", description: "", image: "", rating: 0 },
      { rank: 2, title: "", description: "", image: "", rating: 0 },
      { rank: 3, title: "", description: "", image: "", rating: 0 },
    ]);
    setOpen(false);
  };

  return (
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
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Películas">🎬 Películas</SelectItem>
                  <SelectItem value="Series">📺 Series</SelectItem>
                  <SelectItem value="Música">🎵 Música</SelectItem>
                  <SelectItem value="Comida">🍕 Comida</SelectItem>
                  <SelectItem value="Viajes">✈️ Viajes</SelectItem>
                  <SelectItem value="Libros">📚 Libros</SelectItem>
                  <SelectItem value="Videojuegos">🎮 Videojuegos</SelectItem>
                  <SelectItem value="Deportes">⚽ Deportes</SelectItem>
                  <SelectItem value="Otro">✨ Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="genre">Género (opcional)</Label>
              <Input 
                id="genre"
                placeholder="Ej: Terror, Acción, Comedia..."
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-1"
              />
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
                    <Input 
                      placeholder="Título del item"
                      value={item.title}
                      onChange={(e) => updateItem(item.rank, "title", e.target.value)}
                    />
                    <Input 
                      placeholder="Descripción (opcional)"
                      value={item.description}
                      onChange={(e) => updateItem(item.rank, "description", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="URL de imagen (opcional)"
                        value={item.image}
                        onChange={(e) => updateItem(item.rank, "image", e.target.value)}
                      />
                      <Input 
                        type="number"
                        placeholder="Puntuación (1-10)"
                        min="0"
                        max="10"
                        step="0.1"
                        value={item.rating || ""}
                        onChange={(e) => updateItem(item.rank, "rating", parseFloat(e.target.value) || 0)}
                      />
                    </div>
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
  );
}
