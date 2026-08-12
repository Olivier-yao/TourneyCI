/**
 * Certification organisateur (mock) : tant que l'organisateur n'a pas
 * complété la vérification d'âge + document officiel, il ne touche pas la
 * commission de 5 % sur ses tournois payants (elle reste calculée pour
 * information mais n'est jamais créditée).
 */

import { avisDeOrganisateur } from "./mockAvis";

export type DemandeCertification = {
  ageConfirme: boolean;
  documentNom: string;
  soumisLe: string;
};

const CLE_CERTIFICATION = "tourney-organisateur-certifie";
const CLE_DEMANDE = "tourney-organisateur-demande";

export function estCertifie(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLE_CERTIFICATION) === "1";
}

export function demandeCertification(): DemandeCertification | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_DEMANDE);
    return brut ? (JSON.parse(brut) as DemandeCertification) : null;
  } catch {
    return null;
  }
}

/** Soumission mock : dès qu'un document est fourni et l'âge confirmé, on
 * considère la vérification instantanément validée (pas de vrai back-office
 * de modération dans ce mock). */
export function soumettreCertification(ageConfirme: boolean, documentNom: string): boolean {
  if (typeof window === "undefined" || !ageConfirme || !documentNom.trim()) return false;
  const demande: DemandeCertification = {
    ageConfirme,
    documentNom: documentNom.trim(),
    soumisLe: new Date().toLocaleDateString("fr-FR"),
  };
  if (documentEnListeNoire(documentNom)) return false;
  localStorage.setItem(CLE_DEMANDE, JSON.stringify(demande));
  localStorage.setItem(CLE_CERTIFICATION, "1");
  return true;
}

/**
 * Réputation & modération anti-triche (mock) — basée sur les avis
 * cœur/cœur brisé laissés en fin de tournoi (cf. mockAvis). Un organisateur
 * qui accumule trop de cœurs brisés voit sa capacité à créer des tournois
 * payants suspendue le temps d'une vérification. En cas de triche confirmée,
 * le compte est banni et sa pièce d'identité mise en liste noire pour
 * empêcher une nouvelle certification (la vérification faciale n'est pas
 * encore implémentée, mais la structure de données est prête pour l'accueillir).
 */
export const SEUIL_COEURS_BRISES_SUSPENSION = 3;

export function statistiquesReputation(organisateur: string): { coeurs: number; coeursBrises: number } {
  const avis = avisDeOrganisateur(organisateur);
  return {
    coeurs: avis.filter((a) => a.type === "coeur").length,
    coeursBrises: avis.filter((a) => a.type === "coeur_brise").length,
  };
}

export type StatutModeration = "actif" | "suspendu" | "banni";

const CLE_SUSPENDU = "tourney-organisateur-suspendu-leve";
const CLE_BANNI = "tourney-organisateur-banni";
const CLE_LISTE_NOIRE = "tourney-liste-noire";

export type EntreeListeNoire = {
  documentNom: string;
  /** Réservé à la vérification faciale future (non implémentée). */
  visageHash?: string;
  motif: string;
  horodatage: number;
};

/** Statut de modération de l'organisateur de cet appareil (mock mono-compte). */
export function statutModeration(organisateur: string): StatutModeration {
  if (typeof window === "undefined") return "actif";
  if (localStorage.getItem(CLE_BANNI) === "1") return "banni";
  const leve = localStorage.getItem(CLE_SUSPENDU) === "1";
  if (!leve && statistiquesReputation(organisateur).coeursBrises >= SEUIL_COEURS_BRISES_SUSPENSION) return "suspendu";
  return "actif";
}

export function peutCreerTournoiPayant(organisateur: string): boolean {
  return statutModeration(organisateur) === "actif";
}

function lireListeNoire(): EntreeListeNoire[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_LISTE_NOIRE);
    return brut ? (JSON.parse(brut) as EntreeListeNoire[]) : [];
  } catch {
    return [];
  }
}

export function listeNoire(): EntreeListeNoire[] {
  return lireListeNoire();
}

export function documentEnListeNoire(documentNom: string): boolean {
  const cible = documentNom.trim().toLowerCase();
  return lireListeNoire().some((e) => e.documentNom.trim().toLowerCase() === cible);
}

function ajouterListeNoire(documentNom: string, motif: string) {
  if (typeof window === "undefined" || !documentNom.trim()) return;
  localStorage.setItem(
    CLE_LISTE_NOIRE,
    JSON.stringify([...lireListeNoire(), { documentNom: documentNom.trim(), motif, horodatage: Date.now() }]),
  );
}

/** Action admin : triche confirmée après vérification → bannissement +
 * liste noire de la pièce d'identité fournie à la certification. */
export function confirmerTricheEtBannir(organisateur: string) {
  if (typeof window === "undefined") return;
  const demande = demandeCertification();
  localStorage.setItem(CLE_BANNI, "1");
  if (demande?.documentNom) {
    ajouterListeNoire(demande.documentNom, `Triche confirmée sur les tournois de ${organisateur}`);
  }
}

/** Action admin : vérification terminée, rien à reprocher → suspension levée. */
export function leverSuspension() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_SUSPENDU, "1");
}
