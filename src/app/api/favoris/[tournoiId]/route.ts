import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Bascule le favori dans une transaction (évite qu'un double clic ne laisse
 * la ligne dans un état incohérent). */
export async function POST(_request: Request, { params }: { params: Promise<{ tournoiId: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  const { tournoiId } = await params;

  const estFavori = await prisma.$transaction(async (tx) => {
    const existant = await tx.favoris.findUnique({
      where: { profile_id_tournoi_id: { profile_id: user.id, tournoi_id: tournoiId } },
    });
    if (existant) {
      await tx.favoris.delete({ where: { profile_id_tournoi_id: { profile_id: user.id, tournoi_id: tournoiId } } });
      return false;
    }
    await tx.favoris.create({ data: { profile_id: user.id, tournoi_id: tournoiId } });
    return true;
  });

  return NextResponse.json({ success: true, data: { estFavori } });
}
