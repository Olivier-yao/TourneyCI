import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versNotificationJSON } from "@/lib/server/notifications";

/** Marque une notification comme lue (idempotent — ne réécrit pas lue_le si
 * déjà posé, même pattern que reglement_interieur_accepte_le). */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  const { id } = await params;

  const notification = await prisma.notifications.findUnique({ where: { id } });
  if (!notification || notification.destinataire_id !== user.id) {
    return NextResponse.json({ success: false, error: "Notification introuvable." }, { status: 404 });
  }

  const misAJour = notification.lue_le
    ? notification
    : await prisma.notifications.update({ where: { id }, data: { lue_le: new Date() } });

  return NextResponse.json({ success: true, data: versNotificationJSON(misAJour) });
}
