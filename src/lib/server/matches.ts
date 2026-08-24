import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { photosDepuisPseudos } from "@/lib/server/identite";

/** Adapte des lignes Prisma `matches` (snake_case) vers le type `MatchTournoi`
 * (camelCase) déjà utilisé côté UI — cf. src/lib/mockBracket.ts. Résout les
 * photos de joueur1/joueur2 en une seule requête groupée pour tout le lot
 * (jamais de N+1 sur une liste de matchs) — absentes pour les tournois
 * Équipes, où joueur1/joueur2 portent un nom d'équipe, pas un pseudo. */
export async function versMatchesJSON(rows: Prisma.matchesGetPayload<object>[]) {
  const photos = await photosDepuisPseudos(rows.flatMap((r) => [r.joueur1, r.joueur2]));
  return rows.map((row) => ({
    id: row.id,
    tournoiId: row.tournoi_id,
    round: row.round,
    position: row.position,
    joueur1: row.joueur1,
    joueur2: row.joueur2,
    joueur1PhotoUrl: row.joueur1 ? photos.get(row.joueur1) : undefined,
    joueur2PhotoUrl: row.joueur2 ? photos.get(row.joueur2) : undefined,
    score1: row.score1,
    score2: row.score2,
    statut: row.statut,
    termineLe: row.termine_le?.getTime(),
  }));
}

export async function versMatchJSON(row: Prisma.matchesGetPayload<object>) {
  const [json] = await versMatchesJSON([row]);
  return json;
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
