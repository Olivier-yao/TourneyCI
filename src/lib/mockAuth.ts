/**
 * État "connexion" pour la phase 2 du chantier V2 — la session elle-même
 * est désormais la vraie session Supabase Auth (Google OAuth + email/mot de
 * passe, plus de numéro de téléphone/SMS/Twilio), pas un flag localStorage.
 * Onboarding/rôle préféré/transition d'entrée restent des préférences
 * locales à l'appareil, indépendantes du compte. Profil initial et
 * règlement, eux, sont des données de compte (cf. cleCompte()) : un
 * deuxième compte sur le même appareil ne doit pas hériter de l'état du
 * premier.
 */

import { creerClientSupabaseNavigateur } from "./supabase/client";

const CLE_ONBOARDE = "tourney-onboarde";

function lire(cle: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(cle) === "1";
}

function ecrire(cle: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cle, "1");
}

export const estOnboarde = () => lire(CLE_ONBOARDE);
export const marquerOnboarde = () => ecrire(CLE_ONBOARDE);

const CLE_PROFIL_INITIAL_COMPLET = "tourney-profil-initial-complet";

/** Point 142 : pseudo + photo obligatoires avant d'atteindre l'accueil, une
 * seule fois par appareil (pas à chaque connexion) — cf. /bienvenue-profil. */
export const profilInitialComplet = () => lire(cleCompte(CLE_PROFIL_INITIAL_COMPLET));
export const marquerProfilInitialComplet = () => ecrire(cleCompte(CLE_PROFIL_INITIAL_COMPLET));

const CLE_REGLEMENT_ACCEPTE = "tourney-reglement-accepte";

/** Point 147 : acceptation obligatoire du règlement intérieur avant
 * d'atteindre l'accueil, une seule fois par appareil — cf. /reglement-interieur. */
export const reglementAccepte = () => lire(cleCompte(CLE_REGLEMENT_ACCEPTE));
export const marquerReglementAccepte = () => ecrire(cleCompte(CLE_REGLEMENT_ACCEPTE));

export type SourceConnexion = "email" | "google";

type SessionConnue = { source: SourceConnexion; identifiant: string } | null;

let sessionActuelle: SessionConnue = null;
let sessionInitialisee = false;
let resoudreInitialisation: (() => void) | null = null;
const initialisationSession = new Promise<void>((resolve) => {
  resoudreInitialisation = resolve;
});

if (typeof window !== "undefined") {
  creerClientSupabaseNavigateur().auth.onAuthStateChange((_evenement, session) => {
    sessionActuelle = session?.user
      ? { source: session.user.app_metadata.provider === "google" ? "google" : "email", identifiant: session.user.email ?? "" }
      : null;
    if (!sessionInitialisee) {
      sessionInitialisee = true;
      resoudreInitialisation?.();
    }
  });
}

/** À attendre dans les gardes de connexion avant de lire estConnecte() —
 * évite un flash "non connecté" le temps que le SDK lise la session depuis
 * le storage local au tout premier rendu (quasi instantané, aucun appel
 * réseau sauf si le token est près d'expirer). Résout immédiatement une
 * fois la session déjà connue. */
export async function attendreSession(): Promise<void> {
  if (sessionInitialisee) return;
  await initialisationSession;
}

export const estConnecte = () => sessionActuelle !== null;

/** Préfixe une clé localStorage par le compte connecté (son e-mail), pour
 * que chaque compte Supabase ait ses propres données mock sur un même
 * appareil — sans ça, un deuxième compte Google réutilisait le profil, le
 * solde et les inscriptions du premier. Retombe sur la clé brute si personne
 * n'est connecté (écrans avant connexion, aucune donnée de compte en jeu). */
export function cleCompte(base: string): string {
  const id = identifiantConnexion();
  return id ? `${base}::${id}` : base;
}

export async function deconnecter() {
  if (typeof window === "undefined") return;
  await creerClientSupabaseNavigateur().auth.signOut();
}

export const sourceConnexion = (): SourceConnexion | null => sessionActuelle?.source ?? null;

export const identifiantConnexion = (): string | null => sessionActuelle?.identifiant ?? null;

export type Role = "joueur" | "organisateur";

const CLE_ROLE = "tourney-role";

export function rolePrefere(): Role {
  if (typeof window === "undefined") return "joueur";
  return localStorage.getItem(CLE_ROLE) === "organisateur" ? "organisateur" : "joueur";
}

export function definirRole(role: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_ROLE, role);
}

export const estOrganisateur = () => rolePrefere() === "organisateur";

const CLE_TRANSITION_ENTREE = "tourney-transition-entree";

/** Arme la transition "cube" à jouer une fois sur l'accueil, juste après une
 * connexion ou une création de compte réussie. */
export function armerTransitionEntree() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLE_TRANSITION_ENTREE, "1");
}

/** Consomme (lit puis efface) le flag — ne se déclenche qu'une seule fois. */
export function consommerTransitionEntree(): boolean {
  if (typeof window === "undefined") return false;
  const armee = sessionStorage.getItem(CLE_TRANSITION_ENTREE) === "1";
  if (armee) sessionStorage.removeItem(CLE_TRANSITION_ENTREE);
  return armee;
}
