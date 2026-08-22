import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Bascule le suivi des notifications d'un tournoi, dans une transaction
 * (même précaution que /api/favoris/[tournoiId]). */
export async function POST(_request: Request, { params }: { params: Promise<{ tournoiId: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  const { tournoiId } = await params;

  const estActivee = await prisma.$transaction(async (tx) => {
    const existant = await tx.notifs_tournoi_suivis.findUnique({
      where: { profile_id_tournoi_id: { profile_id: user.id, tournoi_id: tournoiId } },
    });
    if (existant) {
      await tx.notifs_tournoi_suivis.delete({ where: { profile_id_tournoi_id: { profile_id: user.id, tournoi_id: tournoiId } } });
      return false;
    }
    await tx.notifs_tournoi_suivis.create({ data: { profile_id: user.id, tournoi_id: tournoiId } });
    return true;
  });

  return NextResponse.json({ success: true, data: { estActivee } });
}
