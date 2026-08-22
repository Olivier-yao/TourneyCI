import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const favoris = await prisma.favoris.findMany({ where: { profile_id: user.id } });
  return NextResponse.json({ success: true, data: favoris.map((f) => f.tournoi_id) });
}
