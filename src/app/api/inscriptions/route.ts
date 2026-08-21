import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Toutes les inscriptions du compte connecté, tous tournois confondus —
 * utilisé par mesInscriptions() (profil, historique, "inscrits" côté joueur). */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const inscriptions = await prisma.inscriptions.findMany({
    where: { profile_id: user.id },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: inscriptions.map((i) => ({ tournoiId: i.tournoi_id, tag: i.tag ?? undefined, equipe: i.equipe_nom ?? undefined })),
  });
}
