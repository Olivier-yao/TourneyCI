import type { Prisma } from "@/generated/prisma/client";

/** Adapte une ligne Prisma `mouvements` (snake_case) vers le type `Mouvement`
 * (camelCase) déjà utilisé côté UI — cf. src/lib/mockWallet.ts. */
export function versMouvementJSON(row: Prisma.mouvementsGetPayload<object>) {
  return {
    id: row.id,
    type: row.type,
    libelle: row.libelle,
    montantXof: row.montant_xof,
    dateLabel: row.created_at.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    horodatage: row.created_at.getTime(),
    tournoiId: row.tournoi_id ?? undefined,
  };
}

/** Le solde n'est pas stocké : il se dérive de la somme des mouvements (comme
 * termine/enDirect ailleurs) — pas de double source de vérité à garder
 * synchronisée. */
export function soldeDepuisMouvements(mouvements: { montantXof: number }[]): number {
  return mouvements.reduce((somme, m) => somme + m.montantXof, 0);
}
