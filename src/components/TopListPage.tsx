import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Crown, Trophy, Medal, Star } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner";
import { getCategoryIcon } from "../utils/categoryIcons";

interface TopItem {
  rank: number;
  name: string;
  averageRating: number;
  appearances: number;
  image: string;
  description: string;
}

interface TopItemsData {
  [category: string]: TopItem[];
}

export function TopListPage() {
  const [topItems, setTopItems] = useState<TopItemsData>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchTopItems();
  }, []);

  const fetchTopItems = async () => {
    try {
      setLoading(true);
      const response = await api.getTopItems();
      setTopItems(response.topItems || {});
      
      // Set first category as selected
      const firstCategory = Object.keys(response.topItems || {})[0];
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
    } catch (error) {
      console.error("Error fetching top items:", error);
      toast.error("Error al cargar los items mejor valorados");
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(topItems);
  const currentItems = selectedCategory ? topItems[selectedCategory] || [] : [];
  const top3 = currentItems.slice(0, 3);
  const rest = currentItems.slice(3, 10);

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Trophy className="h-7 w-7 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando rankings...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay items valorados aún</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="h-10 w-10 text-primary" />
          <h1 className="text-4xl">Top Rankings</h1>
        </div>
        <p className="text-muted-foreground">
          Los items mejor valorados por la comunidad en cada categoría
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="w-full justify-start mb-8 flex-wrap h-auto">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <TabsTrigger key={category} value={category} className="gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {category}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-8">
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                {top3[1] && (
                  <div className="md:order-1 flex flex-col">
                    <Card className="relative overflow-hidden flex-1 hover:shadow-lg transition-all border-2 border-gray-300/50">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gray-300 to-gray-400"></div>
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-center mb-4">
                          {getPodiumIcon(2)}
                        </div>
                        {top3[1].image && (
                          <div className="mb-4">
                            <img
                              src={top3[1].image}
                              alt={top3[1].name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="text-center flex-1 flex flex-col justify-center">
                          <h3 className="text-xl mb-2">{top3[1].name}</h3>
                          <div className="flex items-center justify-center gap-2 text-primary mb-2">
                            <Star className="h-5 w-5 fill-primary" />
                            <span className="text-2xl">{top3[1].averageRating.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {top3[1].appearances} {top3[1].appearances === 1 ? "aparición" : "apariciones"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <div className="md:order-2 flex flex-col">
                    <Card className="relative overflow-hidden flex-1 hover:shadow-2xl transition-all border-2 border-yellow-500/50 md:scale-105">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-center mb-4">
                          {getPodiumIcon(1)}
                        </div>
                        {top3[0].image && (
                          <div className="mb-4">
                            <img
                              src={top3[0].image}
                              alt={top3[0].name}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="text-center flex-1 flex flex-col justify-center">
                          <h3 className="text-2xl mb-2">{top3[0].name}</h3>
                          <div className="flex items-center justify-center gap-2 text-primary mb-2">
                            <Star className="h-6 w-6 fill-primary" />
                            <span className="text-3xl">{top3[0].averageRating.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {top3[0].appearances} {top3[0].appearances === 1 ? "aparición" : "apariciones"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <div className="md:order-3 flex flex-col">
                    <Card className="relative overflow-hidden flex-1 hover:shadow-lg transition-all border-2 border-amber-700/50">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 to-amber-800"></div>
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-center mb-4">
                          {getPodiumIcon(3)}
                        </div>
                        {top3[2].image && (
                          <div className="mb-4">
                            <img
                              src={top3[2].image}
                              alt={top3[2].name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="text-center flex-1 flex flex-col justify-center">
                          <h3 className="text-xl mb-2">{top3[2].name}</h3>
                          <div className="flex items-center justify-center gap-2 text-primary mb-2">
                            <Star className="h-5 w-5 fill-primary" />
                            <span className="text-2xl">{top3[2].averageRating.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {top3[2].appearances} {top3[2].appearances === 1 ? "aparición" : "apariciones"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Rest of the list (4-10) */}
            {rest.length > 0 && (
              <div>
                <h2 className="text-2xl mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  Top 4-10
                </h2>
                <div className="space-y-3">
                  {rest.map((item) => (
                    <Card
                      key={item.rank}
                      className="p-4 hover:shadow-md transition-all hover:bg-accent/50"
                    >
                      <div className="flex gap-4 items-center">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">#{item.rank}</span>
                        </div>

                        {/* Image */}
                        {item.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.appearances} {item.appearances === 1 ? "aparición" : "apariciones"}
                          </p>
                        </div>

                        {/* Rating */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary fill-primary" />
                          <span className="text-xl font-bold text-primary">
                            {item.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No hay items valorados en esta categoría
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}