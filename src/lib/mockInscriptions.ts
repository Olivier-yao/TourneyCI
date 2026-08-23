/** Inscriptions — migré vers /api/inscriptions et /api/tournois/[id]/inscriptions
 * (table Postgres `inscriptions`), même pattern que mockTournaments.ts :
 * fonctions async, mêmes noms/signatures qu'avant. */

export type Inscription = { tournoiId: string; equipe?: string; tag?: string };

/** Cache mémoire de toutes les inscriptions du compte connecté — rechargé à
 * chaque appel de mesInscriptions() (pas de invalidation cross-onglet à
 * gérer ici, contrairement au profil : ces écrans se rafraîchissent déjà à
 * chaque montage). */
let cache: Inscription[] | null = null;

export async function mesInscriptions(): Promise<Inscription[]> {
  const reponse = await fetch("/api/inscriptions");
  const json = await reponse.json().catch(() => null);
  cache = json?.success ? (json.data as Inscription[]) : [];
  return cache;
}

export async function estInscrit(tournoiId: string): Promise<boolean> {
  return (await inscriptionDe(tournoiId)) !== undefined;
}

export async function inscriptionDe(tournoiId: string): Promise<Inscription | undefined> {
  const liste = cache ?? (await mesInscriptions());
  return liste.find((i) => i.tournoiId === tournoiId);
}

export type ResultatInscription = { ok: boolean; erreur?: string };

export async function enregistrerInscription(tournoiId: string, tag?: string, equipe?: string, montant?: number): Promise<ResultatInscription> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/inscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag, equipe, montant }),
  });
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  cache = [...(cache ?? []).filter((i) => i.tournoiId !== tournoiId), { tournoiId, tag, equipe }];
  return { ok: true };
}

/** Renomme l'équipe de l'inscription courante (capitaine uniquement, avant le
 * début du tournoi — le verrouillage post-démarrage est géré par l'appelant). */
export async function renommerEquipe(tournoiId: string, nouveauNom: string): Promise<ResultatInscription> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/inscriptions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipe: nouveauNom }),
  });
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  cache = (cache ?? []).map((i) => (i.tournoiId === tournoiId ? { ...i, equipe: nouveauNom } : i));
  return { ok: true };
}
