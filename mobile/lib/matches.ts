import { apiFetch } from "./api";

/** Port de src/lib/mockBracket.ts (types + fonctions pures) et
 * src/lib/server/matches.ts (contrat JSON) — bracket 1v1/équipes
 * uniquement (Battle Royale a son propre système de manches/points,
 * hors scope ici). */
export type MatchTournoi = {
  id: string;
  tournoiId: string;
  round: number;
  position: number;
  joueur1: string | null;
  joueur2: string | null;
  joueur1PhotoUrl?: string;
  joueur2PhotoUrl?: string;
  score1: number | null;
  score2: number | null;
  statut: "a_venir" | "en_cours" | "termine";
  termineLe?: number;
};

export type EvenementMatch = { id: string; texte: string; creeLe: number };

export async function matchsDuTournoi(tournoiId: string): Promise<MatchTournoi[]> {
  const resultat = await apiFetch<MatchTournoi[]>(`/api/tournois/${tournoiId}/matches`);
  return resultat.success ? resultat.data : [];
}

export async function matchParId(id: string): Promise<MatchTournoi | undefined> {
  const resultat = await apiFetch<MatchTournoi>(`/api/matches/${id}`);
  return resultat.success ? resultat.data : undefined;
}

export async function evenementsDuMatch(matchId: string): Promise<EvenementMatch[]> {
  const resultat = await apiFetch<EvenementMatch[]>(`/api/matches/${matchId}/evenements`);
  return resultat.success ? resultat.data : [];
}

export function libelleRound(round: number, totalRounds: number): string {
  const distanceFinale = totalRounds - round;
  if (distanceFinale === 0) return "Finale";
  if (distanceFinale === 1) return "Demi-finale";
  if (distanceFinale === 2) return "Quart de finale";
  return `Round ${round}`;
}

export type ResultatAction = { ok: boolean; erreur?: string; match?: MatchTournoi };

async function patchMatch(matchId: string, body: Record<string, unknown>): Promise<ResultatAction> {
  const resultat = await apiFetch<MatchTournoi>(`/api/matches/${matchId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!resultat.success) return { ok: false, erreur: resultat.error };
  return { ok: true, match: resultat.data };
}

/** Organisateur/adjoint uniquement — lance ce match (statut a_venir ->
 * en_cours), en repassant tout autre match en_cours du tournoi à a_venir
 * côté web (même règle : un seul match en direct à la fois). */
export function demarrerMatch(matchId: string): Promise<ResultatAction> {
  return patchMatch(matchId, { action: "demarrer" });
}

/** Organisateur/adjoint uniquement — met à jour le score affiché sans
 * clôturer le match. */
export function validerScoreDirect(matchId: string, score1: number, score2: number): Promise<ResultatAction> {
  return patchMatch(matchId, { action: "score_direct", score1, score2 });
}

/** Organisateur/adjoint OU l'un des deux joueurs — clôture le match,
 * qualifie le vainqueur pour le tour suivant. Refusé (400) si le score ne
 * reflète pas une majorité valide pour le format BO du tournoi. */
export function cloturerMatch(matchId: string, score1: number, score2: number): Promise<ResultatAction> {
  return patchMatch(matchId, { action: "score_final", score1, score2 });
}
