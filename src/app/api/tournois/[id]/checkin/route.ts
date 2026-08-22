import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";
import { presentsDuTournoi, inscriptionParNom, definirPresence } from "@/lib/server/checkin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ success: true, data: await presentsDuTournoi(id) });
}

/** Auto-checkin (sans "nom" dans le corps) : le compte connecté confirme sa
 * propre présence. Avec un "nom" différent du sien : réservé à
 * l'organisateur ou un adjoint accepté (gestion des inscrits, point 121). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const present = body?.present !== false;
  const nom = typeof body?.nom === "string" ? body.nom.trim() : undefined;

  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  const cible = nom ? await inscriptionParNom(id, nom) : await prisma.inscriptions.findUnique({
    where: { tournoi_id_profile_id: { tournoi_id: id, profile_id: user.id } },
    include: { profiles: true },
  });
  if (!cible) return NextResponse.json({ success: false, error: "Inscription introuvable." }, { status: 404 });

  if (cible.profile_id !== user.id) {
    const autorise = tournoi.organisateur_id === user.id || (await estAdjointAccepteDe(tournoi.organisateur_id, user.id));
    if (!autorise) {
      return NextResponse.json({ success: false, error: "Réservé à l'organisateur ou à ses adjoints." }, { status: 403 });
    }
  }

  await definirPresence(cible.id, present);
  return NextResponse.json({ success: true, data: await presentsDuTournoi(id) });
}
