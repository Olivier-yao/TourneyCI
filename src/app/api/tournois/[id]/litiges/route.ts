import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";
import { nbLitigesOuvertsPourTournoi } from "@/lib/server/litiges";

/** Nombre de litiges en attente pour ce tournoi — jauge de clôture
 * organisateur (cf. cloture/page.tsx). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  const autorise = tournoi.organisateur_id === user.id || (await estAdjointAccepteDe(tournoi.organisateur_id, user.id));
  if (!autorise) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  return NextResponse.json({ success: true, data: { ouverts: await nbLitigesOuvertsPourTournoi(id) } });
}
