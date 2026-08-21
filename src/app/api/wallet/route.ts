import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versMouvementJSON, soldeDepuisMouvements } from "@/lib/server/wallet";

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const mouvements = await prisma.mouvements.findMany({
    where: { profile_id: user.id },
    orderBy: { created_at: "desc" },
  });
  const donnees = mouvements.map(versMouvementJSON);

  return NextResponse.json({ success: true, data: { solde: soldeDepuisMouvements(donnees), mouvements: donnees } });
}
