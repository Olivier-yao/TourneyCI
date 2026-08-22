import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

async function autoriseOrganisateur(tournoiId: string, userId: string): Promise<{ ok: boolean; erreur?: NextResponse }> {
  const tournoi = await prisma.tournois.findUnique({ where: { id: tournoiId } });
  if (!tournoi) return { ok: false, erreur: NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 }) };
  const autorise = tournoi.organisateur_id === userId || (await estAdjointAccepteDe(tournoi.organisateur_id, userId));
  if (!autorise) {
    return { ok: false, erreur: NextResponse.json({ success: false, error: "Réservé à l'organisateur ou à ses adjoints." }, { status: 403 }) };
  }
  return { ok: true };
}

/** Infos de connexion à la room (lien + mot de passe, point 121) — lecture
 * ouverte à l'organisateur, ses adjoints, et tout inscrit (sa propre fiche
 * tournoi les affiche désormais de façon persistante, plutôt que seulement
 * via la notification envoyée au moment de la diffusion). Écriture (PUT)
 * réservée à l'organisateur/ses adjoints. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  const estOrganisateur = tournoi.organisateur_id === user.id || (await estAdjointAccepteDe(tournoi.organisateur_id, user.id));
  const estInscrit = !estOrganisateur
    ? await prisma.inscriptions.findUnique({ where: { tournoi_id_profile_id: { tournoi_id: id, profile_id: user.id } } })
    : null;
  if (!estOrganisateur && !estInscrit) {
    return NextResponse.json({ success: false, error: "Réservé à l'organisateur, ses adjoints ou les inscrits." }, { status: 403 });
  }

  const infos = await prisma.room_infos.findUnique({ where: { tournoi_id: id } });
  return NextResponse.json({ success: true, data: { lien: infos?.lien ?? "", motDePasse: infos?.mot_de_passe ?? "" } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const autorise = await autoriseOrganisateur(id, user.id);
  if (!autorise.ok) return autorise.erreur!;

  const body = await request.json().catch(() => null);
  const lien = typeof body?.lien === "string" ? body.lien.trim() : "";
  const motDePasse = typeof body?.motDePasse === "string" ? body.motDePasse.trim() : "";

  await prisma.room_infos.upsert({
    where: { tournoi_id: id },
    create: { tournoi_id: id, lien, mot_de_passe: motDePasse },
    update: { lien, mot_de_passe: motDePasse },
  });
  return NextResponse.json({ success: true, data: { lien, motDePasse } });
}
