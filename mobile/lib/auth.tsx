import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthCtx = {
  session: Session | null;
  pret: boolean;
  connexion: (email: string, motDePasse: string) => Promise<{ ok: true } | { ok: false; erreur: string }>;
  inscription: (email: string, motDePasse: string) => Promise<{ ok: true } | { ok: false; erreur: string }>;
  deconnexion: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

/** Même flux que le web (signInWithPassword/signUp, cf. src/app/(auth)) —
 * seule l'authentification Google est hors scope pour cet incrément
 * (deep-linking natif à part). La session persiste via AsyncStorage
 * (lib/supabase.ts), onAuthStateChange tient ce contexte à jour partout. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPret(true);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      setSession(nouvelleSession);
    });
    return () => abonnement.subscription.unsubscribe();
  }, []);

  async function connexion(email: string, motDePasse: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) return { ok: false as const, erreur: error.message };
    return { ok: true as const };
  }

  async function inscription(email: string, motDePasse: string) {
    const { error } = await supabase.auth.signUp({ email, password: motDePasse });
    if (error) return { ok: false as const, erreur: error.message };
    return { ok: true as const };
  }

  async function deconnexion() {
    await supabase.auth.signOut();
  }

  return <Ctx.Provider value={{ session, pret, connexion, inscription, deconnexion }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth doit être utilisé sous AuthProvider.");
  return ctx;
}
