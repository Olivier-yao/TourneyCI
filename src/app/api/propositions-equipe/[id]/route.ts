import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { propositionParId, traiterPropositionEquipe } from "@/lib/server/propositionsEquipe";

/** Réservé au chef de l'équipe concernée. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const proposition = await propositionParId(id);
  if (!proposition) return NextResponse.json({ success: false, error: "Proposition introuvable." }, { status: 404 });
  if (proposition.equipes_profil.chef_id !== user.id) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const statut = body?.statut;
  if (statut !== "acceptee" && statut !== "refusee") {
    return NextResponse.json({ success: false, error: "Statut invalide." }, { status: 400 });
  }

  await traiterPropositionEquipe(id, statut);
  return NextResponse.json({ success: true });
}
