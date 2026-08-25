import { supabase } from "./supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

/** Même contrat que le fetch web (src/app/api/**, réponses {success, data?,
 * error?}) — seule différence : le token de session est joint explicitement
 * en header Bearer (pas de cookies côté natif), lu depuis la session
 * Supabase en cours. Cf. src/lib/server/tournois.ts pour le pendant serveur. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const reponse = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers,
    },
  });

  const json = await reponse.json().catch(() => null);
  if (!json) return { success: false, error: "Réponse invalide du serveur." };
  return json;
}
