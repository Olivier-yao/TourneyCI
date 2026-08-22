import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versNotificationJSON } from "@/lib/server/notifications";

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const notifications = await prisma.notifications.findMany({
    where: { destinataire_id: user.id },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ success: true, data: notifications.map(versNotificationJSON) });
}

/** Auto-notification uniquement (destinataire = l'appelant) — même
 * sémantique que le mock localStorage précédent : notifier de vrais autres
 * participants (diffusion à toute la liste d'inscrits d'un tournoi) reste
 * hors périmètre de cette étape. */
export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const texte = typeof body?.texte === "string" ? body.texte.trim() : "";
  const tournoiId = typeof body?.tournoiId === "string" ? body.tournoiId : undefined;
  if (!texte) return NextResponse.json({ success: false, error: "Texte manquant." }, { status: 400 });

  const notification = await prisma.notifications.create({
    data: { destinataire_id: user.id, texte, tournoi_id: tournoiId },
  });
  return NextResponse.json({ success: true, data: versNotificationJSON(notification) });
}
