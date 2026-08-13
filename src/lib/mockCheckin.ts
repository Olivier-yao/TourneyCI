/**
 * "Check-in" (validation de présence) des inscrits par l'organisateur, juste
 * avant le début du tournoi. Un nom (ou TAG/équipe affiché dans la liste des
 * inscrits) est soit "présent", soit "en attente" — pas de vrai roster
 * multi-appareils dans ce mock, juste un overlay local par tournoi.
 */

type CheckinMap = Record<string, string[]>;

const CLE_CHECKIN = "tourney-checkin";

function lireTout(): CheckinMap {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_CHECKIN);
    return brut ? (JSON.parse(brut) as CheckinMap) : {};
  } catch {
    return {};
  }
}

export function presentsDuTournoi(tournoiId: string): string[] {
  return lireTout()[tournoiId] ?? [];
}

export function estPresent(tournoiId: string, nom: string): boolean {
  return presentsDuTournoi(tournoiId).includes(nom);
}

export function definirPresence(tournoiId: string, nom: string, present: boolean) {
  if (typeof window === "undefined") return;
  const tout = lireTout();
  const liste = tout[tournoiId] ?? [];
  const maj = present ? Array.from(new Set([...liste, nom])) : liste.filter((n) => n !== nom);
  localStorage.setItem(CLE_CHECKIN, JSON.stringify({ ...tout, [tournoiId]: maj }));
}
