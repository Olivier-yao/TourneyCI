import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionAdminValide } from "@/lib/server/adminAuth";

/** Tranche un appel (validé/rejeté) — un appel ouvert bloque le versement du
 * cash prize en séquestre (cf. GET ci-dessous), donc réservé au vrai admin
 * (/tourney-control, session vérifiée côté serveur). AdminGate (déterrent
 * client uniquement, code visible dans le bundle JS) ne protège pas cette
 * route : n'importe quel compte connecté pouvait auparavant trancher
 * n'importe quel appel de n'importe quel tournoi via utilisateurConnecte()
 * seul, sans lien avec /tourney-control. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sessionAdminValide())) {
    return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const statut = body?.statut;
  if (statut !== "valide" && statut !== "rejete") {
    return NextResponse.json({ success: false, error: "Statut invalide." }, { status: 400 });
  }

  await prisma.appels.update({ where: { id }, data: { statut } });
  return NextResponse.json({ success: true });
}
