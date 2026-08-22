import { NextResponse } from "next/server";
import { compteAvisTournoiPlusieurs } from "@/lib/server/avis";

/** Public : compteurs cœurs/cœurs brisés pour plusieurs tournois en un seul
 * appel (`?ids=a,b,c`) — remplace un fetch par tournoi affiché sur les
 * écrans qui en listent plusieurs (en-direct, profil organisateur). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const comptes = await compteAvisTournoiPlusieurs(ids);
  return NextResponse.json({ success: true, data: comptes });
}
