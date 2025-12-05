import {
  Film,
  Music,
  Utensils,
  Plane,
  Tv,
  BookOpen,
  Gamepad2,
  Dumbbell,
  Palette,
  FlaskConical,
  List,
  Dice5,
  DoorOpen,
} from "lucide-react";

// Icon mapping for categories
export const categoryIconMap: Record<string, any> = {
  "Películas": Film,
  "películas": Film,
  "Música": Music,
  "música": Music,
  "Comida": Utensils,
  "comida": Utensils,
  "Viajes": Plane,
  "viajes": Plane,
  "Series": Tv,
  "series": Tv,
  "Libros": BookOpen,
  "libros": BookOpen,
  "Videojuegos": Gamepad2,
  "videojuegos": Gamepad2,
  "Deportes": Dumbbell,
  "deportes": Dumbbell,
  "Arte": Palette,
  "arte": Palette,
  "Tecnología": FlaskConical,
  "tecnología": FlaskConical,
  "Juegos de mesa": Dice5,
  "juegos de mesa": Dice5,
  "Escape room": DoorOpen,
  "escape room": DoorOpen,
};

// Helper function to get icon for category
export const getCategoryIcon = (categoryName: string) => {
  return categoryIconMap[categoryName] || List;
};