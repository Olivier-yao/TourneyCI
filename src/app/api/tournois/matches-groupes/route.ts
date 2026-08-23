import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { versMatchesJSON } from "@/lib/server/matches";

/** Matchs de plusieurs tournois en un seul appel (`?ids=a,b,c`) — remplace
 * un fetch par tournoi affiché sur les écrans qui en listent plusieurs
 * (accueil, en-direct), même pattern que /api/tournois/avis-comptes. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parTournoi: Record<string, unknown[]> = {};
  for (const id of ids) parTournoi[id] = [];
  if (ids.length === 0) return NextResponse.json({ success: true, data: parTournoi });

  const matches = await prisma.matches.findMany({
    where: { tournoi_id: { in: ids } },
    orderBy: [{ round: "asc" }, { position: "asc" }],
  });
  const json = await versMatchesJSON(matches);
  for (const m of json) (parTournoi[m.tournoiId] ??= []).push(m);

  return NextResponse.json({ success: true, data: parTournoi });
}
