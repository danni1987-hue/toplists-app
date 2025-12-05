import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Radar, Search, SlidersHorizontal, Trash2, Edit3, Save, X } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner";
import { getCategoryIcon } from "../utils/categoryIcons";

interface RadarItem {
  id: string;
  userId: string;
  itemTitle: string;
  itemDescription: string;
  itemImage: string;
  category: string;
  listId: string;
  listTitle: string;
  notes: string;
  addedAt: string;
}

interface RadarViewProps {
  accessToken: string;
}

export function RadarView({ accessToken }: RadarViewProps) {
  const [radarItems, setRadarItems] = useState<RadarItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RadarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "category">("recent");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RadarItem | null>(null);

  // Load radar items
  useEffect(() => {
    loadRadarItems();
  }, [accessToken]);

  // Filter and sort items
  useEffect(() => {
    let filtered = [...radarItems];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.itemTitle.toLowerCase().includes(query) ||
          item.itemDescription.toLowerCase().includes(query) ||
          item.listTitle.toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== "todos") {
      filtered = filtered.filter(
        (item) => item.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    } else if (sortBy === "category") {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    }

    setFilteredItems(filtered);
  }, [radarItems, searchQuery, categoryFilter, sortBy]);

  const loadRadarItems = async () => {
    try {
      setIsLoading(true);
      const { radarItems: items } = await api.getRadarItems(accessToken);
      setRadarItems(items);
    } catch (error) {
      console.error("Error loading radar items:", error);
      toast.error("Error al cargar tu radar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async (itemId: string, notes: string) => {
    try {
      await api.updateRadarNotes(itemId, notes, accessToken);
      setRadarItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, notes } : item))
      );
      setEditingNoteId(null);
      toast.success("Notas actualizadas");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Error al actualizar las notas");
    }
  };

  const handleDeleteItem = async (item: RadarItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.removeFromRadar(itemToDelete.id, accessToken);
      setRadarItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      toast.success("Item eliminado del radar");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error removing from radar:", error);
      toast.error("Error al eliminar del radar");
    }
  };

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      películas: "Películas",
      música: "Música",
      viajes: "Viajes",
      series: "Series",
      libros: "Libros",
      "juegos de mesa": "Juegos de mesa",
      "escape room": "Escape room",
      videojuegos: "Videojuegos",
    };
    return categoryMap[category.toLowerCase()] || category;
  };

  // Get unique categories from radar items
  const uniqueCategories = Array.from(
    new Set(radarItems.map((item) => item.category.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando tu radar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 flex items-center justify-center">
          <Radar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl">Mi Radar</h1>
          <p className="text-muted-foreground">
            {radarItems.length} {radarItems.length === 1 ? "item" : "items"} guardados en tu radar
          </p>
        </div>
      </div>
      <h1 className="text-xs text-muted-foreground">Utiliza esta sección para guardar elementos (series o peliculas que quieres ver, juegos que quieres probar, libros pendientes de lectura...etc)</h1>
      

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en radar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {uniqueCategories.map((cat) => {
                const IconComponent = getCategoryIcon(cat);
                return (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {getCategoryName(cat)}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Más reciente
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Más antiguo
                </div>
              </SelectItem>
              <SelectItem value="category">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Por categoría
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Radar Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
              <Radar className="w-10 h-10 text-violet-500" />
            </div>
            <h3>
              {searchQuery || categoryFilter !== "todos"
                ? "No se encontraron resultados"
                : "Tu radar está vacío"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "todos"
                ? "Intenta ajustar los filtros de búsqueda"
                : 'Añade items desde las listas públicas usando el botón "Incluir en mi radar"'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => {
            const IconComponent = getCategoryIcon(item.category);
            const isEditingNote = editingNoteId === item.id;

            return (
              <Card key={item.id} className="p-4 space-y-4 hover:shadow-lg transition-shadow">
                {/* Item Header */}
                <div className="flex gap-3">
                  {item.itemImage ? (
                    <img
                      src={item.itemImage}
                      alt={item.itemTitle}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-8 w-8 text-violet-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm truncate mb-1">{item.itemTitle}</h3>
                    {item.itemDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.itemDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getCategoryName(item.category)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Notas personales</span>
                    {!isEditingNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setEditingNoteId(item.id);
                          setEditingNoteText(item.notes);
                        }}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        placeholder="Añade tus notas aquí..."
                        className="min-h-[80px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveNotes(item.id, editingNoteText)}
                          className="flex-1"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteText("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm bg-muted/50 rounded-md px-3 py-2 min-h-[60px]">
                      {item.notes || (
                        <span className="text-muted-foreground italic">
                          Sin notas todavía
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.addedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar de tu radar?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{itemToDelete?.itemTitle}" de tu radar?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}