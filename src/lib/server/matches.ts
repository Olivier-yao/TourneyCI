import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Adapte une ligne Prisma `matches` (snake_case) vers le type `MatchTournoi`
 * (camelCase) déjà utilisé côté UI — cf. src/lib/mockBracket.ts. */
export function versMatchJSON(row: Prisma.matchesGetPayload<object>) {
  return {
    id: row.id,
    tournoiId: row.tournoi_id,
    round: row.round,
    position: row.position,
    joueur1: row.joueur1,
    joueur2: row.joueur2,
    score1: row.score1,
    score2: row.score2,
    statut: row.statut,
  };
}

export type EvenementJSON = { id: string; texte: string; creeLe: number };

export function versEvenementJSON(row: Prisma.match_evenementsGetPayload<object>): EvenementJSON {
  return { id: row.id, texte: row.texte, creeLe: row.created_at.getTime() };
}

/** Vrai si `user` est l'organisateur du tournoi de ce match. */
export async function estOrganisateurDuMatch(matchId: string, userId: string): Promise<{ ok: boolean; tournoiId?: string }> {
  const match = await prisma.matches.findUnique({ where: { id: matchId }, include: { tournois: true } });
  if (!match) return { ok: false };
  return { ok: match.tournois.organisateur_id === userId, tournoiId: match.tournoi_id };
}
