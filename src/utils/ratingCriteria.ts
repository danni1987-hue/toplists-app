// Rating criteria for each category
export const ratingCriteria: Record<string, string[]> = {
  "Películas": ["Interpretación", "Guion", "Producción", "Originalidad", "Música"],
  "Series": ["Interpretación", "Guion", "Producción", "Originalidad", "Música"],
  "Música": ["Composición", "Letra", "Producción", "Originalidad", "Impacto Emocional"],
  "Comida": ["Sabor", "Presentación", "Calidad Ingredientes", "Servicio", "Relación Calidad-Precio"],
  "Viajes": ["Belleza/Paisajes", "Cultura/Historia", "Gastronomía", "Actividades", "Accesibilidad"],
  "Libros": ["Narrativa", "Personajes", "Trama", "Originalidad", "Impacto"],
  "Deportes": ["Habilidad Técnica", "Espectacularidad", "Impacto en el Deporte", "Legado", "Consistencia"],
  "Juegos": ["Jugabilidad", "Gráficos", "Historia", "Originalidad", "Rejugabilidad"],
  "Juegos de mesa": ["Mecánicas", "Estrategia", "Diversión", "Rejugabilidad", "Componentes"],
  "Escape room": ["Enigmas", "Ambientación", "Dificultad", "Originalidad", "Inmersión"],
  "Videojuegos": ["Jugabilidad", "Gráficos", "Historia", "Originalidad", "Rejugabilidad"],
};

// Get criteria keys for JSON storage (lowercase, no spaces)
export const getCriteriaKey = (criteriaName: string): string => {
  return criteriaName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\//g, "_") // Replace / with _
    .replace(/\s+/g, "_"); // Replace spaces with _
};

// Calculate average rating from ratings object
export const calculateAverageRating = (ratings: Record<string, number>): number => {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  // Multiply by 2 to get base 10 score
  return Math.round(average * 2 * 10) / 10; // Round to 1 decimal
};

// Get default ratings object for a category
export const getDefaultRatings = (category: string): Record<string, number> => {
  const criteria = ratingCriteria[category] || [];
  const ratings: Record<string, number> = {};
  criteria.forEach((criterion) => {
    ratings[getCriteriaKey(criterion)] = 0;
  });
  return ratings;
};

// Format ratings for display
export const formatRatingForDisplay = (key: string, criteria: string[]): string => {
  const match = criteria.find(c => getCriteriaKey(c) === key);
  return match || key;
};