/**
 * Appels des résultats d'un tournoi — table `appels` (Postgres), même
 * pattern que les migrations précédentes. Un inscrit peut contester le
 * classement final ; le cash prize est déjà versé au moment de la clôture
 * (cf. verserCashPrizeCloture, src/lib/server/cloture.ts) et n'est plus
 * retenu par un appel en cours — un administrateur tranche l'appel a
 * posteriori depuis /admin/moderation.
 */

export type StatutAppel = "ouvert" | "valide" | "rejete";

export type Appel = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  auteur: string;
  motif: string;
  statut: StatutAppel;
  horodatage: number;
};

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

type AppelTournoiApiJSON = { ouvert: boolean; mon: Appel | null };

async function chargerAppelTournoi(tournoiId: string): Promise<AppelTournoiApiJSON> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/appel`);
  const resultat = await reponseJson<AppelTournoiApiJSON>(reponse);
  return resultat.ok ? resultat.data : { ouvert: false, mon: null };
}

export async function monAppelPourTournoi(tournoiId: string): Promise<Appel | undefined> {
  return (await chargerAppelTournoi(tournoiId)).mon ?? undefined;
}

/** Vrai si un appel (de n'importe quel auteur) est actuellement ouvert sur ce
 * tournoi — bloque le déblocage automatique du séquestre. */
export async function appelOuvertPourTournoi(tournoiId: string): Promise<boolean> {
  return (await chargerAppelTournoi(tournoiId)).ouvert;
}

export async function creerAppel(tournoiId: string, motif: string): Promise<void> {
  if (!motif.trim()) return;
  await fetch(`/api/tournois/${tournoiId}/appel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motif }),
  });
}

/** Liste globale des appels ouverts, tous tournois confondus — écran d'admin. */
export async function tousLesAppelsOuverts(): Promise<Appel[]> {
  const reponse = await fetch("/api/appels/ouverts");
  const resultat = await reponseJson<Appel[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function traiterAppel(appelId: string, statut: "valide" | "rejete"): Promise<void> {
  await fetch(`/api/appels/${appelId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });
}
