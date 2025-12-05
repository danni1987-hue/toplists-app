import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Obtener usuario inicial de forma asíncrona con Supabase v2
    supabase.auth.getUser().then(result => {
      setUser(result.data?.user ?? null);
    });

    // Escuchar los cambios de sesión
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      //subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, signIn, signOut };
}
