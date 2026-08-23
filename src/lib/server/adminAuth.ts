import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/** Accès à l'interface administrateur sécurisée (point 160) — mêmes
 * identifiants qu'avant (déplacés depuis mockAdminSecure.ts, qui les
 * vérifiait côté CLIENT, donc lisibles dans le bundle JS servi au
 * navigateur), désormais vérifiés ici et jamais envoyés au client. Reste un
 * contournement volontaire (pas de vrai compte admin Supabase avec 2FA
 * serveur) — cf. le commentaire d'origine, phase 8 pour une vraie refonte.
 * La session est un jeton signé (HMAC) dans un cookie httpOnly, sans état
 * stocké côté serveur (pas de table dédiée pour ça). */

const IDENTIFIANT_ADMIN = "olivier.admin";
const MOT_DE_PASSE_ADMIN = "Tourney-Dev-2026!";
const CODE_PIN_ADMIN = "190306";
const SECRET_SESSION = `tourney-admin-session::${MOT_DE_PASSE_ADMIN}::${CODE_PIN_ADMIN}`;

const COOKIE_ETAPE1 = "tourney_admin_etape1";
const COOKIE_SESSION = "tourney_admin_session";
const DUREE_ETAPE1_MS = 5 * 60 * 1000;
const DUREE_SESSION_MS = 15 * 60 * 1000;

function signer(valeur: string): string {
  return createHmac("sha256", SECRET_SESSION).update(valeur).digest("hex");
}

function creerJeton(prefixe: string, dureeMs: number): string {
  const expiration = Date.now() + dureeMs;
  const charge = `${prefixe}.${expiration}`;
  return `${charge}.${signer(charge)}`;
}

function jetonValide(jeton: string | undefined, prefixeAttendu: string): boolean {
  if (!jeton) return false;
  const parties = jeton.split(".");
  if (parties.length !== 3) return false;
  const [prefixe, expirationStr, signature] = parties;
  if (prefixe !== prefixeAttendu) return false;
  if (!expiration_valide(expirationStr)) return false;
  const attendu = signer(`${prefixe}.${expirationStr}`);
  if (attendu.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(attendu), Buffer.from(signature));
}

function expiration_valide(expirationStr: string): boolean {
  const expiration = Number(expirationStr);
  return Boolean(expiration) && Date.now() <= expiration;
}

const OPTIONS_COOKIE = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export function identifiantsValides(identifiant: string, motDePasse: string): boolean {
  return identifiant === IDENTIFIANT_ADMIN && motDePasse === MOT_DE_PASSE_ADMIN;
}

export function pinValide(pin: string): boolean {
  return pin === CODE_PIN_ADMIN;
}

export async function definirEtape1(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_ETAPE1, creerJeton("etape1", DUREE_ETAPE1_MS), { ...OPTIONS_COOKIE, maxAge: DUREE_ETAPE1_MS / 1000 });
}

export async function etape1Validee(): Promise<boolean> {
  const cookieStore = await cookies();
  return jetonValide(cookieStore.get(COOKIE_ETAPE1)?.value, "etape1");
}

export async function definirSessionAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSION, creerJeton("session", DUREE_SESSION_MS), { ...OPTIONS_COOKIE, maxAge: DUREE_SESSION_MS / 1000 });
  cookieStore.delete(COOKIE_ETAPE1);
}

export async function sessionAdminValide(): Promise<boolean> {
  const cookieStore = await cookies();
  return jetonValide(cookieStore.get(COOKIE_SESSION)?.value, "session");
}

export async function deconnecterAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESSION);
  cookieStore.delete(COOKIE_ETAPE1);
}
