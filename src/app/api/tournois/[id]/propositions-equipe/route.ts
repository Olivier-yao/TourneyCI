import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estMembreEquipeProfil } from "@/lib/server/equipesProfil";
import { proposerInscriptionEquipe } from "@/lib/server/propositionsEquipe";

/** Un membre (chef ou non) d'une équipe pré-créée propose son inscription à
 * ce tournoi — le chef devra valider depuis "Mes équipes" pour que
 * l'inscription se lance réellement (point 192). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const equipeProfilId = typeof body?.equipeProfilId === "string" ? body.equipeProfilId : "";
  if (!(await estMembreEquipeProfil(equipeProfilId, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé aux membres de l'équipe." }, { status: 403 });
  }

  const proposition = await proposerInscriptionEquipe(equipeProfilId, id, user.id);
  return NextResponse.json({ success: true, data: proposition });
}
