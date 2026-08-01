/**
 * État "connexion" simulé pour la phase 2 du chantier V2 (pas de backend
 * réel : ni vraie session, ni SMS OTP envoyé). Persisté en localStorage,
 * à remplacer par une vraie auth Supabase en phase 8.
 */

export type SourceConnexion = "telephone" | "google";

const CLE_SPLASH_VU = "tourneyci-splash-vu";
const CLE_ONBOARDE = "tourneyci-onboarde";
const CLE_CONNECTE = "tourneyci-connecte";
const CLE_SOURCE = "tourneyci-source-connexion";
const CLE_IDENTIFIANT = "tourneyci-identifiant";

function lire(cle: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(cle) === "1";
}

function ecrire(cle: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cle, "1");
}

export const aVuSplash = () => lire(CLE_SPLASH_VU);
export const marquerSplashVu = () => ecrire(CLE_SPLASH_VU);

export const estOnboarde = () => lire(CLE_ONBOARDE);
export const marquerOnboarde = () => ecrire(CLE_ONBOARDE);

export const estConnecte = () => lire(CLE_CONNECTE);

export function marquerConnecte(source: SourceConnexion, identifiant: string) {
  ecrire(CLE_CONNECTE);
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_SOURCE, source);
  localStorage.setItem(CLE_IDENTIFIANT, identifiant);
}

export function deconnecter() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLE_CONNECTE);
  localStorage.removeItem(CLE_SOURCE);
  localStorage.removeItem(CLE_IDENTIFIANT);
}

export function sourceConnexion(): SourceConnexion | null {
  if (typeof window === "undefined") return null;
  const valeur = localStorage.getItem(CLE_SOURCE);
  return valeur === "telephone" || valeur === "google" ? valeur : null;
}

export function identifiantConnexion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLE_IDENTIFIANT);
}

export type Role = "joueur" | "organisateur";

const CLE_ROLE = "tourneyci-role";

export function rolePrefere(): Role {
  if (typeof window === "undefined") return "joueur";
  return localStorage.getItem(CLE_ROLE) === "organisateur" ? "organisateur" : "joueur";
}

export function definirRole(role: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_ROLE, role);
}

export const estOrganisateur = () => rolePrefere() === "organisateur";
