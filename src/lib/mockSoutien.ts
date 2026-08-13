/**
 * "Soutenir l'organisateur" (point 64) : signal distinct du système de
 * cœur/cœur brisé (mockAvis.ts) — vocabulaire et modèle de données séparés
 * à dessein, aucun lien avec la réputation "équitable/problème". Un seul
 * soutien par organisateur et par appareil (mock mono-utilisateur).
 */

export type Soutien = {
  id: string;
  organisateur: string;
  tournoiId: string;
  horodatage: number;
};

const CLE_SOUTIENS = "tourney-soutiens-organisateur";

function lireTout(): Soutien[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_SOUTIENS);
    return brut ? (JSON.parse(brut) as Soutien[]) : [];
  } catch {
    return [];
  }
}

export function soutiensDeOrganisateur(organisateur: string): Soutien[] {
  return lireTout().filter((s) => s.organisateur === organisateur);
}

export function monSoutienPourOrganisateur(organisateur: string): Soutien | undefined {
  return lireTout().find((s) => s.organisateur === organisateur);
}

export function soutenirOrganisateur(organisateur: string, tournoiId: string) {
  if (typeof window === "undefined") return;
  if (monSoutienPourOrganisateur(organisateur)) return;
  const soutien: Soutien = {
    id: `soutien-${Date.now().toString(36)}`,
    organisateur,
    tournoiId,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_SOUTIENS, JSON.stringify([...lireTout(), soutien]));
}
