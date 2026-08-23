import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { rechercherOrganisateurs, organisateursSignales } from "@/lib/server/moderation";

/** Sans ?q, renvoie la file des organisateurs signalés automatiquement
 * (cœurs brisés au-delà du seuil, jamais encore traités) — avec ?q,
 * recherche libre par nom d'organisateur ou pseudo joueur. */
export async function GET(request: Request) {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim();
  const data = q ? await rechercherOrganisateurs(q) : await organisateursSignales();
  return NextResponse.json({ success: true, data });
}
