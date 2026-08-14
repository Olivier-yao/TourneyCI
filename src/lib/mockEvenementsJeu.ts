import type { GenreJeu } from "./mockTournaments";

/**
 * Textes d'événements prédéfinis pour le fil du match ("Gérer le match" côté
 * organisateur, point 107), adaptés au genre du jeu plutôt qu'un seul
 * vocabulaire générique pour tous les tournois :
 * - FPS / Battle Royale : vocabulaire d'élimination
 * - TPS (MOBA mobile) : élimination + objectifs de carte
 * - Combat : K.O. et manches
 * - Sport : buts
 */
const GENERATEURS_PAR_GENRE: Record<GenreJeu, (acteur: string, cible: string) => string[]> = {
  FPS: (a, c) => [`${a} élimine ${c}`, `${a} remporte le round face à ${c}`, `${a} prend l'ascendant sur ${c}`],
  "Battle Royale": (a, c) => [`${a} élimine ${c}`, `${a} remporte le duel face à ${c}`, `${a} prend la tête de la partie`],
  TPS: (a, c) => [`${a} élimine ${c}`, `${a} détruit une tourelle`, `${a} prend l'avantage sur la ligne face à ${c}`],
  Combat: (a, c) => [`${a} K.O. ${c}`, `${a} remporte la manche face à ${c}`, `${a} égalise la série contre ${c}`],
  Sport: (a, c) => [`${a} but contre ${c}`, `${a} égalise face à ${c}`, `${a} prend l'avantage sur ${c}`],
};

const TEXTES_GENERIQUES = (a: string, c: string) => [
  `${a} prend l'avantage face à ${c}`,
  `${a} marque un point contre ${c}`,
  `${a} égalise face à ${c}`,
];

export function textesEvenementsPredefinis(genre: GenreJeu | undefined, acteur: string, cible: string): string[] {
  const generateur = genre ? GENERATEURS_PAR_GENRE[genre] : undefined;
  return (generateur ?? TEXTES_GENERIQUES)(acteur, cible);
}
