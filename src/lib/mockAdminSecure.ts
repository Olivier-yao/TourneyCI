/**
 * Accès à l'interface administrateur sécurisée (point 160) — distinct du
 * simple code partagé des écrans /admin/* existants : deux facteurs
 * (identifiants puis code PIN), sur une route non liée à la navigation de
 * l'app (/tourney-control). Identifiants en dur car ce mock n'a pas de vrai
 * backend d'authentification — à remplacer par une vraie auth (compte admin
 * + 2FA côté serveur) en phase 8. Ne stocke que des flags de session,
 * jamais les identifiants eux-mêmes.
 */

const IDENTIFIANT_ADMIN = "olivier.admin";
const MOT_DE_PASSE_ADMIN = "Tourney-Dev-2026!";
const CODE_PIN_ADMIN = "739184";

const CLE_ETAPE_IDENTIFIANTS = "tourney-admin-securise-identifiants";
const CLE_ETAPE_PIN = "tourney-admin-securise-pin";

export function verifierIdentifiants(identifiant: string, motDePasse: string): boolean {
  const ok = identifiant === IDENTIFIANT_ADMIN && motDePasse === MOT_DE_PASSE_ADMIN;
  if (ok && typeof window !== "undefined") sessionStorage.setItem(CLE_ETAPE_IDENTIFIANTS, "1");
  return ok;
}

export function verifierPin(pin: string): boolean {
  const ok = pin === CODE_PIN_ADMIN;
  if (ok && typeof window !== "undefined") sessionStorage.setItem(CLE_ETAPE_PIN, "1");
  return ok;
}

export function etapeIdentifiantsValidee(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CLE_ETAPE_IDENTIFIANTS) === "1";
}

export function estAuthentifieAdminSecurise(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CLE_ETAPE_IDENTIFIANTS) === "1" && sessionStorage.getItem(CLE_ETAPE_PIN) === "1";
}

export function deconnecterAdminSecurise() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLE_ETAPE_IDENTIFIANTS);
  sessionStorage.removeItem(CLE_ETAPE_PIN);
}
