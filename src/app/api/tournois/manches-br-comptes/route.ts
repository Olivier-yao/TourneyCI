import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Nombre de manches déjà closes, pour plusieurs tournois Battle Royale en
 * un seul appel (`?ids=a,b,c`) — remplace un fetch par tournoi sur l'écran
 * "en direct", même pattern que /api/tournois/avis-comptes. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const comptes: Record<string, number> = {};
  for (const id of ids) comptes[id] = 0;
  if (ids.length === 0) return NextResponse.json({ success: true, data: comptes });

  const lignes = await prisma.manches_br.groupBy({
    by: ["tournoi_id"],
    where: { tournoi_id: { in: ids } },
    _count: { _all: true },
  });
  for (const ligne of lignes) comptes[ligne.tournoi_id] = ligne._count._all;

  return NextResponse.json({ success: true, data: comptes });
}
