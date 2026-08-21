import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { type_mouvement } from "@/generated/prisma/client";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versMouvementJSON, soldeDepuisMouvements } from "@/lib/server/wallet";

const TYPES_VALIDES: type_mouvement[] = ["gain", "inscription", "recharge", "retrait", "commission", "financement", "remboursement"];

/** Ajoute un mouvement au solde du compte connecté — montantXof signé
 * (positif = crédit, négatif = débit). Un débit n'est accepté que si le
 * solde (dérivé de la somme des mouvements existants) suffit, vérifié dans
 * la même transaction que l'insertion pour éviter qu'un double clic ne
 * passe deux débits concurrents sous le seuil. */
export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const type = body?.type as type_mouvement;
  const libelle = typeof body?.libelle === "string" ? body.libelle.trim() : "";
  const montantXof = Math.round(Number(body?.montantXof));
  const tournoiId = typeof body?.tournoiId === "string" ? body.tournoiId : undefined;

  if (!TYPES_VALIDES.includes(type) || !libelle || !Number.isFinite(montantXof) || montantXof === 0) {
    return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });
  }

  const resultat = await prisma.$transaction(async (tx) => {
    if (montantXof < 0) {
      const agg = await tx.mouvements.aggregate({ where: { profile_id: user.id }, _sum: { montant_xof: true } });
      const soldeActuel = agg._sum.montant_xof ?? 0;
      if (soldeActuel + montantXof < 0) return { ok: false as const, erreur: "Solde insuffisant." };
    }
    const mouvement = await tx.mouvements.create({
      data: { profile_id: user.id, type, libelle, montant_xof: montantXof, tournoi_id: tournoiId },
    });
    return { ok: true as const, mouvement };
  });

  if (!resultat.ok) {
    return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { mouvement: versMouvementJSON(resultat.mouvement) } });
}
