import { prisma } from "@/lib/prisma";
import { Prisma, type statut_invitation } from "@/generated/prisma/client";
import { pseudosDepuisIds } from "./identite";

export type EquipeProfilJSON = {
  id: string;
  nom: string;
  chef: string;
  membres: string[];
  creeLe: number;
  nomModifieLe?: number;
};

export type InvitationEquipeProfilJSON = {
  id: string;
  equipeId: string;
  equipeNom: string;
  chef: string;
  destinataire: string;
  statut: statut_invitation;
  horodatage: number;
};

export const MAX_EQUIPES_PROFIL = 5;
export const MAX_MEMBRES_EQUIPE_PROFIL = 4;

type EquipeProfilRow = Prisma.equipes_profilGetPayload<{ include: { equipes_profil_membres: true } }>;

async function versEquipesProfilJSON(lignes: EquipeProfilRow[]): Promise<EquipeProfilJSON[]> {
  const ids = lignes.flatMap((l) => [l.chef_id, ...l.equipes_profil_membres.map((m) => m.profile_id)]);
  const pseudos = await pseudosDepuisIds(ids);
  return lignes.map((l) => ({
    id: l.id,
    nom: l.nom,
    chef: pseudos.get(l.chef_id) ?? "?",
    membres: l.equipes_profil_membres.map((m) => pseudos.get(m.profile_id) ?? "?"),
    creeLe: l.created_at.getTime(),
    nomModifieLe: l.nom_modifie_le?.getTime(),
  }));
}

export async function equipesProfilDontChefJSON(chefId: string): Promise<EquipeProfilJSON[]> {
  const lignes = await prisma.equipes_profil.findMany({
    where: { chef_id: chefId },
    include: { equipes_profil_membres: true },
    orderBy: { created_at: "asc" },
  });
  return versEquipesProfilJSON(lignes);
}

/** Équipes dont ce profil est simple membre (pas chef) — point 192. */
export async function equipesProfilDontMembreNonChefJSON(profileId: string): Promise<EquipeProfilJSON[]> {
  const lignes = await prisma.equipes_profil.findMany({
    where: { chef_id: { not: profileId }, equipes_profil_membres: { some: { profile_id: profileId } } },
    include: { equipes_profil_membres: true },
    orderBy: { created_at: "asc" },
  });
  return versEquipesProfilJSON(lignes);
}

export async function equipeProfilParIdJSON(id: string): Promise<EquipeProfilJSON | null> {
  const ligne = await prisma.equipes_profil.findUnique({ where: { id }, include: { equipes_profil_membres: true } });
  if (!ligne) return null;
  return (await versEquipesProfilJSON([ligne]))[0];
}

export async function estMembreEquipeProfil(equipeId: string, profileId: string): Promise<boolean> {
  const ligne = await prisma.equipes_profil.findUnique({
    where: { id: equipeId },
    select: { chef_id: true, equipes_profil_membres: { where: { profile_id: profileId } } },
  });
  return Boolean(ligne) && (ligne!.chef_id === profileId || ligne!.equipes_profil_membres.length > 0);
}

export async function estChefEquipeProfil(equipeId: string, profileId: string): Promise<boolean> {
  const ligne = await prisma.equipes_profil.findUnique({ where: { id: equipeId } });
  return ligne?.chef_id === profileId;
}

export type ResultatCreationEquipeProfil = { ok: true; equipe: EquipeProfilJSON } | { ok: false; erreur: string };

export async function creerEquipeProfil(nom: string, chefId: string): Promise<ResultatCreationEquipeProfil> {
  const nbExistantes = await prisma.equipes_profil.count({ where: { chef_id: chefId } });
  if (nbExistantes >= MAX_EQUIPES_PROFIL) return { ok: false, erreur: `Maximum ${MAX_EQUIPES_PROFIL} équipes.` };
  try {
    const creee = await prisma.$transaction(async (tx) => {
      const equipe = await tx.equipes_profil.create({ data: { nom, chef_id: chefId } });
      await tx.equipes_profil_membres.create({ data: { equipe_id: equipe.id, profile_id: chefId } });
      return tx.equipes_profil.findUniqueOrThrow({ where: { id: equipe.id }, include: { equipes_profil_membres: true } });
    });
    return { ok: true, equipe: (await versEquipesProfilJSON([creee]))[0] };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, erreur: "Tu as déjà une équipe avec ce nom." };
    }
    throw err;
  }
}

/** Point 155 : renommage limité à 1×/mois — le calcul de délai reste côté
 * appelant (limiteMensuelle.ts, pure), cette fonction ne fait que lire/écrire
 * nom_modifie_le. */
export async function renommerEquipeProfil(id: string, nom: string): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const equipe = await prisma.equipes_profil.findUnique({ where: { id } });
  if (!equipe) return { ok: false, erreur: "Équipe introuvable." };
  const dejaPris = await prisma.equipes_profil.findFirst({
    where: { chef_id: equipe.chef_id, id: { not: id }, nom: { equals: nom.trim(), mode: "insensitive" } },
  });
  if (dejaPris) return { ok: false, erreur: "Tu as déjà une équipe avec ce nom." };
  await prisma.equipes_profil.update({ where: { id }, data: { nom: nom.trim(), nom_modifie_le: new Date() } });
  return { ok: true };
}

