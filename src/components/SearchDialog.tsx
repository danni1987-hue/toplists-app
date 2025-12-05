import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Search, User, List, X } from "lucide-react";
import { api } from "../utils/api";
import { getCategoryIcon } from "../utils/categoryIcons";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectList?: (listId: string) => void;
  onSelectUser?: (userId: string) => void;
}

export function SearchDialog({ open, onOpenChange, onSelectList, onSelectUser }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setLists([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.search(query);
        setUsers(results.users || []);
        setLists(results.lists || []);
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectList = (listId: string) => {
    onSelectList && onSelectList(listId);
    onOpenChange(false);
    setQuery("");
    setUsers([]);
    setLists([]);
  };

  const handleSelectUser = (userId: string) => {
    onSelectUser && onSelectUser(userId);
    onOpenChange(false);
    setQuery("");
    setUsers([]);
    setLists([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar</DialogTitle>
          <DialogDescription>
            Busca usuarios o listas por nombre
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          {isSearching && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
            </div>
          )}

          {!isSearching && !query && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Escribe para buscar usuarios o listas
              </p>
            </div>
          )}

          {!isSearching && query && users.length === 0 && lists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No se encontraron resultados para "{query}"
              </p>
            </div>
          )}

          {/* Users Results */}
          {users.length > 0 && (
            <div>
              <h3 className="text-sm flex items-center gap-2 mb-3">
                <User className="h-4 w-4" />
                Usuarios ({users.length})
              </h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <img src={user.avatar} alt={user.username} className="object-cover" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name || user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lists Results */}
          {lists.length > 0 && (
            <div>
              <h3 className="text-sm flex items-center gap-2 mb-3">
                <List className="h-4 w-4" />
                Listas ({lists.length})
              </h3>
              <div className="space-y-2">
                {lists.map((list) => {
                  const CategoryIcon = getCategoryIcon(list.category);
                  return (
                    <button
                      key={list.id}
                      onClick={() => handleSelectList(list.id)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{list.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {list.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-4 w-4">
                            <img src={list.author.avatar} alt={list.author.username} className="object-cover" />
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            @{list.author.username}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {list.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}