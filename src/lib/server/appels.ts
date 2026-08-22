import type { Prisma } from "@/generated/prisma/client";

export type StatutAppel = "ouvert" | "valide" | "rejete";
export type AppelJSON = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  auteur: string;
  motif: string;
  statut: StatutAppel;
  horodatage: number;
};

export function versAppelJSON(row: Prisma.appelsGetPayload<{ include: { tournois: true; profiles: true } }>): AppelJSON {
  return {
    id: row.id,
    tournoiId: row.tournoi_id,
    tournoiTitre: row.tournois.titre,
    auteur: row.profiles.pseudo,
    motif: row.motif,
    statut: row.statut as StatutAppel,
    horodatage: row.created_at.getTime(),
  };
}
