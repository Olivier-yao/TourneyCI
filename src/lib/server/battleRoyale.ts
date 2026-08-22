import type { Prisma } from "@/generated/prisma/client";

export type ResultatMancheJSON = { participantId: string; placement: number; eliminations: number };
export type MancheBRJSON = { numero: number; resultats: ResultatMancheJSON[]; horodatage: number };

export function versMancheBRJSON(
  row: Prisma.manches_brGetPayload<{ include: { manches_br_resultats: true } }>,
): MancheBRJSON {
  return {
    numero: row.numero,
    resultats: row.manches_br_resultats.map((r) => ({
      participantId: r.participant,
      placement: r.placement,
      eliminations: r.eliminations,
    })),
    horodatage: row.created_at.getTime(),
  };
}
