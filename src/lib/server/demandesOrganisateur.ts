import { prisma } from "@/lib/prisma";
import type { Prisma, statut_demande } from "@/generated/prisma/client";
import { analyserDemandeOrganisateur, type AnalyseDemandeOrganisateur } from "@/lib/mockAnalyseAutomatique";
import { VALIDATION_AUTOMATIQUE_ACTIVE } from "@/lib/mockValidationAuto";

const includeProfil = {
  profiles_demandes_organisateur_profile_idToprofiles: { include: { organisateur_profils: true } },
} satisfies Prisma.demandes_organisateurInclude;

type DemandeRow = Prisma.demandes_organisateurGetPayload<{ include: typeof includeProfil }>;

export type DemandeOrganisateurJSON = {
  id: string;
  nomOrganisateur: string;
  motivation: string;
  identiteVerifiee: boolean;
  analyseAutomatique: AnalyseDemandeOrganisateur;
  statut: statut_demande;
  messageAdmin?: string;
  horodatage: number;
};

export function versDemandeOrganisateurJSON(d: DemandeRow): DemandeOrganisateurJSON {
  const profil = d.profiles_demandes_organisateur_profile_idToprofiles;
  return {
    id: d.id,
    nomOrganisateur: profil.organisateur_profils?.nom_organisateur ?? profil.pseudo,
    motivation: d.motivation,
    identiteVerifiee: d.identite_verifiee,
    analyseAutomatique: analyserDemandeOrganisateur(d.motivation, d.identite_verifiee),
    statut: d.statut,
    messageAdmin: d.message_admin ?? undefined,
    horodatage: d.created_at.getTime(),
  };
}

export async function demandeActuelleDe(profileId: string): Promise<DemandeOrganisateurJSON | undefined> {
  const derniere = await prisma.demandes_organisateur.findFirst({
    where: { profile_id: profileId },
    orderBy: { created_at: "desc" },
    include: includeProfil,
  });
  return derniere ? versDemandeOrganisateurJSON(derniere) : undefined;
}

/** Idempotent : une demande déjà en attente ou validée n'en recrée pas une
 * nouvelle (même comportement que le mock). */
export async function creerDemande(profileId: string, motivation: string, identiteVerifiee: boolean): Promise<DemandeOrganisateurJSON> {
  const existante = await demandeActuelleDe(profileId);
  if (existante?.statut === "en_attente" || existante?.statut === "validee") return existante;

  const analyse = analyserDemandeOrganisateur(motivation, identiteVerifiee);
  const validationAuto = VALIDATION_AUTOMATIQUE_ACTIVE && analyse.pertinente;
  const demande = await prisma.demandes_organisateur.create({
    data: {
      profile_id: profileId,
      motivation,
      identite_verifiee: identiteVerifiee,
      score_analyse: analyse.score,
      statut: validationAuto ? "validee" : "en_attente",
      message_admin: validationAuto ? "Validation automatique après analyse : demande jugée pertinente pour la plateforme." : undefined,
    },
    include: includeProfil,
  });
  return versDemandeOrganisateurJSON(demande);
}

export async function demandesEnAttente(): Promise<DemandeOrganisateurJSON[]> {
  const demandes = await prisma.demandes_organisateur.findMany({
    where: { statut: "en_attente" },
    orderBy: { created_at: "asc" },
    include: includeProfil,
  });
  return demandes.map(versDemandeOrganisateurJSON);
}

/** Traite une demande (accepte/refuse) et notifie le demandeur — même texte
 * qu'avant, mais désormais adressé directement au bon profile_id (l'admin
 * n'est pas un vrai compte : notifierParticipants/ajouterNotification,
 * conçus pour de l'auto-notification, ne conviennent pas ici). */
export async function traiterDemande(id: string, statut: "validee" | "refusee", messageAdmin?: string): Promise<DemandeOrganisateurJSON | undefined> {
  const existante = await prisma.demandes_organisateur.findUnique({ where: { id } });
  if (!existante) return undefined;

  const demande = await prisma.demandes_organisateur.update({
    where: { id },
    data: { statut, message_admin: messageAdmin },
    include: includeProfil,
  });

  const texte =
    statut === "refusee"
      ? messageAdmin
        ? `Ta demande d'organisateur certifié a été refusée — motif : ${messageAdmin}`
        : "Ta demande d'organisateur certifié a été refusée. Tu peux en envoyer une nouvelle si ta situation a changé."
      : "Bienvenue parmi les organisateurs certifiés ! Tu peux désormais créer des tournois payants et percevoir ta commission. En échange, tu t'engages à reverser intégralement le cash prize, garder tes annonces exactes et arbitrer tes litiges avec impartialité — le détail t'attend dans le règlement dédié avant ta prochaine création.";
  await prisma.notifications.create({ data: { destinataire_id: demande.profile_id, texte } });

  return versDemandeOrganisateurJSON(demande);
}
