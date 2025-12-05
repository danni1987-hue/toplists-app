import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { LogoWithText } from "./Logo";
import { Crown, Star, TrendingUp, Users, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import '../styles/globals.css' ;

interface LandingBannerProps {
  onGetStarted: () => void;
}

export function LandingBanner({ onGetStarted }: LandingBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const slides = [
    {
      title: "Crea y Comparte tus Listas Top",
      description: "Películas, música, comida, viajes... Comparte tus favoritos con la comunidad",
      image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      icon: Crown,
    },
    {
      title: "Descubre Nuevas Recomendaciones",
      description: "Explora las listas top de otros usuarios y encuentra inspiración",
      image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      icon: TrendingUp,
    },
    {
      title: "Califica y Comenta",
      description: "Dale like a tus listas favoritas y únete a la conversación",
      image: "https://images.unsplash.com/photo-1618175349544-71ca933f4979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      icon: Star,
    },
    {
      title: "Únete a la Comunidad",
      description: "Miles de usuarios compartiendo sus gustos y descubriendo contenido nuevo",
      image: "https://images.unsplash.com/photo-1762330467151-7f009206db90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      icon: Users,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    };

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [slides.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-cyan-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <LogoWithText iconClassName="h-8 w-8" />
            <Button onClick={onGetStarted} size="lg">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-teal-500/10 border border-violet-200 dark:border-violet-800">
                {(() => {
                  const Icon = slides[currentSlide].icon;
                  return Icon ? <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" /> : null;
                })()}
                <span className="text-sm text-violet-700 dark:text-violet-300">
                  {slides[currentSlide].title}
                </span>
              </div>

              <h1 className="text-4xl lg:text-6xl">
                <span className="bg-gradient-to-r from-violet-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  {slides[currentSlide].title}
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300">
                {slides[currentSlide].description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={onGetStarted} size="lg" className="text-lg px-8">
                  Comenzar Ahora
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8"
                  onClick={() => {
                    const element = document.getElementById("features");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Ver más
                </Button>
              </div>

              {/* Slide Indicators */}
              <div className="flex gap-2 pt-4">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? "w-8 bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500"
                        : "w-2 bg-gray-300 dark:bg-gray-700"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right Side - Image */}
            <motion.div
              key={`image-${currentSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="w-full h-[400px] lg:h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              
              {/* Floating decoration */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-teal-500 via-cyan-500 to-violet-500 rounded-full blur-3xl"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-violet-600 via-cyan-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl lg:text-5xl mb-2">10K+</div>
              <div className="text-white/80">Listas Creadas</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl lg:text-5xl mb-2">5K+</div>
              <div className="text-white/80">Usuarios Activos</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl lg:text-5xl mb-2">50K+</div>
              <div className="text-white/80">Me Gusta</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl lg:text-5xl mb-2">20K+</div>
              <div className="text-white/80">Comentarios</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white dark:bg-gray-950 py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl mb-4">
              <span className="bg-gradient-to-r from-violet-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                Todo lo que necesitas
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              La plataforma perfecta para crear, compartir y descubrir listas top
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Crown,
                title: "Listas Personalizadas",
                description: "Crea listas únicas con calificaciones y descripciones",
              },
              {
                icon: Star,
                title: "Sistema de Rating",
                description: "Califica cada item del 1 al 10 con estrellas doradas",
              },
              {
                icon: TrendingUp,
                title: "Categorías Variadas",
                description: "Películas, música, comida, viajes y más",
              },
              {
                icon: Users,
                title: "Red Social",
                description: "Interactúa con otros usuarios y descubre contenido",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 flex items-center justify-center mb-4">
                  {(() => {
                    const Icon = feature.icon;
                    return <Icon className="h-6 w-6 text-white" />;
                  })()}
                </div>
                <h3 className="mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button onClick={onGetStarted} size="lg" className="text-lg px-12">
              Crear mi Cuenta Gratis
            </Button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Sin tarjeta de crédito • Gratis para siempre • Comienza en segundos
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 TopLists. Comparte tus favoritos con el mundo.</p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 hover:shadow-xl transition-shadow"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
