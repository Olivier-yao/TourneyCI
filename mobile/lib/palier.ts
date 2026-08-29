/** Port de src/lib/mockProfil.ts (PALIERS, palierActuel) — mêmes seuils,
 * même dérivation. points_cumules est un total à vie (jamais remis à
 * zéro), différent des points de classement (scope saison en cours). */
export type Rang = "Débutant" | "Amateur" | "Confirmé" | "Expert" | "Élite" | "Légende";
export type DefinitionPalier = { id: number; nom: Rang; matchsRequis: number; pointsRequis: number };

export const PALIERS: DefinitionPalier[] = [
  { id: 0, nom: "Débutant", matchsRequis: 0, pointsRequis: 0 },
  { id: 1, nom: "Amateur", matchsRequis: 10, pointsRequis: 120 },
  { id: 2, nom: "Confirmé", matchsRequis: 30, pointsRequis: 450 },
  { id: 3, nom: "Expert", matchsRequis: 55, pointsRequis: 900 },
  { id: 4, nom: "Élite", matchsRequis: 80, pointsRequis: 1500 },
  { id: 5, nom: "Légende", matchsRequis: 120, pointsRequis: 2500 },
];

/** Dernier palier pour lequel matchs ET points requis sont atteints. */
export function palierActuel(matchsJoues: number, pointsCumules: number): DefinitionPalier {
  let actuel = PALIERS[0];
  for (const p of PALIERS) {
    if (matchsJoues >= p.matchsRequis && pointsCumules >= p.pointsRequis) actuel = p;
  }
  return actuel;
}

/** Approximation par points seuls (nombre de matchs des autres joueurs
 * inconnu côté classement) — même repli que Classement.tsx côté web. */
export function palierParPoints(pointsCumules: number): DefinitionPalier {
  let actuel = PALIERS[0];
  for (const p of PALIERS) {
    if (pointsCumules >= p.pointsRequis) actuel = p;
  }
  return actuel;
}

export const SEUIL_MATCHS_ACTIF = 15;
export function estActif(matchsJoues: number): boolean {
  return matchsJoues >= SEUIL_MATCHS_ACTIF;
}
