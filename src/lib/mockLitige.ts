/**
 * Litiges sur un match (points A1-A3 du design v3) : signalement structuré
 * (motif + preuve) distinct de la simple contestation de résultat final
 * (mockAppel.ts, point 25).
 *
 * Réel côté serveur (table `litiges`, déjà présente en base mais jamais
 * exploitée — cf. src/lib/server/litiges.ts) — remplace l'ancien stockage
 * localStorage, qui ne pouvait pas rester "un registre partagé, visible des
 * deux côtés" comme l'exige ce flux (l'organisateur doit voir le litige
 * déposé par le joueur, sur un tout autre appareil).
 */

export type StatutLitige = "en_attente" | "resolu_faveur" | "rejete";

export type Litige = {
  id: string;
  matchId: string;
  tournoiId: string;
  tournoiTitre: string;
  adversaire: string;
  arbitre: string;
  motifId: string;
  motifLabel: string;
  description: string;
  preuves: string[];
  statut: StatutLitige;
  horodatage: number;
};

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function mesLitiges(): Promise<Litige[]> {
  const reponse = await fetch("/api/mes-litiges");
  const resultat = await reponseJson<Litige[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function litigeDuMatch(matchId: string): Promise<Litige | undefined> {
  const reponse = await fetch(`/api/matches/${matchId}/litige`);
  const resultat = await reponseJson<Litige | null>(reponse);
  return resultat.ok && resultat.data ? resultat.data : undefined;
}

export async function creerLitige(donnees: { matchId: string; motifId: string; description: string; preuves: string[] }): Promise<Litige | null> {
  const reponse = await fetch(`/api/matches/${donnees.matchId}/litige`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donnees),
  });
  const resultat = await reponseJson<Litige>(reponse);
  return resultat.ok ? resultat.data : null;
}

export async function ajouterPreuveLitige(matchId: string, nomFichier: string): Promise<Litige | null> {
  const reponse = await fetch(`/api/matches/${matchId}/litige`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "preuve", nomFichier }),
  });
  const resultat = await reponseJson<Litige>(reponse);
  return resultat.ok ? resultat.data : null;
}

/** Tranche un litige côté organisateur : "resolu_faveur" donne raison au
 * joueur qui a signalé, "rejete" maintient le score déjà enregistré. */
export async function resoudreLitige(matchId: string, statut: "resolu_faveur" | "rejete"): Promise<Litige | null> {
  const reponse = await fetch(`/api/matches/${matchId}/litige`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "resoudre", statut }),
  });
  const resultat = await reponseJson<Litige>(reponse);
  return resultat.ok ? resultat.data : null;
}

/** Nombre de litiges en attente pour un tournoi (jauge de clôture organisateur). */
export async function nbLitigesOuvertsTournoi(tournoiId: string): Promise<number> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/litiges`);
  const resultat = await reponseJson<{ ouverts: number }>(reponse);
  return resultat.ok ? resultat.data.ouverts : 0;
}
