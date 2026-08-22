import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versEvenementJSON } from "@/lib/server/matches";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evenements = await prisma.match_evenements.findMany({ where: { match_id: id }, orderBy: { created_at: "desc" } });
  return NextResponse.json({ success: true, data: evenements.map(versEvenementJSON) });
}

/** Réservé à l'organisateur du tournoi ou l'un de ses adjoints acceptés
 * (même écran qu'aujourd'hui, VueOrganisateurMatch.tsx). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const texte = typeof body?.texte === "string" ? body.texte.trim() : "";
  if (!texte) return NextResponse.json({ success: false, error: "Texte requis." }, { status: 400 });

  const match = await prisma.matches.findUnique({ where: { id }, include: { tournois: true } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });
  const autorise =
    match.tournois.organisateur_id === user.id || (await estAdjointAccepteDe(match.tournois.organisateur_id, user.id));
  if (!autorise) {
    return NextResponse.json({ success: false, error: "Réservé à l'organisateur ou à ses adjoints." }, { status: 403 });
  }

  const evenement = await prisma.match_evenements.create({ data: { match_id: id, texte } });
  return NextResponse.json({ success: true, data: versEvenementJSON(evenement) });
}
