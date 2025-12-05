import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSelectImage: (imageUrl: string) => void;
}

export function ImageSearchDialog({ 
  open, 
  onOpenChange, 
  searchQuery: initialQuery,
  onSelectImage 
}: ImageSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [open, initialQuery]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      toast.error("Escribe algo para buscar");
      return;
    }

    setLoading(true);
    try {
      // Use Picsum Photos with different seeds based on search term
      const mockResults = Array.from({ length: 12 }, (_, index) => {
        const seed = `${searchTerm.toLowerCase().replace(/\s+/g, '-')}-${index}`;
        return {
          id: `picsum-${seed}`,
          urls: {
            small: `https://picsum.photos/seed/${seed}/400/400`,
            regular: `https://picsum.photos/seed/${seed}/800/800`
          },
          alt_description: `${searchTerm} ${index + 1}`
        };
      });

      setImages(mockResults);
    } catch (error) {
      console.error("Error searching images:", error);
      toast.error("Error al buscar imágenes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Imagen</DialogTitle>
          <DialogDescription>Encuentra imágenes para tu lista</DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar imágenes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(query);
                }
              }}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Buscar"
            )}
          </Button>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Buscando imágenes...</p>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p>Busca imágenes para tu lista</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group hover:ring-2 hover:ring-cyan-500 transition-all"
                  onClick={() => handleSelectImage(image.urls.regular)}
                >
                  <img
                    src={image.urls.small}
                    alt={image.alt_description || "Unsplash image"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                      <Search className="h-5 w-5 text-cyan-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with attribution */}
        {images.length > 0 && (
          <div className="text-xs text-gray-400 text-center pt-2 border-t">
            Imágenes de{" "}
            <a
              href="https://picsum.photos"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Picsum Photos
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}