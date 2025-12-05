import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Dice6, Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface BoardGameResult {
  id: number;
  title: string;
  year: string;
  image: string | null;
  description: string;
  rating: string | null;
}

interface BoardGameAutocompleteProps {
  value: string;
  onSelect: (game: { title: string; image: string; description: string }) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function BoardGameAutocomplete({ 
  value, 
  onSelect,
  onChange,
  placeholder = "Buscar juego de mesa..." 
}: BoardGameAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<BoardGameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedGame, setSelectedGame] = useState<BoardGameResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Search BGG API
  useEffect(() => {
    const searchGames = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      console.log("🎲 Buscando en BGG:", searchQuery);
      setLoading(true);
      try {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-e2505fcb/search-boardgames?query=${encodeURIComponent(searchQuery)}`;
        console.log("📡 URL de búsqueda BGG:", url);
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        console.log("📨 Respuesta del servidor BGG:", response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos recibidos de BGG:", data);
          setResults(data.results || []);
          setShowResults(true);
        } else {
          const errorText = await response.text();
          console.error("❌ Error en respuesta BGG:", errorText);
        }
      } catch (error) {
        console.error("❌ Error searching board games:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchGames, 500); // Longer delay for BGG
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

  const handleSelect = (game: BoardGameResult) => {
    console.log("🎲 Juego seleccionado:", game);
    setSelectedGame(game);
    setSearchQuery(game.title);
    setShowResults(false);
    
    // Notify parent of the new value
    if (onChange) {
      onChange(game.title);
    }
    
    // Return formatted data to parent
    const formattedData = {
      title: game.title,
      image: game.image || "",
      description: game.description,
    };
    console.log("📤 Enviando datos al padre:", formattedData);
    onSelect(formattedData);
  };

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    setSelectedGame(null);
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
          className={selectedGame ? "border-primary" : ""}
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
          {results.map((game) => (
            <button
              key={game.id}
              onClick={() => handleSelect(game)}
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
            >
              {/* Thumbnail */}
              {game.image ? (
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-12 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Dice6 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{game.title}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Dice6 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{game.year}</span>
                  </div>
                </div>
                {game.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-yellow-500">★</span>
                    <span className="text-xs text-muted-foreground">{game.rating}/10</span>
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
          No se encontraron juegos de mesa
        </div>
      )}
    </div>
  );
}