import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { equipesDuTournoiJSON, creerEquipeBR, supprimerEquipesDuTournoi } from "@/lib/server/equipesBR";

/** Public : liste des équipes Battle Royale (éphémères, propres au tournoi)
 * en cours de constitution. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ success: true, data: await equipesDuTournoiJSON(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  const paiementCouvert = Boolean(body?.paiementCouvert);
  if (!nom) return NextResponse.json({ success: false, error: "Nom d'équipe requis." }, { status: 400 });

  const equipe = await creerEquipeBR(id, nom, user.id, paiementCouvert);
  return NextResponse.json({ success: true, data: equipe });
}

/** Point 140 : nettoyage des équipes éphémères une fois le tournoi terminé —
 * aucun effet si termine_le n'est pas encore posé (garde-fou : n'importe qui
 * de connecté peut déclencher ce nettoyage opportuniste, mais uniquement
 * pour un tournoi réellement terminé). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi?.termine_le) return NextResponse.json({ success: false, error: "Tournoi pas encore terminé." }, { status: 400 });

  await supprimerEquipesDuTournoi(id);
  return NextResponse.json({ success: true });
}
