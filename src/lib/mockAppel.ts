/**
 * Appels des résultats d'un tournoi (mock) : un inscrit peut contester le
 * classement final, ce qui bloque le versement du cash prize (cf.
 * mockTournaments.reevaluerPaiementsEnAttente) le temps qu'un administrateur
 * tranche. Coexiste avec le séquestre "cœurs brisés" du point 24 — les deux
 * mécanismes retiennent le même paiement mais pour des raisons différentes.
 */

export type StatutAppel = "ouvert" | "valide" | "rejete";

export type Appel = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  auteur: string;
  motif: string;
  statut: StatutAppel;
  horodatage: number;
};

const CLE_APPELS = "tourney-appels";

function lireTout(): Appel[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_APPELS);
    return brut ? (JSON.parse(brut) as Appel[]) : [];
  } catch {
    return [];
  }
}

function ecrire(appels: Appel[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_APPELS, JSON.stringify(appels));
}

export function appelsDuTournoi(tournoiId: string): Appel[] {
  return lireTout().filter((a) => a.tournoiId === tournoiId);
}

export function tousLesAppelsOuverts(): Appel[] {
  return lireTout().filter((a) => a.statut === "ouvert");
}

export function monAppelPourTournoi(tournoiId: string): Appel | undefined {
  return lireTout().find((a) => a.tournoiId === tournoiId);
}

export function appelOuvertPourTournoi(tournoiId: string): boolean {
  return appelsDuTournoi(tournoiId).some((a) => a.statut === "ouvert");
}

export function creerAppel(tournoiId: string, tournoiTitre: string, auteur: string, motif: string) {
  if (typeof window === "undefined" || !motif.trim() || monAppelPourTournoi(tournoiId)) return;
  const appel: Appel = {
    id: `appel-${Date.now().toString(36)}`,
    tournoiId,
    tournoiTitre,
    auteur,
    motif: motif.trim(),
    statut: "ouvert",
    horodatage: Date.now(),
  };
  ecrire([...lireTout(), appel]);
}

export function traiterAppel(appelId: string, statut: "valide" | "rejete") {
  ecrire(lireTout().map((a) => (a.id === appelId ? { ...a, statut } : a)));
}
