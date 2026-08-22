import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const suivis = await prisma.notifs_tournoi_suivis.findMany({ where: { profile_id: user.id } });
  return NextResponse.json({ success: true, data: suivis.map((s) => s.tournoi_id) });
}
