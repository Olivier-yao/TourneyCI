/**
 * Modération anti-triche des organisateurs (bannissement, suspension, liste
 * noire des pièces d'identité) — entièrement server-side, gating réel sur la
 * création de tournois payants. Remplace l'ancien système (mockOrganisateur.ts
 * confirmerTricheEtBannir/leverSuspension/listeNoire) qui vivait uniquement en
 * localStorage : un bannissement écrit sur l'appareil de l'admin n'était
 * jamais visible depuis celui de l'organisateur banni, et rien ne l'appliquait
 * réellement à la création de tournoi (contournable en appelant l'API
 * directement).
 *
 * organisateur_profils.statut_moderation reste une colonne `text` avec un
 * CHECK ('actif'|'suspendu'|'banni') plutôt qu'un vrai enum Postgres — la
 * contrainte existait déjà (migration v2_identite_organisateurs), pas besoin
 * d'une migration de type supplémentaire pour ce chantier.
 */

import { prisma } from "@/lib/prisma";

export type StatutModeration = "actif" | "suspendu" | "banni";

export const SEUIL_COEURS_BRISES_SUSPENSION = 3;

export type OrganisateurModerationJSON = {
  profileId: string;
  nom: string;
  coeurs: number;
  coeursBrises: number;
  statut: StatutModeration;
  motif?: string;
  moderationLe?: number;
};

async function reputationDepuis(profileId: string, depuis?: Date): Promise<{ coeurs: number; coeursBrises: number }> {
  const filtreDate = depuis ? { created_at: { gt: depuis } } : {};
  const [tCoeurs, tBrises, gCoeurs, gBrises] = await Promise.all([
    prisma.avis_tournoi.count({ where: { type: "coeur", tournois: { organisateur_id: profileId }, ...filtreDate } }),
    prisma.avis_tournoi.count({ where: { type: "coeur_brise", tournois: { organisateur_id: profileId }, ...filtreDate } }),
    prisma.avis_organisateur.count({ where: { type: "coeur", organisateur_id: profileId, ...filtreDate } }),
    prisma.avis_organisateur.count({ where: { type: "coeur_brise", organisateur_id: profileId, ...filtreDate } }),
  ]);
  return { coeurs: tCoeurs + gCoeurs, coeursBrises: tBrises + gBrises };
}

async function versJSON(profileId: string, nom: string, statut: string, motif: string | null, moderationLe: Date | null): Promise<OrganisateurModerationJSON> {
  // Le compte de cœurs brisés utilisé pour la fiche affichée à l'admin reste
  // le total (toute l'historique) — seule l'auto-escalade ci-dessous se base
  // sur "depuis la dernière décision admin", pour ne pas re-suspendre
  // indéfiniment quelqu'un dont la suspension vient d'être levée sur les
  // mêmes cœurs brisés déjà examinés.
  const { coeurs, coeursBrises } = await reputationDepuis(profileId);
  return {
    profileId,
    nom,
    coeurs,
    coeursBrises,
    statut: statut as StatutModeration,
    motif: motif ?? undefined,
    moderationLe: moderationLe?.getTime(),
  };
}

/** Recherche un organisateur par son nom d'organisateur OU son pseudo joueur
 * (un organisateur qui n'a jamais choisi de nom d'organisateur reste
 * identifié par son pseudo ailleurs dans l'app — cf. versTournoiJSON). */
