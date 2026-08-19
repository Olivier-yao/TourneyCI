/**
 * Proposition d'inscription à un tournoi par un membre non-chef d'une équipe
 * pré-créée (point 192) : seul le chef peut réellement finaliser
 * l'inscription/paiement d'une équipe pré-créée à un tournoi Battle Royale
 * (mockEquipesProfil, point 140) — un membre peut seulement proposer, le
 * chef doit ensuite valider depuis "Mes équipes" pour que l'inscription se
 * lance réellement (mockEquipesBR.creerEquipeBR + ajouterMembresDirect).
 */

import { ajouterNotification } from "./mockNotifications";

export type PropositionEquipe = {
  id: string;
  equipeProfilId: string;
  equipeNom: string;
  tournoiId: string;
  proposeur: string;
  chef: string;
  statut: "en_attente" | "validee" | "refusee";
  horodatage: number;
};

// Pas de cleCompte() : une proposition implique le proposeur ET le chef,
// deux comptes potentiellement différents qui doivent tous deux la voir.
const CLE = "tourney-propositions-equipe";

function lire(): PropositionEquipe[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as PropositionEquipe[]) : [];
  } catch {
    return [];
  }
}

function ecrire(valeurs: PropositionEquipe[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE, JSON.stringify(valeurs));
}

export function proposerInscriptionEquipe(
  equipeProfilId: string,
  equipeNom: string,
  tournoiId: string,
  proposeur: string,
  chef: string,
): PropositionEquipe | null {
  const existante = lire().find(
    (p) => p.equipeProfilId === equipeProfilId && p.tournoiId === tournoiId && p.statut === "en_attente",
  );
  if (existante) return existante;
  const proposition: PropositionEquipe = {
    id: `propeq-${Date.now().toString(36)}`,
    equipeProfilId,
    equipeNom,
    tournoiId,
    proposeur,
    chef,
    statut: "en_attente",
    horodatage: Date.now(),
  };
  ecrire([...lire(), proposition]);
  ajouterNotification(`${proposeur} propose d'inscrire l'équipe « ${equipeNom} » à ce tournoi — ta validation est requise.`, tournoiId);
  return proposition;
}

export function propositionsEnAttentePourChef(chef: string): PropositionEquipe[] {
  return lire()
    .filter((p) => p.chef === chef && p.statut === "en_attente")
    .sort((a, b) => b.horodatage - a.horodatage);
}

export function propositionEnAttentePourEquipe(equipeProfilId: string): PropositionEquipe | undefined {
  return lire().find((p) => p.equipeProfilId === equipeProfilId && p.statut === "en_attente");
}

/** Toutes les propositions en attente pour une équipe pré-créée (tous
 * tournois confondus) — utilisé côté chef dans "Mes équipes". */
export function propositionsEnAttentePourEquipe(equipeProfilId: string): PropositionEquipe[] {
  return lire()
    .filter((p) => p.equipeProfilId === equipeProfilId && p.statut === "en_attente")
    .sort((a, b) => b.horodatage - a.horodatage);
}

export function traiterPropositionEquipe(id: string, statut: "validee" | "refusee") {
  const proposition = lire().find((p) => p.id === id);
  ecrire(lire().map((p) => (p.id === id ? { ...p, statut } : p)));
  if (proposition && statut === "refusee") {
    ajouterNotification(`Ta proposition d'inscrire l'équipe « ${proposition.equipeNom} » a été refusée par le chef.`, proposition.tournoiId);
  }
}
