/**
 * Équipes (duo/squad) pour l'inscription à un tournoi Battle Royale : création
 * par un chef, liste des équipes existantes à rejoindre, répartition
 * aléatoire, lien d'invitation, paiement groupé par le chef, et validation
 * des demandes d'adhésion (avec historique des retraits motivés).
 *
 * Mock mono-appareil comme le reste de l'app : la file d'attente de demandes
 * et les retraits ne sont visibles que depuis l'appareil qui les consulte,
 * pas synchronisés entre plusieurs téléphones (pas de backend).
 */

import type { SousTypeBR } from "./mockBattleRoyale";

export type EquipeBR = {
  id: string;
  tournoiId: string;
  nom: string;
  chef: string;
  membres: string[];
  /** Le chef a réglé les frais d'inscription pour toute l'équipe : les
   * membres qui rejoignent ensuite n'ont rien à payer. */
  paiementCouvert: boolean;
  creeLe: number;
};

export type DemandeEquipeBR = {
  id: string;
  equipeId: string;
  demandeur: string;
  horodatage: number;
};

export type RetraitEquipeBR = {
  id: string;
  equipeId: string;
  membre: string;
  motif: string;
  horodatage: number;
};

/** Taille cible d'une équipe selon le sous-type Battle Royale. */
export const TAILLE_EQUIPE_BR: Record<Exclude<SousTypeBR, "solo">, number> = {
  duo: 2,
  squad: 4,
};

const CLE_EQUIPES = "tourney-equipes-br";
const CLE_DEMANDES = "tourney-demandes-equipe-br";
const CLE_RETRAITS = "tourney-retraits-equipe-br";

function lire<T>(cle: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T[]) : [];
  } catch {
    return [];
  }
}

function ecrire<T>(cle: string, valeurs: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cle, JSON.stringify(valeurs));
}

export function equipesDuTournoi(tournoiId: string): EquipeBR[] {
  return lire<EquipeBR>(CLE_EQUIPES).filter((e) => e.tournoiId === tournoiId);
}

export function equipeParId(equipeId: string): EquipeBR | undefined {
  return lire<EquipeBR>(CLE_EQUIPES).find((e) => e.id === equipeId);
}

/** Équipe dont ce joueur est déjà membre pour ce tournoi (s'il y en a une). */
export function equipeDeJoueur(tournoiId: string, nom: string): EquipeBR | undefined {
  return equipesDuTournoi(tournoiId).find((e) => e.membres.includes(nom));
}

/** Toutes les équipes (tous tournois confondus) dont ce joueur est membre. */
export function equipesDuJoueur(nom: string): EquipeBR[] {
  return lire<EquipeBR>(CLE_EQUIPES).filter((e) => e.membres.includes(nom));
}

export function creerEquipeBR(tournoiId: string, nom: string, chef: string, paiementCouvert: boolean): EquipeBR {
  const equipe: EquipeBR = {
    id: `eqbr-${Date.now().toString(36)}`,
    tournoiId,
    nom,
    chef,
    membres: [chef],
    paiementCouvert,
    creeLe: Date.now(),
  };
  ecrire(CLE_EQUIPES, [...lire<EquipeBR>(CLE_EQUIPES), equipe]);
  return equipe;
}

function majEquipe(equipeId: string, fn: (e: EquipeBR) => EquipeBR) {
  ecrire(
    CLE_EQUIPES,
    lire<EquipeBR>(CLE_EQUIPES).map((e) => (e.id === equipeId ? fn(e) : e)),
  );
}

export function demandesEnAttente(equipeId: string): DemandeEquipeBR[] {
  return lire<DemandeEquipeBR>(CLE_DEMANDES).filter((d) => d.equipeId === equipeId);
}

function demandesDuJoueur(equipeId: string, demandeur: string): DemandeEquipeBR | undefined {
  return demandesEnAttente(equipeId).find((d) => d.demandeur === demandeur);
}

/** Envoie une demande pour rejoindre une équipe (pas d'effet si déjà membre
 * ou déjà en attente). */
