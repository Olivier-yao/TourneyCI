import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { equipeParIdJSON, estChefEquipeBR, marquerPaiementCouvert } from "@/lib/server/equipesBR";

/** Public : détail d'une équipe Battle Royale (nom, chef, membres). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipe = await equipeParIdJSON(id);
  if (!equipe) return NextResponse.json({ success: false, error: "Équipe introuvable." }, { status: 404 });
  return NextResponse.json({ success: true, data: equipe });
}

/** Réservé au chef : bascule l'équipe en "frais couverts" après confirmation
 * de son propre paiement pour toute l'équipe. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeBR(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (body?.action !== "marquerPaiementCouvert") {
    return NextResponse.json({ success: false, error: "Action inconnue." }, { status: 400 });
  }
  await marquerPaiementCouvert(id);
  return NextResponse.json({ success: true });
}
