import {
  Sword,
  Swords,
  Crosshair,
  Target,
  Skull,
  Shield,
  Flame,
  Zap,
  Trophy,
  Crown,
  Goal,
  Gamepad2,
  Joystick,
  Rocket,
  Bomb,
  Users,
  Medal,
  Award,
  Star,
  Timer,
  Radar,
  Dices,
  Car,
  Puzzle,
  Compass,
  Ghost,
  Radio,
  Music,
  Anchor,
  type LucideIcon,
} from "lucide-react";

/** Symboles esport/gaming proposés à la création d'un tournoi (point 144),
 * à la place d'un upload d'image libre — sélection visuelle parmi un jeu
 * d'icônes Lucide déjà utilisées dans le reste du projet, avec un nom clair
 * par symbole. Bibliothèque enrichie au point 175. */
export const SYMBOLES_TOURNOI: { id: string; label: string; icone: LucideIcon }[] = [
  { id: "epee", label: "Épée", icone: Sword },
  { id: "epees-croisees", label: "Épées croisées", icone: Swords },
  { id: "cible", label: "Cible", icone: Crosshair },
  { id: "visee", label: "Visée", icone: Target },
  { id: "crane", label: "Crâne", icone: Skull },
  { id: "bouclier", label: "Bouclier", icone: Shield },
  { id: "flamme", label: "Flamme", icone: Flame },
  { id: "eclair", label: "Éclair", icone: Zap },
  { id: "trophee", label: "Trophée", icone: Trophy },
  { id: "couronne", label: "Couronne", icone: Crown },
  { id: "but", label: "But", icone: Goal },
  { id: "manette", label: "Manette", icone: Gamepad2 },
  { id: "joystick", label: "Joystick", icone: Joystick },
  { id: "fusee", label: "Fusée", icone: Rocket },
  { id: "bombe", label: "Bombe", icone: Bomb },
  { id: "equipe", label: "Équipe", icone: Users },
  { id: "medaille", label: "Médaille", icone: Medal },
  { id: "recompense", label: "Récompense", icone: Award },
  { id: "etoile", label: "Étoile", icone: Star },
  { id: "chrono", label: "Chrono", icone: Timer },
  { id: "radar", label: "Radar", icone: Radar },
  { id: "des", label: "Dés", icone: Dices },
  { id: "course", label: "Course", icone: Car },
  { id: "puzzle", label: "Puzzle", icone: Puzzle },
  { id: "boussole", label: "Boussole", icone: Compass },
  { id: "fantome", label: "Fantôme", icone: Ghost },
  { id: "signal", label: "Signal", icone: Radio },
  { id: "rythme", label: "Rythme", icone: Music },
  { id: "ancre", label: "Ancre", icone: Anchor },
];

export const SYMBOLE_DEFAUT = "epees-croisees";

export function symboleParId(id: string | undefined): { id: string; label: string; icone: LucideIcon } {
  return SYMBOLES_TOURNOI.find((s) => s.id === id) ?? SYMBOLES_TOURNOI.find((s) => s.id === SYMBOLE_DEFAUT)!;
}
