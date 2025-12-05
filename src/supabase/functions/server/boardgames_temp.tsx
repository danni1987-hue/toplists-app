// Search board games - Using expanded curated database
app.get("/make-server-e2505fcb/search-boardgames", async (c) => {
  try {
    const query = c.req.query("query");
    
    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }
    
    console.log(`🎲 Searching board games for: ${query}`);
    
    // Expanded curated list of popular board games with real data
    const boardGamesDatabase = [
      { id: 1, title: "Catan", year: "1995", description: "Construye asentamientos, ciudades y caminos mientras comercias recursos", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400", rating: "7.2" },
      { id: 2, title: "Carcassonne", year: "2000", description: "Coloca losetas para construir ciudades, caminos y monasterios medievales", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "7.4" },
      { id: 3, title: "Ticket to Ride", year: "2004", description: "Conecta ciudades construyendo rutas de tren por todo el continente", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.4" },
      { id: 4, title: "Pandemic", year: "2008", description: "Trabaja en equipo para salvar a la humanidad de 4 enfermedades mortales", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "7.6" },
      { id: 5, title: "7 Wonders", year: "2010", description: "Desarrolla tu civilización antigua y construye tu maravilla arquitectónica", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "7.7" },
      { id: 6, title: "Azul", year: "2017", description: "Decora el palacio real con hermosos azulejos portugueses", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "7.8" },
      { id: 7, title: "Codenames", year: "2015", description: "Adivina las palabras clave de tu equipo antes que el rival", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.7" },
      { id: 8, title: "Splendor", year: "2014", description: "Comercia con gemas para construir un imperio mercantil renacentista", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400", rating: "7.4" },
      { id: 9, title: "Dominion", year: "2008", description: "Construye tu mazo de cartas para dominar el reino", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.6" },
      { id: 10, title: "Terraforming Mars", year: "2016", description: "Compite por terraformar Marte y hacerlo habitable", image: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=400", rating: "8.4" },
      { id: 11, title: "Dixit", year: "2008", description: "Usa tu imaginación para dar pistas sobre hermosas ilustraciones", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "7.3" },
      { id: 12, title: "Monopoly", year: "1935", description: "Compra propiedades, cobra alquileres y domina el tablero", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "4.4" },
      { id: 13, title: "Scrabble", year: "1948", description: "Forma palabras cruzadas para ganar el máximo de puntos", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "6.8" },
      { id: 14, title: "Risk", year: "1957", description: "Conquista el mundo con estrategia militar y diplomacia", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "6.5" },
      { id: 15, title: "Clue", year: "1949", description: "Resuelve el misterio del asesinato usando deducción", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "6.7" },
      { id: 16, title: "Wingspan", year: "2019", description: "Atrae las mejores aves a tu reserva natural", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400", rating: "8.1" },
      { id: 17, title: "Gloomhaven", year: "2017", description: "Aventura épica táctica con combate y desarrollo de personajes", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400", rating: "8.8" },
      { id: 18, title: "Exploding Kittens", year: "2015", description: "Juego de cartas ruso con gatitos explosivos", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "6.2" },
      { id: 19, title: "Uno", year: "1971", description: "Descarta todas tus cartas igualando colores o números", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "5.5" },
      { id: 20, title: "Cards Against Humanity", year: "2011", description: "Juego de humor negro para adultos sin escrúpulos", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "6.3" },
      { id: 21, title: "Agricola", year: "2007", description: "Gestiona tu granja medieval y alimenta a tu familia", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "7.9" },
      { id: 22, title: "Puerto Rico", year: "2002", description: "Desarrolla tu isla caribeña con plantaciones y edificios", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.9" },
      { id: 23, title: "Kingdomino", year: "2016", description: "Construye el mejor reino con fichas de dominó", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400", rating: "7.3" },
      { id: 24, title: "Brass Birmingham", year: "2018", description: "Desarrolla industrias en la revolución industrial inglesa", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400", rating: "8.6" },
      { id: 25, title: "Everdell", year: "2018", description: "Construye una ciudad de criaturas del bosque", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "8.0" },
      { id: 26, title: "Scythe", year: "2016", description: "Conquista territorios en una Europa alternativa de los años 20", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "8.2" },
      { id: 27, title: "Root", year: "2018", description: "Guerra asimétrica entre facciones de animales del bosque", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "8.1" },
      { id: 28, title: "Spirit Island", year: "2017", description: "Defiende tu isla de colonizadores como espíritus de la naturaleza", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "8.3" },
      { id: 29, title: "Cascadia", year: "2021", description: "Crea ecosistemas con animales y hábitats del noroeste", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.9" },
      { id: 30, title: "Ark Nova", year: "2021", description: "Diseña y gestiona un zoo moderno de conservación", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400", rating: "8.6" },
      { id: 31, title: "Dune Imperium", year: "2020", description: "Combina deckbuilding y control de áreas en el universo de Dune", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400", rating: "8.4" },
      { id: 32, title: "Lost Ruins of Arnak", year: "2020", description: "Explora ruinas antiguas combinando deckbuilding y worker placement", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "8.1" },
      { id: 33, title: "Stone Age", year: "2008", description: "Lleva a tu tribu desde la edad de piedra a la civilización", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "7.6" },
      { id: 34, title: "Sushi Go", year: "2013", description: "Drafting rápido de cartas de sushi japonés", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "7.0" },
      { id: 35, title: "Patchwork", year: "2014", description: "Juego de 2 jugadores sobre confección de edredones", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "7.7" },
      { id: 36, title: "Betrayal at House on the Hill", year: "2004", description: "Exploración de casa encantada con traición inesperada", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.0" },
      { id: 37, title: "Dead of Winter", year: "2014", description: "Sobrevive al apocalipsis zombi con posibles traidores", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400", rating: "7.6" },
      { id: 38, title: "The Castles of Burgundy", year: "2011", description: "Desarrolla tu principado medieval con dados y estrategia", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400", rating: "8.1" },
      { id: 39, title: "Clank!", year: "2016", description: "Deckbuilding de aventuras en mazmorras llenas de tesoros", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "7.7" },
      { id: 40, title: "Eclipse", year: "2011", description: "Civilización espacial con exploración, combate y tecnología", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "8.0" },
      { id: 41, title: "Blood Rage", year: "2015", description: "Vikingos luchando por la gloria antes del Ragnarök", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "7.9" },
      { id: 42, title: "Small World", year: "2009", description: "Conquista territorios con razas fantásticas en declive", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "7.2" },
      { id: 43, title: "Viticulture", year: "2013", description: "Gestiona tu viñedo y produce el mejor vino", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.9" },
      { id: 44, title: "Concordia", year: "2013", description: "Comercio y colonización en el Imperio Romano", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400", rating: "8.1" },
      { id: 45, title: "Great Western Trail", year: "2016", description: "Conduce ganado desde Texas hasta Kansas City", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400", rating: "8.2" },
      { id: 46, title: "Machi Koro", year: "2012", description: "Construye tu ciudad con dados y cartas", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400", rating: "6.9" },
      { id: 47, title: "King of Tokyo", year: "2011", description: "Monstruos gigantes luchan por el control de Tokio", image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400", rating: "7.2" },
      { id: 48, title: "Mysterium", year: "2015", description: "Cooperativo de deducción con un fantasma dando pistas", image: "https://images.unsplash.com/photo-1632501641765-e568d52ed9af?w=400", rating: "7.3" },
      { id: 49, title: "Catan Junior", year: "2007", description: "Versión infantil del clásico Catan con piratas", image: "https://images.unsplash.com/photo-1611891487697-3e67e25caeae?w=400", rating: "7.0" },
      { id: 50, title: "Quacks of Quedlinburg", year: "2018", description: "Push-your-luck creando pociones con ingredientes arriesgados", image: "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400", rating: "7.8" },
    ];
    
    // Filter games by query (case insensitive)
    const searchTerm = query.toLowerCase();
    const results = boardGamesDatabase
      .filter(game => game.title.toLowerCase().includes(searchTerm))
      .slice(0, 10);
    
    console.log(`✅ Found ${results.length} matching board games`);
    
    return c.json({ results });
  } catch (error) {
    console.error("❌ Error in search-boardgames endpoint:", error);
    return c.json({ error: "Internal server error while searching board games" }, 500);
  }
});
