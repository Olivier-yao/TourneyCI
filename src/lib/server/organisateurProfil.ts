import { prisma } from "@/lib/prisma";

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

export type PlateformeSociale =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "x"
  | "whatsapp"
  | "twitch"
  | "discord"
  | "snapchat"
  | "site";

export type ReseauSocial = { plateforme: PlateformeSociale; url: string };

export type ProfilOrganisateurJSON = {
  tag?: string;
  bio?: string;
  banniereUrl?: string;
  photoUrl?: string;
  reseauxSociaux: ReseauSocial[];
  reglementStandardAccepteLe?: number;
  reglementCertifieAccepteLe?: number;
  suiviMasque: boolean;
};

export async function profilOrganisateurJSON(profileId: string): Promise<ProfilOrganisateurJSON> {
  const [profil, reseaux] = await Promise.all([
    prisma.organisateur_profils.findUnique({ where: { profile_id: profileId } }),
    prisma.organisateur_reseaux_sociaux.findMany({ where: { profile_id: profileId } }),
  ]);
  return {
    tag: profil?.tag ?? undefined,
    bio: profil?.bio ?? undefined,
    banniereUrl: profil?.banniere_url ?? undefined,
    photoUrl: profil?.photo_url ?? undefined,
    reseauxSociaux: reseaux.map((r) => ({ plateforme: r.plateforme as PlateformeSociale, url: r.url })),
    reglementStandardAccepteLe: profil?.reglement_standard_accepte_le?.getTime(),
    reglementCertifieAccepteLe: profil?.reglement_certifie_accepte_le?.getTime(),
    suiviMasque: profil?.suivi_masque ?? false,
  };
}

/** L'organisateur peut masquer publiquement SON PROPRE compteur de
 * followers (le nombre reste calculé normalement, juste pas affiché aux
 * visiteurs — cf. GET /api/organisateur/[nom]/suivi). */
export async function definirSuiviMasque(profileId: string, masque: boolean): Promise<void> {
  await prisma.organisateur_profils.upsert({
    where: { profile_id: profileId },
    create: { profile_id: profileId, suivi_masque: masque },
    update: { suivi_masque: masque },
  });
}

export async function definirTag(profileId: string, tag: string): Promise<void> {
  await prisma.organisateur_profils.update({ where: { profile_id: profileId }, data: { tag: tag.trim() } });
}

export async function definirBio(profileId: string, bio: string): Promise<void> {
  await prisma.organisateur_profils.update({ where: { profile_id: profileId }, data: { bio: bio.trim() } });
}

export async function definirBanniere(profileId: string, dataUrl: string): Promise<void> {
  await prisma.organisateur_profils.update({ where: { profile_id: profileId }, data: { banniere_url: dataUrl } });
}

/** Point 164 : photo organisateur modifiable une fois par semaine. */
export async function peutChangerPhoto(profileId: string): Promise<{ ok: boolean; prochainChangementLe?: number }> {
  const profil = await prisma.organisateur_profils.findUnique({ where: { profile_id: profileId } });
  const dernierChangement = profil?.photo_modifiee_le?.getTime();
  if (!dernierChangement) return { ok: true };
  const prochain = dernierChangement + SEPT_JOURS_MS;
  if (Date.now() >= prochain) return { ok: true };
  return { ok: false, prochainChangementLe: prochain };
}

export async function definirPhoto(profileId: string, dataUrl: string): Promise<void> {
  await prisma.organisateur_profils.update({
    where: { profile_id: profileId },
    data: { photo_url: dataUrl, photo_modifiee_le: new Date() },
  });
}

/** Une fois acceptée, l'acceptation ne se réécrit jamais (évite de perdre
 * la date d'origine si l'écran se rejoue par erreur) — même convention que
 * PUT /api/profil pour le règlement intérieur. Upsert (pas simple update) :
 * c'est la toute première étape du parcours "devenir organisateur", avant
 * même le choix d'un nom — la ligne organisateur_profils n'existe pas
 * encore (nom_organisateur nullable pour cette raison). */
export async function definirReglementStandardAccepte(profileId: string): Promise<void> {
  const profil = await prisma.organisateur_profils.findUnique({ where: { profile_id: profileId } });
  if (profil?.reglement_standard_accepte_le) return;
  await prisma.organisateur_profils.upsert({
    where: { profile_id: profileId },
    create: { profile_id: profileId, reglement_standard_accepte_le: new Date() },
    update: { reglement_standard_accepte_le: new Date() },
  });
}

export async function definirReglementCertifieAccepte(profileId: string): Promise<void> {
  const profil = await prisma.organisateur_profils.findUnique({ where: { profile_id: profileId } });
  if (profil?.reglement_certifie_accepte_le) return;
  await prisma.organisateur_profils.update({ where: { profile_id: profileId }, data: { reglement_certifie_accepte_le: new Date() } });
}

/** Ajoute ou remplace le lien d'une plateforme (un seul lien par plateforme). */
export async function definirReseauSocial(profileId: string, plateforme: PlateformeSociale, url: string): Promise<void> {
  const cible = url.trim();
  if (!cible) return;
  const normalisee = /^https?:\/\//i.test(cible) ? cible : `https://${cible}`;
  await prisma.organisateur_reseaux_sociaux.upsert({
    where: { profile_id_plateforme: { profile_id: profileId, plateforme } },
    create: { profile_id: profileId, plateforme, url: normalisee },
    update: { url: normalisee },
  });
}

export async function retirerReseauSocial(profileId: string, plateforme: PlateformeSociale): Promise<void> {
  await prisma.organisateur_reseaux_sociaux.deleteMany({ where: { profile_id: profileId, plateforme } });
}
