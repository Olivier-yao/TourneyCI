import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/server/tournois";
import { classementGlobal } from "@/lib/server/classement";
import { saisonActuelle } from "@/lib/server/saisons";

/** Classement public (ladder) de la saison en cours — visible même sans le
 * flag "moi" pour un visiteur non connecté, jamais bloquant. */
export async function GET() {
  const user = await utilisateurConnecte();
  const saison = await saisonActuelle();
  const classement = await classementGlobal(saison.id, user?.id);
  return NextResponse.json({ success: true, data: { saison, classement } });
}
