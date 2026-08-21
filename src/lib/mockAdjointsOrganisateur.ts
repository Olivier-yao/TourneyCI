import { classementOrganisateurs } from "./mockClassementOrganisateurs";

/**
 * Adjoints organisateur : un organisateur peut inviter un autre organisateur
 * existant à l'aider à superviser TOUS ses tournois (accès aux écrans de
 * gestion en direct — qualifications, room, stream). Un adjoint vient
 * "en soutien" : il n'a jamais accès aux réglages du tournoi (titre,
 * règlement...) ni à la demande d'annulation, qui restent réservés au
 * propriétaire.
 *
 * Comme le reste des recherches par nom dans ce mock mono-appareil, les
 * organisateurs "connus" pour l'invitation viennent des données de démo
 * (classementOrganisateurs) — pas de vrai registre partagé tant qu'il n'y a
 * pas de backend réel (phase 8).
 */

export type StatutAdjoint = "en_attente" | "accepte";
export type Adjoint = { proprietaire: string; adjoint: string; statut: StatutAdjoint; horodatage: number };

// Pas de cleCompte() : une relation adjoint implique deux comptes différents
// (propriétaire + adjoint) qui doivent tous les deux voir la même invitation
// — namespacer par compte connecté la rendrait invisible à l'autre partie.
const CLE = "tourney-adjoints-organisateur";

function lireTout(): Adjoint[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Adjoint[]) : [];
  } catch {
    return [];
  }
}

function ecrire(liste: Adjoint[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE, JSON.stringify(liste));
}

async function organisateurExiste(nom: string): Promise<boolean> {
  return (await classementOrganisateurs()).some((o) => o.nom.toLowerCase() === nom.trim().toLowerCase());
}

/** Envoie une invitation — renvoie un message d'erreur, ou null si OK. */
export async function inviterAdjoint(proprietaire: string, nomAdjoint: string): Promise<string | null> {
  const cible = nomAdjoint.trim();
  if (!cible) return "Indique le nom de l'organisateur à inviter.";
  if (cible.toLowerCase() === proprietaire.toLowerCase()) return "Tu ne peux pas t'inviter toi-même.";
  if (!(await organisateurExiste(cible))) return "Aucun organisateur ne correspond à ce nom.";
  const tous = lireTout();
  if (tous.some((a) => a.proprietaire === proprietaire && a.adjoint.toLowerCase() === cible.toLowerCase())) {
    return "Déjà invité.";
  }
  tous.push({ proprietaire, adjoint: cible, statut: "en_attente", horodatage: Date.now() });
  ecrire(tous);
  return null;
}

/** Adjoints (invités + acceptés) d'un organisateur, pour son écran de gestion. */
export function adjointsDe(proprietaire: string): Adjoint[] {
  return lireTout()
    .filter((a) => a.proprietaire === proprietaire)
    .sort((a, b) => b.horodatage - a.horodatage);
}

/** Organisateurs dont nomAdjoint est un adjoint accepté — sens inverse
 * d'adjointsDe(), pour l'onglet "Tournois à superviser" côté adjoint. */
export function proprietairesSupervises(nomAdjoint: string): string[] {
  return lireTout()
    .filter((a) => a.adjoint === nomAdjoint && a.statut === "accepte")
    .map((a) => a.proprietaire);
}

/** Invitations en attente reçues par un organisateur (à accepter/refuser). */
export function invitationsRecues(nomOrganisateur: string): Adjoint[] {
  return lireTout()
    .filter((a) => a.adjoint === nomOrganisateur && a.statut === "en_attente")
    .sort((a, b) => b.horodatage - a.horodatage);
}

export function accepterInvitation(proprietaire: string, adjoint: string) {
  ecrire(lireTout().map((a) => (a.proprietaire === proprietaire && a.adjoint === adjoint ? { ...a, statut: "accepte" as const } : a)));
}

/** Refuse une invitation en attente, ou retire un adjoint déjà accepté — même
 * opération : supprime la relation. */
export function retirerAdjoint(proprietaire: string, adjoint: string) {
  ecrire(lireTout().filter((a) => !(a.proprietaire === proprietaire && a.adjoint === adjoint)));
}

function estAdjointAccepte(proprietaire: string, nomOrganisateur: string): boolean {
  return lireTout().some((a) => a.proprietaire === proprietaire && a.adjoint === nomOrganisateur && a.statut === "accepte");
}

/** Le propriétaire ou l'un de ses adjoints acceptés peut superviser ce
 * tournoi (qualifications, room, stream) — jamais les réglages ni
 * l'annulation, réservés au seul propriétaire. */
export function peutSuperviser(proprietaireDuTournoi: string, nomOrganisateurActuel: string): boolean {
  return proprietaireDuTournoi === nomOrganisateurActuel || estAdjointAccepte(proprietaireDuTournoi, nomOrganisateurActuel);
}
