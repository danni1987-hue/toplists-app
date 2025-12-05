import { useState, useEffect } from "react";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { api } from "../utils/api";
import { Globe, Lock, User, Bell, Shield, Eye } from "lucide-react";

interface SettingsViewProps {
  currentUser: {
    username: string;
    name: string;
    avatar: string;
    userId?: string;
  };
  accessToken: string;
  onSettingsUpdate?: (settings: any) => void;
}

export function SettingsView({ currentUser, accessToken, onSettingsUpdate }: SettingsViewProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { profile } = await api.getProfile(accessToken);
      setIsPublic(profile.is_public !== false); // Default to true if not set
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error al cargar configuración");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await api.updateSettings({ is_public: isPublic }, accessToken);
      toast.success("Configuración guardada exitosamente");
      if (onSettingsUpdate) {
        onSettingsUpdate({ is_public: isPublic });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la privacidad y preferencias de tu cuenta
        </p>
      </div>

      {/* Privacy Settings Card */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5" />
              Privacidad
            </h2>
            <p className="text-sm text-muted-foreground">
              Controla quién puede ver tus listas
            </p>
          </div>

          <Separator />

          {/* Public/Private Toggle */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-orange-500" />
                  )}
                  <h3 className="text-sm">
                    {isPublic ? "Perfil Público" : "Perfil Privado"}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Todas tus listas son visibles para todos los usuarios"
                    : "Solo tus seguidores pueden ver tus listas"}
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                aria-label="Toggle privacy"
              />
            </div>

            {/* Visual explanation */}
            <div className={`p-4 rounded-lg border ${isPublic ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
              <div className="flex items-start gap-3">
                <Eye className={`h-5 w-5 mt-0.5 ${isPublic ? 'text-green-500' : 'text-orange-500'}`} />
                <div className="space-y-2">
                  <p className="text-sm">
                    {isPublic ? (
                      <>
                        <span className="font-medium">Modo Público:</span> Cualquier persona puede ver tus listas en tendencias, búsquedas y tu perfil.
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Modo Privado:</span> Solo las personas que te siguen pueden ver tus listas. Tu perfil será visible pero tus listas estarán ocultas para el resto.
                      </>
                    )}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    {isPublic ? (
                      <>
                        <li>• Apareces en "Tendencias"</li>
                        <li>• Tus listas aparecen en búsquedas</li>
                        <li>• Mayor visibilidad y alcance</li>
                      </>
                    ) : (
                      <>
                        <li>• No apareces en "Tendencias"</li>
                        <li>• Tus listas no aparecen en búsquedas públicas</li>
                        <li>• Mayor privacidad</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Info Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 mb-1">
              <User className="h-5 w-5" />
              Información de la Cuenta
            </h2>
            <p className="text-sm text-muted-foreground">
              Detalles de tu cuenta
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Coming Soon Card */}
      <Card className="p-6 bg-muted/30">
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 mb-1">
              <Bell className="h-5 w-5" />
              Próximamente
            </h2>
            <p className="text-sm text-muted-foreground">
              Funcionalidades que llegarán pronto
            </p>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Notificaciones por email</p>
            <p>• Tema claro/oscuro</p>
            <p>• Exportar listas</p>
            <p>• Estadísticas de actividad</p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
