import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { demandeParId, approuverDemande, refuserDemande } from "@/lib/server/equipesBR";

/** Réservé au chef de l'équipe concernée. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const demande = await demandeParId(id);
  if (!demande) return NextResponse.json({ success: false, error: "Demande introuvable." }, { status: 404 });
  if (demande.equipes_br.chef_id !== user.id) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (body?.action === "approuver") await approuverDemande(id);
  else if (body?.action === "refuser") await refuserDemande(id);
  else return NextResponse.json({ success: false, error: "Action inconnue." }, { status: 400 });

  return NextResponse.json({ success: true });
}
