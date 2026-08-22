import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Tranche un appel (validé/rejeté) — consultée par l'écran d'admin, même
 * réserve que GET /api/appels/ouverts (pas de vrai rôle admin pour
 * l'instant, cf. AdminGate). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const statut = body?.statut;
  if (statut !== "valide" && statut !== "rejete") {
    return NextResponse.json({ success: false, error: "Statut invalide." }, { status: 400 });
  }

  await prisma.appels.update({ where: { id }, data: { statut } });
  return NextResponse.json({ success: true });
}
