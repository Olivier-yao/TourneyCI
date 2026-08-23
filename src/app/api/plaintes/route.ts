import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { creerPlainte } from "@/lib/server/plaintes";

export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const sujet = typeof body?.sujet === "string" ? body.sujet : "";
  const description = typeof body?.description === "string" ? body.description : "";

  const plainte = await creerPlainte(user.id, sujet, description);
  if (!plainte) return NextResponse.json({ success: false, error: "Sujet et description requis." }, { status: 400 });
  return NextResponse.json({ success: true, data: plainte });
}