export async function ajouterMembreEquipeProfil(equipeId: string, membreId: string): Promise<{ ok: true } | { ok: false; erreur: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Verrou sur la ligne de l'équipe le temps de la transaction : sans
      // lui, deux invitations acceptées en même temps sur une équipe à 1
      // place restante peuvent toutes les deux passer le contrôle avant que
      // l'une des deux n'ait inséré son adhésion (même classe de course que
      // l'équipe Battle Royale, cf. rejoindreEquipeAleatoire).
      await tx.$queryRaw`SELECT id FROM equipes_profil WHERE id = ${equipeId}::uuid FOR UPDATE`;
      const nb = await tx.equipes_profil_membres.count({ where: { equipe_id: equipeId } });
      if (nb >= MAX_MEMBRES_EQUIPE_PROFIL) throw new Error("COMPLETE");
      await tx.equipes_profil_membres.upsert({
        where: { equipe_id_profile_id: { equipe_id: equipeId, profile_id: membreId } },
        create: { equipe_id: equipeId, profile_id: membreId },
        update: {},
      });
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "COMPLETE") {
      return { ok: false, erreur: `Équipe complète (max ${MAX_MEMBRES_EQUIPE_PROFIL} membres).` };
    }
    throw err;
  }
}

export async function retirerMembreEquipeProfil(equipeId: string, membreId: string): Promise<void> {
  await prisma.equipes_profil_membres.deleteMany({ where: { equipe_id: equipeId, profile_id: membreId } });
}

export async function supprimerEquipeProfil(id: string): Promise<void> {
  await prisma.equipes_profil.delete({ where: { id } });
}

export async function invitationsRecuesJSON(destinataireId: string): Promise<InvitationEquipeProfilJSON[]> {
  const lignes = await prisma.invitations_equipe_profil.findMany({
    where: { destinataire_id: destinataireId, statut: "en_attente" },
    include: { equipes_profil: true },
    orderBy: { created_at: "desc" },
  });
  const pseudos = await pseudosDepuisIds([...lignes.map((l) => l.equipes_profil.chef_id), destinataireId]);
  return lignes.map((l) => ({
    id: l.id,
    equipeId: l.equipe_id,
    equipeNom: l.equipes_profil.nom,
    chef: pseudos.get(l.equipes_profil.chef_id) ?? "?",
    destinataire: pseudos.get(destinataireId) ?? "?",
    statut: l.statut,
    horodatage: l.created_at.getTime(),
  }));
}

export async function aUneInvitationEnAttente(equipeId: string, destinataireId: string): Promise<boolean> {
  const ligne = await prisma.invitations_equipe_profil.findFirst({ where: { equipe_id: equipeId, destinataire_id: destinataireId, statut: "en_attente" } });
  return Boolean(ligne);
}

export type ResultatInvitation = { ok: true } | { ok: false; erreur: string };

export async function inviterParTagEquipeProfil(equipeId: string, destinataireId: string): Promise<ResultatInvitation> {
  const equipe = await prisma.equipes_profil.findUnique({ where: { id: equipeId }, include: { equipes_profil_membres: true } });
  if (!equipe) return { ok: false, erreur: "Équipe introuvable." };
  if (equipe.equipes_profil_membres.length >= MAX_MEMBRES_EQUIPE_PROFIL) return { ok: false, erreur: `Équipe complète (max ${MAX_MEMBRES_EQUIPE_PROFIL} membres).` };
  if (equipe.equipes_profil_membres.some((m) => m.profile_id === destinataireId)) return { ok: false, erreur: "Ce joueur est déjà dans l'équipe." };
  if (await aUneInvitationEnAttente(equipeId, destinataireId)) return { ok: false, erreur: "Invitation déjà envoyée à ce joueur." };
  await prisma.invitations_equipe_profil.create({ data: { equipe_id: equipeId, destinataire_id: destinataireId } });
  return { ok: true };
}

export async function invitationParId(id: string) {
  return prisma.invitations_equipe_profil.findUnique({ where: { id }, include: { equipes_profil: true } });
}

export async function repondreInvitation(id: string, accepter: boolean): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const invitation = await prisma.invitations_equipe_profil.findUnique({ where: { id } });
  if (!invitation || invitation.statut !== "en_attente") return { ok: false, erreur: "Invitation introuvable ou déjà traitée." };
  await prisma.invitations_equipe_profil.update({ where: { id }, data: { statut: accepter ? "acceptee" : "refusee" } });
  if (accepter) {
    const resultat = await ajouterMembreEquipeProfil(invitation.equipe_id, invitation.destinataire_id);
    if (!resultat.ok) return resultat;
  }
  return { ok: true };
}