export async function rechercherOrganisateurs(requete: string): Promise<OrganisateurModerationJSON[]> {
  const q = requete.trim();
  if (!q) return [];
  const profils = await prisma.profiles.findMany({
    where: {
      OR: [
        { pseudo: { contains: q, mode: "insensitive" } },
        { organisateur_profils: { nom_organisateur: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { organisateur_profils: true },
    take: 15,
  });
  return Promise.all(
    profils.map((p) =>
      versJSON(
        p.id,
        p.organisateur_profils?.nom_organisateur ?? p.pseudo,
        p.organisateur_profils?.statut_moderation ?? "actif",
        p.organisateur_profils?.moderation_motif ?? null,
        p.organisateur_profils?.moderation_le ?? null,
      ),
    ),
  );
}

/** File de modération : organisateurs "suspendu" en attente d'une décision
 * (lever ou bannir), y compris ceux tout juste basculés par cette fonction
 * elle-même — un organisateur "actif" dont le cumul de cœurs brisés depuis
 * la dernière décision admin franchit le seuil est suspendu ici, au moment
 * où l'admin consulte la file (pas d'attente qu'il tente lui-même de créer
 * un tournoi payant pour que ça se déclenche, cf. peutCreerTournoiPayant). */
export async function organisateursSignales(): Promise<OrganisateurModerationJSON[]> {
  const actifs = await prisma.organisateur_profils.findMany({
    where: { statut_moderation: "actif" },
    include: { profiles: true },
  });
  for (const profil of actifs) {
    const { coeursBrises } = await reputationDepuis(profil.profile_id, profil.moderation_le ?? undefined);
    if (coeursBrises >= SEUIL_COEURS_BRISES_SUSPENSION) {
      await prisma.organisateur_profils.updateMany({
        where: { profile_id: profil.profile_id, statut_moderation: "actif" },
        data: {
          statut_moderation: "suspendu",
          moderation_motif: `Suspension automatique : seuil de ${SEUIL_COEURS_BRISES_SUSPENSION} cœurs brisés atteint.`,
          moderation_le: new Date(),
        },
      });
    }
  }

  const suspendus = await prisma.organisateur_profils.findMany({
    where: { statut_moderation: "suspendu" },
    include: { profiles: true },
    orderBy: { moderation_le: "asc" },
  });
  return Promise.all(
    suspendus.map((p) => versJSON(p.profile_id, p.nom_organisateur ?? p.profiles.pseudo, p.statut_moderation, p.moderation_motif, p.moderation_le)),
  );
}

/** Vrai gate serveur : peut cet organisateur créer/gérer un tournoi payant
 * maintenant ? Réévalue et persiste l'auto-suspension au passage si le seuil
 * de cœurs brisés (depuis la dernière décision admin) vient d'être franchi —
 * c'est le seul endroit où l'auto-escalade écrit réellement en base, pour ne
 * pas transformer une simple lecture de statut en écriture surprise ailleurs
 * dans l'app. */
export async function peutCreerTournoiPayant(profileId: string): Promise<boolean> {
  const profil = await prisma.organisateur_profils.findUnique({ where: { profile_id: profileId } });
  const statutActuel = (profil?.statut_moderation as StatutModeration | undefined) ?? "actif";
  if (statutActuel !== "actif") return false;

  const { coeursBrises } = await reputationDepuis(profileId, profil?.moderation_le ?? undefined);
  if (coeursBrises < SEUIL_COEURS_BRISES_SUSPENSION) return true;

  await prisma.organisateur_profils.updateMany({
    where: { profile_id: profileId, statut_moderation: "actif" },
    data: {
      statut_moderation: "suspendu",
      moderation_motif: `Suspension automatique : seuil de ${SEUIL_COEURS_BRISES_SUSPENSION} cœurs brisés atteint.`,
      moderation_le: new Date(),
    },
  });
  return false;
}

/** Bannit un organisateur (triche confirmée) et met sa pièce d'identité la
 * plus récente en liste noire, si une vérification KYC en a fourni le hash —
 * empêche la même pièce de servir à une nouvelle certification sous un autre
 * compte. Silencieux si aucun hash n'existe encore (KYC pas encore réel côté
 * app, cf. la suite de ce chantier). */
export async function bannirOrganisateur(profileId: string, motif: string): Promise<void> {
  await prisma.organisateur_profils.upsert({
    where: { profile_id: profileId },
    create: { profile_id: profileId, statut_moderation: "banni", moderation_motif: motif, moderation_le: new Date() },
    update: { statut_moderation: "banni", moderation_motif: motif, moderation_le: new Date() },
  });

  const derniereVerif = await prisma.kyc_verifications.findFirst({
    where: { profile_id: profileId, document_hash: { not: null } },
    orderBy: { created_at: "desc" },
  });
  if (derniereVerif?.document_hash) {
    await prisma.liste_noire_documents.upsert({
      where: { document_hash: derniereVerif.document_hash },
      create: { document_hash: derniereVerif.document_hash, motif },
      update: { motif },
    });
  }
}

/** Lève une suspension (vérification effectuée, rien à reprocher) — remet le
 * compte "actif". moderation_le est mis à jour : l'auto-escalade ci-dessus ne
 * recomptera les cœurs brisés qu'à partir de maintenant, pas depuis toujours,
 * pour ne pas re-suspendre instantanément sur les mêmes signalements déjà
 * examinés. */
export async function leverSuspensionOrganisateur(profileId: string): Promise<void> {
  await prisma.organisateur_profils.update({
    where: { profile_id: profileId },
    data: { statut_moderation: "actif", moderation_motif: "Vérification effectuée, suspension levée.", moderation_le: new Date() },
  });
}

export async function documentEstListeNoire(documentHash: string): Promise<boolean> {
  const entree = await prisma.liste_noire_documents.findUnique({ where: { document_hash: documentHash } });
  return Boolean(entree);
}

export async function listeNoireDocuments(): Promise<{ documentHash: string; motif: string; horodatage: number }[]> {
  const lignes = await prisma.liste_noire_documents.findMany({ orderBy: { created_at: "desc" } });
  return lignes.map((l) => ({ documentHash: l.document_hash, motif: l.motif, horodatage: l.created_at.getTime() }));
}
