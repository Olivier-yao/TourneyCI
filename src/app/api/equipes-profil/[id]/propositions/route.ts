import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estChefEquipeProfil } from "@/lib/server/equipesProfil";
import { propositionsEnAttentePourEquipeJSON } from "@/lib/server/propositionsEquipe";

/** Réservé au chef : propositions d'inscription en attente pour cette
 * équipe, tous tournois confondus. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: await propositionsEnAttentePourEquipeJSON(id) });
}
