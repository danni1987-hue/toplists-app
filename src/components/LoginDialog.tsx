import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { getSupabaseClient } from "../utils/supabase/client";
import { api } from "../utils/api";
import { toast } from "sonner";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (userData: {
    name: string;
    username: string;
    avatar: string;
    userId: string;
  }, accessToken: string) => void;
}

export function LoginDialog({ open, onOpenChange, onLogin }: LoginDialogProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }

      if (!data.session) {
        throw new Error("No session returned");
      }

      console.log("Login successful, access token:", data.session.access_token.substring(0, 20) + "...");

      // Get user profile from backend
      try {
        const { profile } = await api.getProfile(data.session.access_token);
        console.log("Profile fetched:", profile);

        onLogin(
          {
            name: profile.name,
            username: profile.username,
            avatar: profile.avatar,
            userId: profile.id,
          },
          data.session.access_token
        );

        toast.success("¡Inicio de sesión exitoso!");
        onOpenChange(false);
        setLoginEmail("");
        setLoginPassword("");
      } catch (profileError: any) {
        console.error("Error fetching profile:", profileError);
        toast.error("Error al obtener el perfil: " + profileError.message);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user via backend
      const { user } = await api.signup(registerEmail, registerPassword, registerName, registerUsername);

      // Now log in
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: registerEmail,
        password: registerPassword,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("No session returned after signup");
      }

      onLogin(
        {
          name: registerName,
          username: registerUsername,
          avatar: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=100",
          userId: user.id,
        },
        data.session.access_token
      );

      toast.success(`¡Bienvenido/a a TopLists, ${registerName}!`);
      onOpenChange(false);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterUsername("");
      setRegisterPassword("");
    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        console.error("Supabase reset password error:", error);
        throw error;
      }

      toast.success("¡Se ha enviado un correo para restablecer tu contraseña!");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Error al enviar el correo de restablecimiento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showForgotPassword} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bienvenido a TopLists</DialogTitle>
            <DialogDescription>
              Inicia sesión o crea una cuenta para comenzar a crear tus listas
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(true)}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nombre Completo</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Tu nombre"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Nombre de Usuario</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="@usuario"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="tu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar correo de recuperación"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Volver
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
