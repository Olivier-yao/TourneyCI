import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { demandeEnAttentePour, creerDemande } from "@/lib/server/demandesAnnulation";

function interdit() {
  return NextResponse.json({ success: false, error: "Réservé à l'organisateur de ce tournoi." }, { status: 403 });
}

/** Réservé à l'organisateur (jamais un adjoint — même frontière que les
 * réglages, cf. mockAdjointsOrganisateur.ts). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  if (tournoi.organisateur_id !== user.id) return interdit();

  return NextResponse.json({ success: true, data: (await demandeEnAttentePour(id)) ?? null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const motif = typeof body?.motif === "string" ? body.motif.trim() : "";
  if (!motif) return NextResponse.json({ success: false, error: "Motif requis." }, { status: 400 });

  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  if (tournoi.organisateur_id !== user.id) return interdit();

  const demande = await creerDemande(id, user.id, motif);
  return NextResponse.json({ success: true, data: demande });
}
