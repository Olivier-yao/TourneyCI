/**
 * Favoris — table `favoris` (Postgres via /api/favoris), même pattern que
 * les migrations précédentes (fonctions async, mêmes noms/signatures que la
 * version localStorage).
 */

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function mesFavoris(): Promise<string[]> {
  const reponse = await fetch("/api/favoris");
  const resultat = await reponseJson<string[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function estFavori(tournoiId: string): Promise<boolean> {
  return (await mesFavoris()).includes(tournoiId);
}

export async function basculerFavori(tournoiId: string): Promise<boolean> {
  const reponse = await fetch(`/api/favoris/${tournoiId}`, { method: "POST" });
  const resultat = await reponseJson<{ estFavori: boolean }>(reponse);
  return resultat.ok ? resultat.data.estFavori : false;
}
