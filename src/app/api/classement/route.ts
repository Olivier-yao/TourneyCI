import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/server/tournois";
import { classementGlobal } from "@/lib/server/classement";

/** Classement public (ladder) — visible même sans le flag "moi" pour un
 * visiteur non connecté, jamais bloquant. */
export async function GET() {
  const user = await utilisateurConnecte();
  const classement = await classementGlobal(user?.id);
  return NextResponse.json({ success: true, data: classement });
}
