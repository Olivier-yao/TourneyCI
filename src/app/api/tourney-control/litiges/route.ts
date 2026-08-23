import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { litigesEnAttenteJSON } from "@/lib/server/litiges";

/** Supervision admin (lecture seule) : les litiges sont tranchés par
 * l'organisateur du tournoi concerné, jamais depuis /tourney-control. */
export async function GET() {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ success: true, data: await litigesEnAttenteJSON() });
}
