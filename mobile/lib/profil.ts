import { apiFetch } from "./api";

/** Pseudo du compte connecté — seul champ dont ce premier incrément a
 * besoin (identité pour retrouver "mes matchs", cf. tournoi/[id]/moi.tsx).
 * GET /api/profil renvoie `data: null` si le profil n'a jamais été
 * synchronisé (ne devrait pas arriver pour un compte réel qui s'est déjà
 * inscrit à un tournoi). */
export async function monPseudo(): Promise<string | undefined> {
  const resultat = await apiFetch<{ pseudo: string } | null>("/api/profil");
  return resultat.success ? resultat.data?.pseudo : undefined;
}
