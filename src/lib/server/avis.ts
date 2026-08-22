import { prisma } from "@/lib/prisma";
import type { Prisma, type_avis } from "@/generated/prisma/client";

export type AvisTournoiJSON = { id: string; tournoiId: string; type: type_avis; message?: string; horodatage: number };

export function versAvisTournoiJSON(row: Prisma.avis_tournoiGetPayload<object>): AvisTournoiJSON {
  return {
    id: row.id,
    tournoiId: row.tournoi_id,
    type: row.type,
    message: row.message ?? undefined,
    horodatage: row.created_at.getTime(),
  };
}

export async function compteAvisTournoi(tournoiId: string): Promise<{ coeurs: number; coeursBrises: number }> {
  const [coeurs, coeursBrises] = await Promise.all([
    prisma.avis_tournoi.count({ where: { tournoi_id: tournoiId, type: "coeur" } }),
    prisma.avis_tournoi.count({ where: { tournoi_id: tournoiId, type: "coeur_brise" } }),
  ]);
  return { coeurs, coeursBrises };
}

/** Version groupée de compteAvisTournoi() : un seul aller-retour base pour
 * plusieurs tournois, au lieu d'un appel HTTP par tournoi affiché (pattern
 * en cascade repéré sur /en-direct et les profils organisateur — chaque
 * tournoi en direct payait un aller-retour réseau supplémentaire). */
export async function compteAvisTournoiPlusieurs(
  tournoiIds: string[],
): Promise<Record<string, { coeurs: number; coeursBrises: number }>> {
  const resultat: Record<string, { coeurs: number; coeursBrises: number }> = {};
  for (const id of tournoiIds) resultat[id] = { coeurs: 0, coeursBrises: 0 };
  if (tournoiIds.length === 0) return resultat;

  const lignes = await prisma.avis_tournoi.groupBy({
    by: ["tournoi_id", "type"],
    where: { tournoi_id: { in: tournoiIds } },
    _count: { _all: true },
  });
  for (const ligne of lignes) {
    const cible = resultat[ligne.tournoi_id];
    if (!cible) continue;
    if (ligne.type === "coeur") cible.coeurs = ligne._count._all;
    else cible.coeursBrises = ligne._count._all;
  }
  return resultat;
}

/** Réputation combinée d'un organisateur : avis laissés sur chacun de ses
 * tournois + avis laissés directement sur son profil — même agrégat que
 * statistiquesReputation() côté client (mockOrganisateur.ts). */
export async function compteReputationOrganisateur(profileId: string): Promise<{ coeurs: number; coeursBrises: number }> {
  const [tCoeurs, tBrises, gCoeurs, gBrises] = await Promise.all([
    prisma.avis_tournoi.count({ where: { type: "coeur", tournois: { organisateur_id: profileId } } }),
    prisma.avis_tournoi.count({ where: { type: "coeur_brise", tournois: { organisateur_id: profileId } } }),
    prisma.avis_organisateur.count({ where: { type: "coeur", organisateur_id: profileId } }),
    prisma.avis_organisateur.count({ where: { type: "coeur_brise", organisateur_id: profileId } }),
  ]);
  return { coeurs: tCoeurs + gCoeurs, coeursBrises: tBrises + gBrises };
}
