/**
 * État "connexion" simulé pour la phase 2 du chantier V2 (pas de backend
 * réel : ni vraie session, ni SMS OTP envoyé). Persisté en localStorage,
 * à remplacer par une vraie auth Supabase en phase 8.
 */

export type SourceConnexion = "telephone" | "google";

const CLE_ONBOARDE = "tourney-onboarde";
const CLE_CONNECTE = "tourney-connecte";
const CLE_SOURCE = "tourney-source-connexion";
const CLE_IDENTIFIANT = "tourney-identifiant";

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
export const profilInitialComplet = () => lire(CLE_PROFIL_INITIAL_COMPLET);
export const marquerProfilInitialComplet = () => ecrire(CLE_PROFIL_INITIAL_COMPLET);

const CLE_REGLEMENT_ACCEPTE = "tourney-reglement-accepte";

/** Point 147 : acceptation obligatoire du règlement intérieur avant
 * d'atteindre l'accueil, une seule fois par appareil — cf. /reglement-interieur. */
export const reglementAccepte = () => lire(CLE_REGLEMENT_ACCEPTE);
export const marquerReglementAccepte = () => ecrire(CLE_REGLEMENT_ACCEPTE);

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

const CLE_MOTS_DE_PASSE = "tourney-mots-de-passe";

function normaliserTelephone(telephone: string): string {
  return telephone.replace(/\D/g, "");
}

/** Hash non cryptographique (djb2) — évite de stocker le mot de passe en
 * clair dans ce mock, mais ne remplace en rien une vraie auth. À basculer
 * sur Supabase Auth (bcrypt côté serveur) en phase 8. */
function hacher(valeur: string): string {
  let h = 0;
  for (let i = 0; i < valeur.length; i++) {
    h = (h << 5) - h + valeur.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

function lireMotsDePasse(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_MOTS_DE_PASSE);
    return brut ? (JSON.parse(brut) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function definirMotDePasse(telephone: string, motDePasse: string) {
  if (typeof window === "undefined") return;
  const tous = lireMotsDePasse();
  tous[normaliserTelephone(telephone)] = hacher(motDePasse);
  localStorage.setItem(CLE_MOTS_DE_PASSE, JSON.stringify(tous));
}

export function aUnMotDePasse(telephone: string): boolean {
  return normaliserTelephone(telephone) in lireMotsDePasse();
}

export function verifierMotDePasse(telephone: string, motDePasse: string): boolean {
  const tous = lireMotsDePasse();
  return tous[normaliserTelephone(telephone)] === hacher(motDePasse);
}

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
