import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Music, Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface MusicResult {
  id: string;
  title: string;
  artist: string;
  year: string;
  type: "Artista" | "Álbum";
  image: string | null;
  description: string;
}

interface MusicAutocompleteProps {
  value: string;
  onSelect: (music: { title: string; image: string; description: string }) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function MusicAutocomplete({ 
  value, 
  onSelect,
  onChange,
  placeholder = "Buscar artista o álbum..." 
}: MusicAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<MusicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Search TheAudioDB API
  useEffect(() => {
    const searchMusic = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      console.log("🎵 Buscando en TheAudioDB:", searchQuery);
      setLoading(true);
      try {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-e2505fcb/search-music?query=${encodeURIComponent(searchQuery)}`;
        console.log("📡 URL de búsqueda:", url);
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        console.log("📨 Respuesta del servidor:", response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos recibidos de TheAudioDB:", data);
          setResults(data.results || []);
          setShowResults(true);
        } else {
          const errorText = await response.text();
          console.error("❌ Error en respuesta:", errorText);
        }
      } catch (error) {
        console.error("❌ Error searching music:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchMusic, 400);
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

  const handleSelect = (music: MusicResult) => {
    console.log("🎵 Música seleccionada:", music);
    setSelectedMusic(music);
    setSearchQuery(music.title);
    setShowResults(false);
    
    // Notify parent of the new value
    if (onChange) {
      onChange(music.title);
    }
    
    // Return formatted data to parent
    const formattedData = {
      title: music.title,
      image: music.image || "",
      description: music.description || "",
    };
    console.log("📤 Enviando datos al padre:", formattedData);
    onSelect(formattedData);
  };

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    setSelectedMusic(null);
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
          className={selectedMusic ? "border-primary" : ""}
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
          {results.map((music) => (
            <button
              key={music.id}
              onClick={() => handleSelect(music)}
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
            >
              {/* Thumbnail */}
              {music.image ? (
                <img
                  src={music.image}
                  alt={music.title}
                  className="w-12 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Music className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{music.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {music.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Music className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{music.type}</span>
                    {music.year && music.year !== "N/A" && (
                      <span className="text-xs text-muted-foreground ml-1">({music.year})</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && !loading && searchQuery.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No se encontraron artistas o álbumes
        </div>
      )}
    </div>
  );
}