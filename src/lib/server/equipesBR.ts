import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { pseudosDepuisIds } from "./identite";

export type EquipeBRJSON = {
  id: string;
  tournoiId: string;
  nom: string;
  chef: string;
  membres: string[];
  paiementCouvert: boolean;
  creeLe: number;
};

export type DemandeEquipeBRJSON = { id: string; equipeId: string; demandeur: string; horodatage: number };
export type RetraitEquipeBRJSON = { id: string; equipeId: string; membre: string; motif: string; horodatage: number };

type EquipeBRRow = Prisma.equipes_brGetPayload<{ include: { equipes_br_membres: true } }>;

/** Traduit un lot de lignes equipes_br (chef_id/profile_id) vers le format
 * pseudo attendu côté UI — une seule résolution de pseudos pour tout le lot,
 * plutôt qu'une par équipe. */
async function versEquipesBRJSON(lignes: EquipeBRRow[]): Promise<EquipeBRJSON[]> {
  const ids = lignes.flatMap((l) => [l.chef_id, ...l.equipes_br_membres.map((m) => m.profile_id)]);
  const pseudos = await pseudosDepuisIds(ids);
  return lignes.map((l) => ({
    id: l.id,
    tournoiId: l.tournoi_id,
    nom: l.nom,
    chef: pseudos.get(l.chef_id) ?? "?",
    membres: l.equipes_br_membres.map((m) => pseudos.get(m.profile_id) ?? "?"),
    paiementCouvert: l.paiement_couvert,
    creeLe: l.created_at.getTime(),
  }));
}

export async function equipesDuTournoiJSON(tournoiId: string): Promise<EquipeBRJSON[]> {
  const lignes = await prisma.equipes_br.findMany({
    where: { tournoi_id: tournoiId },
    include: { equipes_br_membres: true },
    orderBy: { created_at: "asc" },
  });
  return versEquipesBRJSON(lignes);
}

/** Toutes les équipes (tous tournois confondus) dont ce profil est membre —
 * utilisé par "Mes équipes" (onglet "En tournois") et le compteur du profil. */
export async function equipesDuJoueurJSON(profileId: string): Promise<EquipeBRJSON[]> {
  const lignes = await prisma.equipes_br.findMany({
    where: { equipes_br_membres: { some: { profile_id: profileId } } },
    include: { equipes_br_membres: true },
    orderBy: { created_at: "desc" },
  });
  return versEquipesBRJSON(lignes);
}

export async function equipeParIdJSON(equipeId: string): Promise<EquipeBRJSON | null> {
  const ligne = await prisma.equipes_br.findUnique({ where: { id: equipeId }, include: { equipes_br_membres: true } });
  if (!ligne) return null;
  return (await versEquipesBRJSON([ligne]))[0];
}

export async function estMembreEquipeBR(equipeId: string, profileId: string): Promise<boolean> {
  const ligne = await prisma.equipes_br_membres.findUnique({ where: { equipe_id_profile_id: { equipe_id: equipeId, profile_id: profileId } } });
  return Boolean(ligne);
}

export async function estChefEquipeBR(equipeId: string, profileId: string): Promise<boolean> {
  const ligne = await prisma.equipes_br.findUnique({ where: { id: equipeId } });
  return ligne?.chef_id === profileId;
}

export async function creerEquipeBR(tournoiId: string, nom: string, chefId: string, paiementCouvert: boolean): Promise<EquipeBRJSON> {
  const creee = await prisma.$transaction(async (tx) => {
    const equipe = await tx.equipes_br.create({ data: { tournoi_id: tournoiId, nom, chef_id: chefId, paiement_couvert: paiementCouvert } });
    await tx.equipes_br_membres.create({ data: { equipe_id: equipe.id, profile_id: chefId } });
    return tx.equipes_br.findUniqueOrThrow({ where: { id: equipe.id }, include: { equipes_br_membres: true } });
  });
  return (await versEquipesBRJSON([creee]))[0];
}

export async function demanderRejoindre(equipeId: string, demandeurId: string): Promise<DemandeEquipeBRJSON | null> {
  const [equipe, dejaMembre] = await Promise.all([
    prisma.equipes_br.findUnique({ where: { id: equipeId } }),
    estMembreEquipeBR(equipeId, demandeurId),
  ]);
  if (!equipe || dejaMembre) return null;
  const demande = await prisma.demandes_equipe_br.upsert({
    where: { equipe_id_demandeur_id: { equipe_id: equipeId, demandeur_id: demandeurId } },
    create: { equipe_id: equipeId, demandeur_id: demandeurId },
    update: {},
  });
  const pseudos = await pseudosDepuisIds([demandeurId]);
  return { id: demande.id, equipeId, demandeur: pseudos.get(demandeurId) ?? "?", horodatage: demande.created_at.getTime() };
}

export async function demandesEnAttenteJSON(equipeId: string): Promise<DemandeEquipeBRJSON[]> {
  const lignes = await prisma.demandes_equipe_br.findMany({ where: { equipe_id: equipeId }, orderBy: { created_at: "asc" } });
  const pseudos = await pseudosDepuisIds(lignes.map((l) => l.demandeur_id));
  return lignes.map((l) => ({ id: l.id, equipeId: l.equipe_id, demandeur: pseudos.get(l.demandeur_id) ?? "?", horodatage: l.created_at.getTime() }));
}

export async function aUneDemandeEnAttente(equipeId: string, demandeurId: string): Promise<boolean> {
  const ligne = await prisma.demandes_equipe_br.findUnique({ where: { equipe_id_demandeur_id: { equipe_id: equipeId, demandeur_id: demandeurId } } });
  return Boolean(ligne);
}

