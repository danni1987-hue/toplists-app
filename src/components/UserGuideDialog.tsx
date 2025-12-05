import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  Home,
  List,
  Star,
  Radar,
  TrendingUp,
  Trophy,
  Plus,
  Lock,
  Users,
  Heart,
  MessageCircle,
  Crown,
  Search,
  Settings,
} from "lucide-react";

interface UserGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserGuideDialog({ open, onOpenChange }: UserGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Guía del Usuario - TopLists</DialogTitle>
          <DialogDescription>
            Aprende a usar todas las funcionalidades de TopLists
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="inicio" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inicio">Inicio</TabsTrigger>
            <TabsTrigger value="listas">Listas</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="avanzado">Avanzado</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] w-full pr-4">
            {/* Tab: Inicio */}
            <TabsContent value="inicio" className="space-y-6 mt-4">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-violet-500" />
                  Bienvenido a TopLists
                </h3>
                <p className="text-sm text-muted-foreground">
                  TopLists es una aplicación moderna para crear y compartir listas top de
                  tus contenidos favoritos: películas, series, música, libros, videojuegos
                  y más. Funciona como una red social donde puedes seguir a otros usuarios,
                  dar likes, comentar y descubrir nuevas recomendaciones.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <List className="h-4 w-4 text-cyan-500" />
                  Navegación Principal
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Home className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Inicio:</strong> Feed principal con listas de usuarios que sigues
                      y listas públicas. Filtra por categorías usando las pestañas superiores.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <List className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Mis Listas:</strong> Todas tus listas creadas. Edita, elimina
                      o cambia la privacidad de cada una.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Favoritos:</strong> Listas que has marcado como favoritas
                      para acceder rápidamente.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Radar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Radar:</strong> Descubre listas de usuarios que sigues,
                      organizadas por categoría.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Tendencias:</strong> Las listas más populares con más likes.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Top Rankings:</strong> Rankings globales por categoría.
                    </div>
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Tab: Listas */}
            <TabsContent value="listas" className="space-y-6 mt-4">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-violet-500" />
                  Crear una Lista
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Haz clic en el botón <strong>"+ Nueva Lista"</strong> (arriba a la derecha)</li>
                  <li>Selecciona una categoría: Películas, Series, Música, Libros, Videojuegos, etc.</li>
                  <li>Escribe un título descriptivo para tu lista</li>
                  <li>Añade una descripción opcional</li>
                  <li>Selecciona la privacidad (pública o privada)</li>
                  <li>Busca y añade items usando la barra de búsqueda</li>
                  <li>Cada item se añade automáticamente a tu lista</li>
                  <li>Haz clic en <strong>"Publicar Lista"</strong> cuando termines</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Sistema de Puntuación
                </h4>
                <p className="text-sm text-muted-foreground">
                  Al añadir items a tus listas, puedes asignarles una puntuación del 1 al 10
                  representada con coronas doradas. Opcionalmente, puedes puntuar por criterios
                  específicos según la categoría:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Películas/Series:</strong> Trama, Actuaciones, Dirección, Fotografía, Banda Sonora</li>
                  <li>• <strong>Música:</strong> Composición, Producción, Letras, Originalidad, Impacto</li>
                  <li>• <strong>Libros:</strong> Trama, Personajes, Estilo, Originalidad, Impacto</li>
                  <li>• <strong>Videojuegos:</strong> Jugabilidad, Gráficos, Historia, Sonido, Rejugabilidad</li>
                  <li>• <strong>Viajes:</strong> Paisajes, Cultura, Gastronomía, Actividades, Relación calidad-precio</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  Privacidad de Listas
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Listas Públicas:</strong> Visibles para todos los usuarios
                  </li>
                  <li>
                    <strong>Listas Privadas:</strong> Solo visibles para ti y usuarios que
                    te siguen (con solicitud aceptada)
                  </li>
                  <li>
                    Puedes cambiar la privacidad en cualquier momento desde "Mis Listas"
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-cyan-500" />
                  Búsqueda de Contenido
                </h4>
                <p className="text-sm text-muted-foreground">
                  Al crear una lista, la búsqueda se integra con APIs especializadas:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Películas/Series:</strong> The Movie Database (TMDb)</li>
                  <li>• <strong>Música:</strong> TheAudioDB</li>
                  <li>• <strong>Videojuegos:</strong> RAWG</li>
                  <li>• <strong>Otros:</strong> Añade items manualmente con título y descripción</li>
                </ul>
              </div>
            </TabsContent>

            {/* Tab: Social */}
            <TabsContent value="social" className="space-y-6 mt-4">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" />
                  Sistema de Seguimiento
                </h3>
                <p className="text-sm text-muted-foreground">
                  TopLists tiene un sistema de seguimiento con solicitudes:
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Encuentra usuarios en la barra lateral derecha o busca sus perfiles</li>
                  <li>Haz clic en <strong>"Seguir"</strong> para enviar una solicitud</li>
                  <li>El usuario recibirá tu solicitud (aparece en su perfil)</li>
                  <li>Si acepta, podrás ver sus listas privadas</li>
                  <li>Puedes gestionar solicitudes desde el menú de usuario</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Likes y Favoritos
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Dar Like:</strong> Haz clic en el icono de corazón en cualquier
                    lista para darle un like. Los likes aumentan la popularidad en Tendencias.
                  </li>
                  <li>
                    <strong>Añadir a Favoritos:</strong> Haz clic en la estrella para guardar
                    listas en tu sección de Favoritos para acceso rápido.
                  </li>
                  <li>
                    Las listas con más likes aparecen en la sección <strong>Tendencias</strong>.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Comentarios
                </h4>
                <p className="text-sm text-muted-foreground">
                  Haz clic en el icono de comentario en cualquier lista para abrir el detalle
                  y dejar tu opinión. Los comentarios fomentan la conversación y
                  recomendaciones entre usuarios.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Radar className="h-4 w-4 text-cyan-500" />
                  Radar de Usuarios
                </h4>
                <p className="text-sm text-muted-foreground">
                  El <strong>Radar</strong> es tu feed personalizado que muestra listas
                  de usuarios que sigues, organizadas por categorías. Es perfecta para
                  descubrir contenido nuevo de personas con gustos similares.
                </p>
              </div>
            </TabsContent>

            {/* Tab: Avanzado */}
            <TabsContent value="avanzado" className="space-y-6 mt-4">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-500" />
                  Perfil y Configuración
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Editar Perfil:</strong> Haz clic en tu avatar (esquina superior
                    derecha) y selecciona "Configuración" para cambiar tu nombre, username o avatar.
                  </li>
                  <li>
                    <strong>Gestionar Solicitudes:</strong> Acepta o rechaza solicitudes de
                    seguimiento desde el menú de usuario.
                  </li>
                  <li>
                    <strong>Ver tu Perfil:</strong> Accede a tu perfil para ver estadísticas:
                    seguidores, seguidos, total de listas y tus listas destacadas.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Top Rankings
                </h4>
                <p className="text-sm text-muted-foreground">
                  La sección <strong>Top Rankings</strong> muestra rankings globales de
                  contenido basados en las puntuaciones que los usuarios dan en sus listas.
                  Cada categoría tiene su propio ranking con los items mejor valorados.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Algoritmo de Tendencias
                </h4>
                <p className="text-sm text-muted-foreground">
                  Las <strong>Tendencias</strong> se calculan según el número de likes que
                  recibe cada lista. Las listas más populares aparecen primero. El ranking
                  se actualiza en tiempo real.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-violet-500" />
                  Búsqueda Global
                </h4>
                <p className="text-sm text-muted-foreground">
                  Usa la barra de búsqueda superior para encontrar listas por título o
                  descripción. La búsqueda funciona en tiempo real y busca en todas las
                  listas públicas y las privadas a las que tienes acceso.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  Seguridad y Privacidad
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    • Tu contraseña está encriptada y protegida por Supabase Auth
                  </li>
                  <li>
                    • Puedes recuperar tu contraseña desde el login con "¿Olvidaste tu contraseña?"
                  </li>
                  <li>
                    • Las listas privadas solo son visibles para seguidores autorizados
                  </li>
                  <li>
                    • Puedes eliminar tu cuenta contactando con soporte
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4>Consejos y Trucos</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    ✨ <strong>Usa puntuaciones detalladas</strong> para dar feedback más completo
                  </li>
                  <li>
                    🎯 <strong>Sigue usuarios con gustos similares</strong> para descubrir contenido nuevo
                  </li>
                  <li>
                    📱 <strong>La app es responsive</strong> - úsala desde móvil o tablet
                  </li>
                  <li>
                    🔔 <strong>Revisa Radar regularmente</strong> para estar al día con tus seguidos
                  </li>
                  <li>
                    💫 <strong>Añade descripciones</strong> a tus listas para dar contexto
                  </li>
                </ul>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
