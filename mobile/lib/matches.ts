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