/** Approuve : intègre le demandeur (equipes_br_membres) et retire la demande,
 * dans une transaction. Réservé au chef (vérifié par l'appelant). */
export async function approuverDemande(demandeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const demande = await tx.demandes_equipe_br.findUnique({ where: { id: demandeId } });
    if (!demande) return;
    await tx.equipes_br_membres.upsert({
      where: { equipe_id_profile_id: { equipe_id: demande.equipe_id, profile_id: demande.demandeur_id } },
      create: { equipe_id: demande.equipe_id, profile_id: demande.demandeur_id },
      update: {},
    });
    await tx.demandes_equipe_br.delete({ where: { id: demandeId } });
  });
}

export async function refuserDemande(demandeId: string): Promise<void> {
  await prisma.demandes_equipe_br.deleteMany({ where: { id: demandeId } });
}

export async function demandeParId(demandeId: string) {
  return prisma.demandes_equipe_br.findUnique({ where: { id: demandeId }, include: { equipes_br: true } });
}

/** Retire un membre déjà intégré (motif obligatoire, conservé à l'historique). */
export async function retirerMembre(equipeId: string, membreId: string, motif: string): Promise<void> {
  if (!motif.trim()) return;
  await prisma.$transaction(async (tx) => {
    await tx.equipes_br_membres.deleteMany({ where: { equipe_id: equipeId, profile_id: membreId } });
    await tx.retraits_equipe_br.create({ data: { equipe_id: equipeId, membre_id: membreId, motif: motif.trim() } });
  });
}

export async function historiqueRetraitsJSON(equipeId: string): Promise<RetraitEquipeBRJSON[]> {
  const lignes = await prisma.retraits_equipe_br.findMany({ where: { equipe_id: equipeId }, orderBy: { created_at: "desc" } });
  const pseudos = await pseudosDepuisIds(lignes.map((l) => l.membre_id));
  return lignes.map((l) => ({ id: l.id, equipeId: l.equipe_id, membre: pseudos.get(l.membre_id) ?? "?", motif: l.motif, horodatage: l.created_at.getTime() }));
}

export async function marquerPaiementCouvert(equipeId: string): Promise<void> {
  await prisma.equipes_br.update({ where: { id: equipeId }, data: { paiement_couvert: true } });
}

const TAILLE_EQUIPE_BR: Record<"duo" | "trio" | "squad", number> = { duo: 2, trio: 3, squad: 4 };
const LABEL_EQUIPE_BR: Record<"duo" | "trio" | "squad", string> = { duo: "Duo", trio: "Trio", squad: "Squad" };

/** Répartition aléatoire : rejoint la première équipe non complète, sinon en
 * crée une nouvelle. Intégration immédiate (pas de file de validation). */
export async function rejoindreEquipeAleatoire(
  tournoiId: string,
  joueurId: string,
  sousType: "duo" | "trio" | "squad",
): Promise<EquipeBRJSON> {
  const taille = TAILLE_EQUIPE_BR[sousType];
  const equipeId = await prisma.$transaction(async (tx) => {
    // Verrouille toutes les équipes de ce tournoi le temps de la transaction :
    // sans ça, deux joueurs qui rejoignent en même temps une équipe à 1
    // place restante peuvent tous les deux passer le test "< taille" avant
    // que l'un des deux n'ait inséré son adhésion, et dépasser la taille
    // d'équipe (même classe de bug que la course d'inscription corrigée au
    // même moment, cf. /api/tournois/[id]/inscriptions).
    await tx.$queryRaw`SELECT id FROM equipes_br WHERE tournoi_id = ${tournoiId}::uuid FOR UPDATE`;
    const equipes = await tx.equipes_br.findMany({
      where: { tournoi_id: tournoiId },
      include: { equipes_br_membres: true },
      orderBy: { created_at: "asc" },
    });
    const disponible = equipes.find((e) => e.equipes_br_membres.length < taille && !e.equipes_br_membres.some((m) => m.profile_id === joueurId));
    if (disponible) {
      await tx.equipes_br_membres.upsert({
        where: { equipe_id_profile_id: { equipe_id: disponible.id, profile_id: joueurId } },
        create: { equipe_id: disponible.id, profile_id: joueurId },
        update: {},
      });
      return disponible.id;
    }
    const numero = equipes.length + 1;
    const equipe = await tx.equipes_br.create({
      data: { tournoi_id: tournoiId, nom: `${LABEL_EQUIPE_BR[sousType]} auto ${numero}`, chef_id: joueurId, paiement_couvert: false },
    });
    await tx.equipes_br_membres.create({ data: { equipe_id: equipe.id, profile_id: joueurId } });
    return equipe.id;
  });
  return (await equipeParIdJSON(equipeId))!;
}

/** Intègre directement des membres (déjà vetted par le chef en amont —
 * équipe pré-créée du profil) sans file de demandes. Pseudos inconnus
 * ignorés silencieusement (ne devrait pas arriver : ils viennent d'une
 * équipe profil déjà résolue en profile_id). */
export async function ajouterMembresDirect(equipeId: string, membresIds: string[]): Promise<void> {
  if (membresIds.length === 0) return;
  await prisma.equipes_br_membres.createMany({
    data: membresIds.map((profileId) => ({ equipe_id: equipeId, profile_id: profileId })),
    skipDuplicates: true,
  });
}

/** Point 140 : les équipes éphémères sont un repli propre au tournoi — une
 * fois celui-ci terminé, elles n'ont plus lieu de persister. */
export async function supprimerEquipesDuTournoi(tournoiId: string): Promise<void> {
  await prisma.equipes_br.deleteMany({ where: { tournoi_id: tournoiId } });
}
