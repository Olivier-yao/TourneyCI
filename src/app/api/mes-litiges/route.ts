import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { mesLitigesJSON } from "@/lib/server/litiges";

/** Historique des litiges déposés par le compte connecté. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  return NextResponse.json({ success: true, data: await mesLitigesJSON(user.id) });
}
