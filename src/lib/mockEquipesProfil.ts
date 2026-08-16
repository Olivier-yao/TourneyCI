/**
 * Équipes pré-créées, gérées depuis le profil, indépendamment de tout
 * tournoi (point 140) — alternative aux équipes éphémères créées à la volée
 * pendant l'inscription (point 54, conservées en repli si le joueur n'a pas
 * d'équipe pré-créée adaptée). Max 5 équipes par joueur (en tant que chef),
 * max 4 membres par équipe.
 */

export type EquipeProfil = {
  id: string;
  nom: string;
  chef: string;
  membres: string[];
  creeLe: number;
};

export const MAX_EQUIPES_PROFIL = 5;
export const MAX_MEMBRES_EQUIPE_PROFIL = 4;

const CLE = "tourney-equipes-profil";

function lire(): EquipeProfil[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as EquipeProfil[]) : [];
  } catch {
    return [];
  }
}

function ecrire(valeurs: EquipeProfil[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE, JSON.stringify(valeurs));
}

/** Équipes dont ce joueur est chef (gérables) — utilisé pour la limite de 5. */
export function equipesProfilDontChef(pseudo: string): EquipeProfil[] {
  return lire().filter((e) => e.chef === pseudo);
}

export function equipeProfilParId(id: string): EquipeProfil | undefined {
  return lire().find((e) => e.id === id);
}

export function creerEquipeProfil(nom: string, chef: string): EquipeProfil | null {
  if (equipesProfilDontChef(chef).length >= MAX_EQUIPES_PROFIL) return null;
  const equipe: EquipeProfil = {
    id: `eqp-${Date.now().toString(36)}`,
    nom,
    chef,
    membres: [chef],
    creeLe: Date.now(),
  };
  ecrire([...lire(), equipe]);
  return equipe;
}

function majEquipe(id: string, fn: (e: EquipeProfil) => EquipeProfil) {
  ecrire(lire().map((e) => (e.id === id ? fn(e) : e)));
}

export function renommerEquipeProfil(id: string, nom: string) {
  if (!nom.trim()) return;
  majEquipe(id, (e) => ({ ...e, nom: nom.trim() }));
}

export function ajouterMembreEquipeProfil(id: string, membre: string): string | null {
  const equipe = equipeProfilParId(id);
  const pseudo = membre.trim();
  if (!equipe || !pseudo) return "Saisis un pseudo.";
  if (equipe.membres.includes(pseudo)) return "Ce joueur est déjà dans l'équipe.";
  if (equipe.membres.length >= MAX_MEMBRES_EQUIPE_PROFIL) return `Équipe complète (max ${MAX_MEMBRES_EQUIPE_PROFIL} membres).`;
  majEquipe(id, (e) => ({ ...e, membres: [...e.membres, pseudo] }));
  return null;
}

export function retirerMembreEquipeProfil(id: string, membre: string) {
  majEquipe(id, (e) => ({ ...e, membres: e.membres.filter((m) => m !== membre) }));
}

export function supprimerEquipeProfil(id: string) {
  ecrire(lire().filter((e) => e.id !== id));
}
