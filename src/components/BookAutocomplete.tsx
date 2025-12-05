import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { BookOpen, Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface BookResult {
  id: string;
  title: string;
  authors: string[];
  year: string;
  image: string | null;
  description: string;
}

interface BookAutocompleteProps {
  value: string;
  onSelect: (book: { title: string; image: string; description: string }) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function BookAutocomplete({ 
  value, 
  onSelect,
  onChange,
  placeholder = "Buscar libro..." 
}: BookAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Search Google Books API
  useEffect(() => {
    const searchBooks = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      console.log("📚 Buscando en Google Books:", searchQuery);
      setLoading(true);
      try {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-e2505fcb/search-books?query=${encodeURIComponent(searchQuery)}`;
        console.log("📡 URL de búsqueda:", url);
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        console.log("📨 Respuesta del servidor:", response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos recibidos de Google Books:", data);
          setResults(data.results || []);
          setShowResults(true);
        } else {
          const errorText = await response.text();
          console.error("❌ Error en respuesta:", errorText);
        }
      } catch (error) {
        console.error("❌ Error searching books:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchBooks, 400);
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

  const handleSelect = (book: BookResult) => {
    console.log("📖 Libro seleccionado:", book);
    setSelectedBook(book);
    setSearchQuery(book.title);
    setShowResults(false);
    
    // Notify parent of the new value
    if (onChange) {
      onChange(book.title);
    }
    
    // Return formatted data to parent
    const formattedData = {
      title: book.title,
      image: book.image || "",
      description: book.description || "",
    };
    console.log("📤 Enviando datos al padre:", formattedData);
    onSelect(formattedData);
  };

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    setSelectedBook(null);
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
          className={selectedBook ? "border-primary" : ""}
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
          {results.map((book) => (
            <button
              key={book.id}
              onClick={() => handleSelect(book)}
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
            >
              {/* Thumbnail */}
              {book.image ? (
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    {book.authors.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {book.authors.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{book.year}</span>
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
          No se encontraron libros
        </div>
      )}
    </div>
  );
}