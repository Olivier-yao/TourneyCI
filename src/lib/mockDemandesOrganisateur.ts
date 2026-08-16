/**
 * Demande de statut organisateur certifié (points 146, 158) : distincte de
 * la vérification d'identité (CNI + selfie, points 41/49) — un organisateur
 * "standard" peut créer des tournois gratuits dès qu'il a choisi un nom
 * (point 167), sans cette demande. Elle ne sert qu'à devenir organisateur
 * certifié (identité vérifiée + demande validée, point 158), ce qui débloque
 * les tournois payants. Mono-compte comme le reste des demandes de ce mock
 * (une seule à la fois).
 */

import { VALIDATION_AUTOMATIQUE_ACTIVE } from "./mockValidationAuto";
import { analyserDemandeOrganisateur, type AnalyseDemandeOrganisateur } from "./mockAnalyseAutomatique";
import { ajouterNotification } from "./mockNotifications";

export type StatutDemandeOrganisateur = "en_attente" | "validee" | "refusee";

export type DemandeOrganisateur = {
  id: string;
  nomOrganisateur: string;
  /** Motivation du candidat (point 162), visible par l'administration. */
  motivation: string;
  /** Identité vérifiée (CNI, points 41/49) au moment de la demande — affiché à l'administration. */
  identiteVerifiee: boolean;
  /** Résultat de l'analyse automatique (point 170), affiché à l'administration sur les demandes en attente. */
  analyseAutomatique: AnalyseDemandeOrganisateur;
  statut: StatutDemandeOrganisateur;
  /** Motif du refus ou note de validation, visible par le demandeur (point 160). */
  messageAdmin?: string;
  horodatage: number;
};

const CLE_DEMANDES_ORGANISATEUR = "tourney-demandes-organisateur";

function lireTout(): DemandeOrganisateur[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_DEMANDES_ORGANISATEUR);
    return brut ? (JSON.parse(brut) as DemandeOrganisateur[]) : [];
  } catch {
    return [];
  }
}

/** Dernière demande de l'organisateur de cet appareil (mock mono-compte). */
export function demandeOrganisateurActuelle(): DemandeOrganisateur | undefined {
  const tout = lireTout();
  return tout.length > 0 ? tout[tout.length - 1] : undefined;
}

export function estOrganisateurApprouve(): boolean {
  return demandeOrganisateurActuelle()?.statut === "validee";
}

export function creerDemandeOrganisateur(
  nomOrganisateur: string,
  motivation: string,
  identiteVerifiee: boolean,
): DemandeOrganisateur | null {
  if (typeof window === "undefined" || !nomOrganisateur.trim() || !motivation.trim()) return null;
  const existante = demandeOrganisateurActuelle();
  if (existante?.statut === "en_attente" || existante?.statut === "validee") return existante;
  const analyse = analyserDemandeOrganisateur(motivation, identiteVerifiee);
  const validationAuto = VALIDATION_AUTOMATIQUE_ACTIVE && analyse.pertinente;
  const demande: DemandeOrganisateur = {
    id: `orga-${Date.now().toString(36)}`,
    nomOrganisateur: nomOrganisateur.trim(),
    motivation: motivation.trim(),
    identiteVerifiee,
    analyseAutomatique: analyse,
    statut: validationAuto ? "validee" : "en_attente",
    messageAdmin: validationAuto
      ? "Validation automatique après analyse : demande jugée pertinente pour la plateforme."
      : undefined,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_DEMANDES_ORGANISATEUR, JSON.stringify([...lireTout(), demande]));
  return demande;
}

export function demandesOrganisateurEnAttente(): DemandeOrganisateur[] {
  return lireTout()
    .filter((d) => d.statut === "en_attente")
    .sort((a, b) => a.horodatage - b.horodatage);
}

export function traiterDemandeOrganisateur(id: string, statut: "validee" | "refusee", messageAdmin?: string) {
  if (typeof window === "undefined") return;
  const motif = messageAdmin?.trim() || undefined;
  const maj = lireTout().map((d) => (d.id === id ? { ...d, statut, messageAdmin: motif } : d));
  localStorage.setItem(CLE_DEMANDES_ORGANISATEUR, JSON.stringify(maj));
  // Point 189 : notifier le candidat de la décision — motif du refus tel que
  // saisi par l'administration, ou message de bienvenue détaillant ce que
  // débloque la certification (règlement dédié, point 159).
  if (statut === "refusee") {
    ajouterNotification(
      motif
        ? `Ta demande d'organisateur certifié a été refusée — motif : ${motif}`
        : "Ta demande d'organisateur certifié a été refusée. Tu peux en envoyer une nouvelle si ta situation a changé.",
    );
  } else {
    ajouterNotification(
      "Bienvenue parmi les organisateurs certifiés ! Tu peux désormais créer des tournois payants et percevoir ta commission. En échange, tu t'engages à reverser intégralement le cash prize, garder tes annonces exactes et arbitrer tes litiges avec impartialité — le détail t'attend dans le règlement dédié avant ta prochaine création.",
    );
  }
}