export function demanderRejoindre(equipeId: string, demandeur: string): DemandeEquipeBR | undefined {
  const equipe = equipeParId(equipeId);
  if (!equipe || equipe.membres.includes(demandeur) || demandesDuJoueur(equipeId, demandeur)) return undefined;
  const demande: DemandeEquipeBR = {
    id: `demeqbr-${Date.now().toString(36)}`,
    equipeId,
    demandeur,
    horodatage: Date.now(),
  };
  ecrire(CLE_DEMANDES, [...lire<DemandeEquipeBR>(CLE_DEMANDES), demande]);
  return demande;
}

export function aUneDemandeEnAttente(equipeId: string, demandeur: string): boolean {
  return Boolean(demandesDuJoueur(equipeId, demandeur));
}

function retirerDemande(demandeId: string) {
  ecrire(CLE_DEMANDES, lire<DemandeEquipeBR>(CLE_DEMANDES).filter((d) => d.id !== demandeId));
}

export function approuverDemande(demandeId: string) {
  const demande = lire<DemandeEquipeBR>(CLE_DEMANDES).find((d) => d.id === demandeId);
  if (!demande) return;
  majEquipe(demande.equipeId, (e) => (e.membres.includes(demande.demandeur) ? e : { ...e, membres: [...e.membres, demande.demandeur] }));
  retirerDemande(demandeId);
}

export function refuserDemande(demandeId: string) {
  retirerDemande(demandeId);
}

/** Retire un membre déjà intégré (motif obligatoire, conservé à l'historique). */
export function retirerMembre(equipeId: string, membre: string, motif: string) {
  if (!motif.trim()) return;
  majEquipe(equipeId, (e) => ({ ...e, membres: e.membres.filter((m) => m !== membre) }));
  const retrait: RetraitEquipeBR = {
    id: `reteqbr-${Date.now().toString(36)}`,
    equipeId,
    membre,
    motif: motif.trim(),
    horodatage: Date.now(),
  };
  ecrire(CLE_RETRAITS, [...lire<RetraitEquipeBR>(CLE_RETRAITS), retrait]);
}

export function historiqueRetraits(equipeId: string): RetraitEquipeBR[] {
  return lire<RetraitEquipeBR>(CLE_RETRAITS)
    .filter((r) => r.equipeId === equipeId)
    .sort((a, b) => b.horodatage - a.horodatage);
}

/** Bascule l'équipe en "frais couverts" une fois le paiement du chef confirmé
 * (appelé après succès du paiement, pas à la création — un paiement en échec
 * ne doit pas laisser croire aux futurs membres que c'est déjà réglé). */
export function marquerPaiementCouvert(equipeId: string) {
  majEquipe(equipeId, (e) => ({ ...e, paiementCouvert: true }));
}

/** Répartition aléatoire : rejoint la première équipe non complète, sinon en
 * crée une nouvelle. Intégration immédiate, sans passer par la file de
 * validation (c'est l'app qui choisit, pas une demande à approuver). */
export function rejoindreEquipeAleatoire(tournoiId: string, joueur: string, sousType: Exclude<SousTypeBR, "solo">): EquipeBR {
  const taille = TAILLE_EQUIPE_BR[sousType];
  const equipes = equipesDuTournoi(tournoiId);
  const disponible = equipes.find((e) => e.membres.length < taille);
  if (disponible) {
    majEquipe(disponible.id, (e) => ({ ...e, membres: [...e.membres, joueur] }));
    return { ...disponible, membres: [...disponible.membres, joueur] };
  }
  const numero = equipes.length + 1;
  const prefixe = sousType === "duo" ? "Duo" : "Squad";
  return creerEquipeBR(tournoiId, `${prefixe} auto ${numero}`, joueur, false);
}

/** Fragment de requête à ajouter au lien du tournoi pour pré-sélectionner
 * cette équipe dans le flux d'inscription (invitation à rejoindre). */
export function lienInvitation(tournoiId: string, equipeId: string): string {
  const origine = typeof window !== "undefined" ? window.location.origin : "";
  return `${origine}/tournois/${tournoiId}?equipe=${equipeId}`;
}
