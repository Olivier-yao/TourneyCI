/**
 * Équipes pré-créées, gérées depuis le profil, indépendamment de tout
 * tournoi (point 140) — alternative aux équipes éphémères créées à la volée
 * pendant l'inscription (point 54, conservées en repli si le joueur n'a pas
 * d'équipe pré-créée adaptée). Max 5 équipes par joueur (en tant que chef),
 * max 4 membres par équipe.
 */

import { peutModifierMensuel } from "./limiteMensuelle";

export type EquipeProfil = {
  id: string;
  nom: string;
  chef: string;
  membres: string[];
  creeLe: number;
  /** Point 155 : horodatage du dernier renommage, pour la limite mensuelle. */
  nomModifieLe?: number;
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

/** Point 155 : une équipe pré-créée ne peut être renommée qu'une fois par
 * mois, et le nouveau nom doit être libre parmi les autres équipes du même
 * chef (pas de vrai registre global partagé dans ce mock mono-appareil). */
export function peutRenommerEquipeProfil(id: string): { ok: boolean; prochainChangementLe?: number } {
  const equipe = equipeProfilParId(id);
  return peutModifierMensuel(equipe?.nomModifieLe);
}

export function nomEquipeProfilDisponible(chef: string, nom: string, idEquipeActuelle?: string): boolean {
  const cible = nom.trim().toLowerCase();
  if (!cible) return false;
  return !equipesProfilDontChef(chef).some((e) => e.id !== idEquipeActuelle && e.nom.trim().toLowerCase() === cible);
}

export function renommerEquipeProfil(id: string, nom: string): string | null {
  if (!nom.trim()) return "Saisis un nom.";
  const equipe = equipeProfilParId(id);
  if (!equipe) return "Équipe introuvable.";
  if (nom.trim() === equipe.nom) return null;
  const { ok, prochainChangementLe } = peutRenommerEquipeProfil(id);
  if (!ok) return `Renommable à nouveau le ${new Date(prochainChangementLe!).toLocaleDateString("fr-FR")}.`;
  if (!nomEquipeProfilDisponible(equipe.chef, nom, id)) return "Tu as déjà une équipe avec ce nom.";
  majEquipe(id, (e) => ({ ...e, nom: nom.trim(), nomModifieLe: Date.now() }));
  return null;
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
