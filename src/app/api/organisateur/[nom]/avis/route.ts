import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { compteReputationOrganisateur } from "@/lib/server/avis";
import { profileIdDepuisNomOrganisateur } from "@/lib/server/adjoints";

/** Public : réputation combinée (avis sur les tournois + avis direct sur le
 * profil). "mon" (l'avis direct du visiteur connecté sur ce profil) n'est
 * renseigné que pour un visiteur authentifié. */
export async function GET(_request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const { nom } = await params;
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!profileId) {
    return NextResponse.json({ success: true, data: { coeurs: 0, coeursBrises: 0, mon: null } });
  }

  const compte = await compteReputationOrganisateur(profileId);
  const user = await utilisateurConnecte();
  const mon = user
    ? await prisma.avis_organisateur.findUnique({
        where: { auteur_id_organisateur_id: { auteur_id: user.id, organisateur_id: profileId } },
      })
    : null;
  return NextResponse.json({ success: true, data: { ...compte, mon: mon?.type ?? null } });
}

/** Pose l'avis direct sur ce profil, en remplaçant l'avis précédent s'il en
 * existait un (toggle d'un type à l'autre, point 112/113). */
export async function POST(request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { nom } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type;
  if (type !== "coeur" && type !== "coeur_brise") {
    return NextResponse.json({ success: false, error: "Type d'avis invalide." }, { status: 400 });
  }
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!profileId) return NextResponse.json({ success: false, error: "Organisateur introuvable." }, { status: 404 });

  await prisma.avis_organisateur.upsert({
    where: { auteur_id_organisateur_id: { auteur_id: user.id, organisateur_id: profileId } },
    create: { auteur_id: user.id, organisateur_id: profileId, type },
    update: { type },
  });
  return NextResponse.json({ success: true });
}

/** Retire l'avis direct laissé sur ce profil. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { nom } = await params;
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!profileId) return NextResponse.json({ success: true });

  await prisma.avis_organisateur.deleteMany({ where: { auteur_id: user.id, organisateur_id: profileId } });
  return NextResponse.json({ success: true });
}
