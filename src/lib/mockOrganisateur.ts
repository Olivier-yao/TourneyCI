/**
 * Certification organisateur (mock) : tant que l'organisateur n'a pas
 * complété la vérification d'âge + document officiel, il ne touche pas la
 * commission de 5 % sur ses tournois payants (elle reste calculée pour
 * information mais n'est jamais créditée).
 */

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
  localStorage.setItem(CLE_DEMANDE, JSON.stringify(demande));
  localStorage.setItem(CLE_CERTIFICATION, "1");
  return true;
}
