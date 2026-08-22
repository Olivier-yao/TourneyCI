import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { invitationsRecuesJSON } from "@/lib/server/equipesProfil";

/** Invitations en attente reçues par le compte connecté. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  return NextResponse.json({ success: true, data: await invitationsRecuesJSON(user.id) });
}
