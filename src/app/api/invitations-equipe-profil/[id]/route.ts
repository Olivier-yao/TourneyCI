import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { invitationParId, repondreInvitation } from "@/lib/server/equipesProfil";

/** Réservé au destinataire de l'invitation. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const invitation = await invitationParId(id);
  if (!invitation) return NextResponse.json({ success: false, error: "Invitation introuvable." }, { status: 404 });
  if (invitation.destinataire_id !== user.id) {
    return NextResponse.json({ success: false, error: "Réservé au destinataire de l'invitation." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.accepter !== "boolean") return NextResponse.json({ success: false, error: "Paramètre manquant." }, { status: 400 });

  const resultat = await repondreInvitation(id, body.accepter);
  if (!resultat.ok) return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  return NextResponse.json({ success: true });
}
