import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Film, Tv, Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface MediaResult {
  id: number;
  title: string;
  originalTitle: string;
  year: string;
  type: "Película" | "Serie";
  image: string | null;
  overview: string;
  rating: string | null;
}

interface MovieSeriesAutocompleteProps {
  value: string;
  onSelect: (media: { title: string; image: string; description: string }) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function MovieSeriesAutocomplete({ 
  value, 
  onSelect,
  onChange,
  placeholder = "Buscar película o serie..." 
}: MovieSeriesAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<MediaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Search TMDb API
  useEffect(() => {
    const searchMedia = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      console.log("🔍 Buscando en TMDb:", searchQuery);
      setLoading(true);
      try {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-e2505fcb/search-media?query=${encodeURIComponent(searchQuery)}`;
        console.log("📡 URL de búsqueda:", url);
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        console.log("📨 Respuesta del servidor:", response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos recibidos de TMDb:", data);
          setResults(data.results || []);
          setShowResults(true);
        } else {
          const errorText = await response.text();
          console.error("❌ Error en respuesta:", errorText);
        }
      } catch (error) {
        console.error("❌ Error searching media:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchMedia, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (media: MediaResult) => {
    console.log("🎬 Media seleccionado:", media);
    setSelectedMedia(media);
    setSearchQuery(media.title); // Solo el título, sin año
    setShowResults(false);
    
    // Notify parent of the new value
    if (onChange) {
      onChange(media.title);
    }
    
    // Return formatted data to parent - título sin año para consistencia
    const formattedData = {
      title: media.title, // Solo el título original
      image: media.image || "",
      description: media.overview || "",
    };
    console.log("📤 Enviando datos al padre:", formattedData);
    onSelect(formattedData);
  };

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    setSelectedMedia(null);
    if (newValue.length >= 2) {
      setShowResults(true);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={placeholder}
          className={selectedMedia ? "border-primary" : ""}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {results.map((media) => (
            <button
              key={`${media.id}-${media.type}`}
              onClick={() => handleSelect(media)}
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
            >
              {/* Thumbnail */}
              {media.image ? (
                <img
                  src={media.image}
                  alt={media.title}
                  className="w-12 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  {media.type === "Película" ? (
                    <Film className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Tv className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{media.title}</p>
                    {media.originalTitle !== media.title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {media.originalTitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {media.type === "Película" ? (
                      <Film className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Tv className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">{media.year}</span>
                  </div>
                </div>
                {media.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-yellow-500">★</span>
                    <span className="text-xs text-muted-foreground">{media.rating}/10</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && !loading && searchQuery.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No se encontraron películas o series
        </div>
      )}
    </div>
  );
}