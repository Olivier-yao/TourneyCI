import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { equipesDuJoueurJSON } from "@/lib/server/equipesBR";

/** Toutes les équipes Battle Royale (tous tournois confondus) dont le
 * compte connecté est membre. ?tournoiId=X filtre sur un seul tournoi
 * (utilisé pour retrouver "mon équipe" pendant l'inscription). */
export async function GET(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { searchParams } = new URL(request.url);
  const tournoiId = searchParams.get("tournoiId");
  const equipes = await equipesDuJoueurJSON(user.id);
  return NextResponse.json({ success: true, data: tournoiId ? equipes.filter((e) => e.tournoiId === tournoiId) : equipes });
}
