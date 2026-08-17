import type { GenreJeu } from "./mockTournaments";

/**
 * Vocabulaire d'événements du fil du match ("Gérer le match" côté
 * organisateur), repris à la lettre du design "Tourney Fil Événements" :
 * quatre catégories — football, FPS/tir, combat, battle royale — chacune
 * avec son propre vocabulaire (31 événements au total) plutôt que les deux
 * gabarits génériques précédents. Chaque événement porte une icône et une
 * "nature" : les pénalités (cartons, hors-jeu, mise à terre...) sont
 * signalées différemment des événements qui font avancer le jeu.
 */
export type CategorieEvenement = "foot" | "fps" | "fight" | "br";

export type IconeEvenement =
  | "goal" | "flag" | "shield-check" | "target" | "square" | "crosshair" | "ban" | "hand"
  | "handshake" | "flag-triangle-right" | "bomb" | "cross" | "zap" | "arrow-down"
  | "swords" | "trophy" | "star" | "rotate-ccw"
  | "trending-up" | "package";

export type DefinitionEvenement = {
  id: string;
  label: string;
  icone: IconeEvenement;
  /** true = pénalité (rendue en rouge sourd), false = événement qui fait avancer le jeu (accent). */
  penalite: boolean;
  /** {A} = auteur, {B} = cible (facultative selon l'événement). */
  gabarit: string;
};

export const CATEGORIES: { id: CategorieEvenement; label: string; labelCourt: string; icone: IconeEvenement }[] = [
  { id: "foot", label: "Football", labelCourt: "Football", icone: "goal" },
  { id: "fps", label: "FPS · Tir", labelCourt: "Tir", icone: "crosshair" },
  { id: "fight", label: "Combat", labelCourt: "Combat", icone: "swords" },
  { id: "br", label: "Battle Royale", labelCourt: "Battle R.", icone: "trending-up" },
];

export const EVENEMENTS: Record<CategorieEvenement, DefinitionEvenement[]> = {
  foot: [
    { id: "goal", label: "But", icone: "goal", penalite: false, gabarit: "But de {A}" },
    { id: "corner", label: "Corner", icone: "flag", penalite: false, gabarit: "Corner obtenu par {A}" },
    { id: "tackle", label: "Interception", icone: "shield-check", penalite: false, gabarit: "Interception de {A}" },
    { id: "free", label: "Coup franc", icone: "target", penalite: false, gabarit: "Coup franc pour {A}" },
    { id: "yellow", label: "Carton jaune", icone: "square", penalite: true, gabarit: "Carton jaune · {A}" },
    { id: "red", label: "Carton rouge", icone: "square", penalite: true, gabarit: "Carton rouge · {A}" },
    { id: "pen", label: "Penalty", icone: "crosshair", penalite: false, gabarit: "Penalty accordé à {A}" },
    { id: "off", label: "Hors-jeu", icone: "ban", penalite: true, gabarit: "Hors-jeu signalé · {A}" },
    { id: "save", label: "Tir arrêté", icone: "hand", penalite: false, gabarit: "Tir arrêté · gardien de {A}" },
  ],
  fps: [
    { id: "kill", label: "Élimination", icone: "crosshair", penalite: false, gabarit: "{A} élimine {B}" },
    { id: "head", label: "Headshot", icone: "target", penalite: false, gabarit: "Headshot de {A} sur {B}" },
    { id: "assist", label: "Assist", icone: "handshake", penalite: false, gabarit: "Assist de {A}" },
    { id: "zone", label: "Capture de zone", icone: "flag-triangle-right", penalite: false, gabarit: "{A} capture la zone" },
    { id: "plant", label: "Bombe posée", icone: "bomb", penalite: false, gabarit: "{A} pose la bombe" },
    { id: "defuse", label: "Bombe désamorcée", icone: "shield-check", penalite: false, gabarit: "{A} désamorce la bombe" },
    { id: "revive", label: "Revive", icone: "cross", penalite: false, gabarit: "{A} relève un coéquipier" },
    { id: "clutch", label: "Clutch", icone: "zap", penalite: false, gabarit: "Clutch de {A} · dernier survivant, round gagné" },
    { id: "down", label: "Mis à terre", icone: "arrow-down", penalite: true, gabarit: "{A} met {B} à terre" },
  ],
  fight: [
    { id: "ko", label: "K.O.", icone: "swords", penalite: false, gabarit: "{A} K.O. {B}" },
    { id: "combo", label: "Combo", icone: "zap", penalite: false, gabarit: "Combo de {A} sur {B}" },
    { id: "round", label: "Manche remportée", icone: "trophy", penalite: false, gabarit: "{A} remporte la manche face à {B}" },
    { id: "perfect", label: "Perfect", icone: "star", penalite: false, gabarit: "Perfect de {A} · aucune touche encaissée" },
    { id: "counter", label: "Contre", icone: "rotate-ccw", penalite: false, gabarit: "{A} contre la reprise de {B}" },
  ],
  br: [
    { id: "kill", label: "Élimination", icone: "crosshair", penalite: false, gabarit: "{A} élimine un adversaire" },
    { id: "knock", label: "Knock", icone: "arrow-down", penalite: true, gabarit: "{A} met un adversaire à terre" },
    { id: "top", label: "Top 10 / Top 5", icone: "trending-up", penalite: false, gabarit: "{A} entre dans le top 5" },
    { id: "loot", label: "Ravitaillement", icone: "package", penalite: false, gabarit: "{A} récupère un ravitaillement" },
    { id: "zone", label: "Zone survécue", icone: "shield-check", penalite: false, gabarit: "{A} survit à la zone" },
  ],
};

/** Ramène le genre de jeu (taxonomie existante de l'app) à l'une des quatre
 * catégories d'événements — les tournois Battle Royale n'utilisent pas cet
 * écran (ils passent par les manches), la catégorie reste définie pour la
 * cohérence du vocabulaire. */
export function mappeGenre(genre: GenreJeu | undefined): CategorieEvenement {
  switch (genre) {
    case "Sport":
      return "foot";
    case "Combat":
      return "fight";
    case "Battle Royale":
      return "br";
    case "FPS":
    case "TPS":
    default:
      return "fps";
  }
}

export function texteEvenement(gabarit: string, acteur: string, cible: string): string {
  return gabarit.split("{A}").join(acteur).split("{B}").join(cible);
}
