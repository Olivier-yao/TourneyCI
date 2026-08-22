import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { profileIdDepuisNomOrganisateur } from "@/lib/server/adjoints";
import { suisOrganisateur, basculerSuivi, compteFollowers, listeFollowers } from "@/lib/server/suivi";

/** Public : compteur de followers + liste (pour la modale de détail) +
 * indicateur de masquage volontaire par l'organisateur. "suivi" (le
 * visiteur connecté suit-il déjà) n'est renseigné que pour un visiteur
 * authentifié. */
export async function GET(_request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const { nom } = await params;
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!profileId) {
    return NextResponse.json({ success: true, data: { suivi: false, compte: 0, followers: [], masque: false } });
  }

  const user = await utilisateurConnecte();
  const [compte, followers, masqueProfil] = await Promise.all([
    compteFollowers(profileId),
    listeFollowers(profileId),
    prisma.organisateur_profils.findUnique({ where: { profile_id: profileId }, select: { suivi_masque: true } }),
  ]);
  return NextResponse.json({
    success: true,
    data: { suivi: await suisOrganisateur(user?.id, profileId), compte, followers, masque: masqueProfil?.suivi_masque ?? false },
  });
}

/** Bascule le suivi du visiteur connecté. */
export async function POST(_request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { nom } = await params;
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!profileId) return NextResponse.json({ success: false, error: "Organisateur introuvable." }, { status: 404 });

  const suivi = await basculerSuivi(user.id, profileId);
  const compte = await compteFollowers(profileId);
  return NextResponse.json({ success: true, data: { suivi, compte } });
}
