/**
 * Équipes pré-créées, gérées depuis le profil, indépendamment de tout
 * tournoi (point 140) — alternative aux équipes éphémères créées à la volée
 * pendant l'inscription (point 54, conservées en repli si le joueur n'a pas
 * d'équipe pré-créée adaptée). Max 5 équipes par joueur (en tant que chef),
 * max 4 membres par équipe.
 */

import { peutModifierMensuel } from "./limiteMensuelle";
import { joueurParTag } from "./mockProfil";
import { ajouterNotification } from "./mockNotifications";
import { ajouterMessageSystemeEquipe } from "./mockChatEquipe";

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

// Pas de cleCompte() : une équipe implique plusieurs pseudos (chef + membres),
// potentiellement des comptes différents — equipesProfilDontMembreNonChef()
// doit retrouver les équipes créées par un AUTRE compte où je suis membre.
// Namespacer par compte connecté isolerait chaque compte dans son propre
// registre, cassant les invitations d'équipe entre comptes.
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

/** Équipes dont ce joueur est simple membre (pas chef) — point 192 : un
 * membre non-chef peut proposer l'inscription à un tournoi, sans pouvoir la
 * finaliser lui-même (validation du chef requise). */
export function equipesProfilDontMembreNonChef(pseudo: string): EquipeProfil[] {
  return lire().filter((e) => e.chef !== pseudo && e.membres.includes(pseudo));
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

/**
 * Invitations par TAG (point 192) : le chef invite un profil existant par
 * son TAG plutôt que de l'ajouter directement — le joueur invité doit
 * accepter depuis l'onglet "Invitations" de son propre "Mes équipes" avant
 * d'intégrer l'équipe. Mono-appareil comme le reste de l'app : la
 * notification est poussée dans le flux local unique (pas de vrai push
 * cross-appareil tant qu'il n'y a pas de backend, phase 8).
 */
export type InvitationEquipeProfil = {
  id: string;
  equipeId: string;
  equipeNom: string;
  chef: string;
  destinataire: string;
  statut: "en_attente" | "acceptee" | "refusee";
  horodatage: number;
};

const CLE_INVITATIONS = "tourney-invitations-equipes-profil";

function lireInvitations(): InvitationEquipeProfil[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_INVITATIONS);
    return brut ? (JSON.parse(brut) as InvitationEquipeProfil[]) : [];
  } catch {
    return [];
  }
}

function ecrireInvitations(valeurs: InvitationEquipeProfil[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_INVITATIONS, JSON.stringify(valeurs));
}

export function invitationsRecues(pseudo: string): InvitationEquipeProfil[] {
  return lireInvitations()
    .filter((i) => i.destinataire === pseudo && i.statut === "en_attente")
    .sort((a, b) => b.horodatage - a.horodatage);
}

function aUneInvitationEnAttente(equipeId: string, destinataire: string): boolean {
  return lireInvitations().some((i) => i.equipeId === equipeId && i.destinataire === destinataire && i.statut === "en_attente");
}

/** Recherche par TAG (point 192) puis envoie l'invitation — renvoie un
 * message d'erreur explicite, ou null si l'invitation a bien été envoyée. */
export function inviterParTagEquipeProfil(equipeId: string, tag: string): string | null {
  const equipe = equipeProfilParId(equipeId);
  if (!equipe) return "Équipe introuvable.";
  if (!tag.trim()) return "Saisis le TAG du joueur à inviter.";
  if (equipe.membres.length >= MAX_MEMBRES_EQUIPE_PROFIL) return `Équipe complète (max ${MAX_MEMBRES_EQUIPE_PROFIL} membres).`;
  const profil = joueurParTag(tag);
  if (!profil) return "Aucun profil ne correspond à ce TAG.";
  if (equipe.membres.includes(profil.nom)) return "Ce joueur est déjà dans l'équipe.";
  if (aUneInvitationEnAttente(equipeId, profil.nom)) return "Invitation déjà envoyée à ce joueur.";
  const invitation: InvitationEquipeProfil = {
    id: `inveqp-${Date.now().toString(36)}`,
    equipeId,
    equipeNom: equipe.nom,
    chef: equipe.chef,
    destinataire: profil.nom,
    statut: "en_attente",
    horodatage: Date.now(),
  };
  ecrireInvitations([...lireInvitations(), invitation]);
  ajouterNotification(`${equipe.chef} t'invite à rejoindre l'équipe « ${equipe.nom} ».`);
  return null;
}

/** Confirme l'identité (photo/TAG) avant l'envoi — utilisé par l'écran de
 * confirmation "Inviter" (point 192), séparé de l'envoi effectif. */
export function apercuJoueurParTag(tag: string): { nom: string } | undefined {
  return joueurParTag(tag);
}

export function repondreInvitationEquipeProfil(id: string, accepter: boolean): string | null {
  const invitation = lireInvitations().find((i) => i.id === id);
  if (!invitation || invitation.statut !== "en_attente") return "Invitation introuvable ou déjà traitée.";
  ecrireInvitations(
    lireInvitations().map((i) => (i.id === id ? { ...i, statut: accepter ? "acceptee" : "refusee" } : i)),
  );
  if (accepter) {
    const err = ajouterMembreEquipeProfil(invitation.equipeId, invitation.destinataire);
    if (err) return err;
    ajouterNotification(`${invitation.destinataire} a rejoint l'équipe « ${invitation.equipeNom} ».`);
    ajouterMessageSystemeEquipe(invitation.equipeId, `${invitation.destinataire} a rejoint l'équipe`);
  } else {
    ajouterNotification(`${invitation.destinataire} a refusé de rejoindre l'équipe « ${invitation.equipeNom} ».`);
  }
  return null;
}
