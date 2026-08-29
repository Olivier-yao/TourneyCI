import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type ResultatAuth = { ok: true } | { ok: false; erreur: string };

type AuthCtx = {
  session: Session | null;
  pret: boolean;
  connexion: (email: string, motDePasse: string) => Promise<ResultatAuth>;
  inscription: (email: string, motDePasse: string) => Promise<ResultatAuth>;
  connexionGoogle: () => Promise<ResultatAuth>;
  deconnexion: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

/** Même flux que le web (signInWithPassword/signUp/signInWithOAuth, cf.
 * src/app/verify/page.tsx) — la session persiste via AsyncStorage
 * (lib/supabase.ts), onAuthStateChange tient ce contexte à jour partout.
 * Google : pas de redirection navigateur possible en natif, on ouvre le
 * flux OAuth dans un onglet système (expo-web-browser) et on intercepte le
 * retour vers le scheme `tourney://` (cf. app.json) au lieu de la route
 * /auth/callback du web — même échange de code que côté serveur
 * (exchangeCodeForSession), fait ici côté client puisqu'un client natif n'a
 * pas de route serveur pour l'intercepter. */
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

  async function connexionGoogle(): Promise<ResultatAuth> {
    const redirectTo = Linking.createURL("/");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    });
    if (error) return { ok: false, erreur: error.message };

    const resultat = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (resultat.type !== "success") return { ok: false, erreur: "" };

    const { queryParams } = Linking.parse(resultat.url);
    const code = queryParams?.code;
    if (queryParams?.error || !code) return { ok: false, erreur: "La connexion Google a échoué." };

    const { error: erreurEchange } = await supabase.auth.exchangeCodeForSession(String(code));
    if (erreurEchange) return { ok: false, erreur: erreurEchange.message };
    return { ok: true };
  }

  async function deconnexion() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{ session, pret, connexion, inscription, connexionGoogle, deconnexion }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth doit être utilisé sous AuthProvider.");
  return ctx;
}
