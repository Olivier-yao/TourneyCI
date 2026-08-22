import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

export async function POST() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  await prisma.notifications.updateMany({
    where: { destinataire_id: user.id, lue_le: null },
    data: { lue_le: new Date() },
  });
  return NextResponse.json({ success: true });
}
