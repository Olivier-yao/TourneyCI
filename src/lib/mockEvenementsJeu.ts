import type { GenreJeu } from "./mockTournaments";

/**
 * Textes d'événements prédéfinis pour le fil du match ("Gérer le match" côté
 * organisateur), repris à la lettre du design "Tourney v5 Écrans" (section H3
 * "Alimenter le fil") : trois catégories — combat, tir, sport — chacune avec
 * deux gabarits et son icône. Les cinq genres de jeu existants de l'app sont
 * ramenés à ces trois catégories (mappeGenre) plutôt que dupliqués.
 */
export type CategorieEvenement = "combat" | "tir" | "sport";

export const LABEL_CATEGORIE: Record<CategorieEvenement, string> = {
  combat: "Jeu de combat",
  tir: "Jeu de tir",
  sport: "Sport",
};

type GabaritEvenement = { icone: "ko" | "manche" | "elimine" | "terre" | "but" | "arret"; texte: string };

const GABARITS: Record<CategorieEvenement, GabaritEvenement[]> = {
  combat: [
    { icone: "ko", texte: "{A} K.O. {B}" },
    { icone: "manche", texte: "{A} remporte la manche face à {B}" },
  ],
  tir: [
    { icone: "elimine", texte: "{A} élimine {B}" },
    { icone: "terre", texte: "{A} met {B} à terre" },
  ],
  sport: [
    { icone: "but", texte: "But de {A} contre {B}" },
    { icone: "arret", texte: "{A} arrête la frappe de {B}" },
  ],
};

/** Ramène le genre de jeu (taxonomie existante de l'app) à l'une des trois
 * catégories d'événements du design v5 — pas de quatrième catégorie inventée. */
export function mappeGenre(genre: GenreJeu | undefined): CategorieEvenement {
  switch (genre) {
    case "Combat":
      return "combat";
    case "Sport":
      return "sport";
    case "FPS":
    case "Battle Royale":
    case "TPS":
      return "tir";
    default:
      return "combat";
  }
}

export function evenementsPredefinis(
  categorie: CategorieEvenement,
  acteur: string,
  cible: string,
): { id: number; icone: GabaritEvenement["icone"]; texte: string }[] {
  return GABARITS[categorie].map((g, id) => ({
    id,
    icone: g.icone,
    texte: g.texte.split("{A}").join(acteur).split("{B}").join(cible),
  }));
}
