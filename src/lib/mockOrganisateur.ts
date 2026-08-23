/**
 * Certification organisateur (mock) : tant que l'organisateur n'a pas
 * complété la vérification d'âge + document officiel, il ne touche pas la
 * commission sur ses tournois payants (elle reste calculée pour information
 * mais n'est jamais créditée).
 */

import { reputationOrganisateur } from "./mockAvis";
import { lireProfil } from "./mockProfil";
import { estOrganisateurApprouve } from "./mockDemandesOrganisateur";
import { peutModifierMensuel } from "./limiteMensuelle";
import { cleCompte } from "./mockAuth";

export type DemandeCertification = {
  ageConfirme: boolean;
  documentNom: string;
  soumisLe: string;
};

const CLE_CERTIFICATION = "tourney-organisateur-certifie";
const CLE_DEMANDE = "tourney-organisateur-demande";

export function estCertifie(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(cleCompte(CLE_CERTIFICATION)) === "1";
}

export function demandeCertification(): DemandeCertification | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = localStorage.getItem(cleCompte(CLE_DEMANDE));
    return brut ? (JSON.parse(brut) as DemandeCertification) : null;
  } catch {
    return null;
  }
}

/** Soumission mock : dès qu'un document est fourni et l'âge confirmé, on
 * considère la vérification instantanément validée (pas de vrai back-office
 * de modération dans ce mock — chantier à part, cf. kyc_verifications déjà
 * en base). La vérification en liste noire par NOM de document a été
 * retirée d'ici : elle ne correspondait de toute façon à rien de réel (la
 * vraie liste noire, server-side, indexe par hash du document, cf.
 * src/lib/server/moderation.ts) — l'application réelle reste
 * peutCreerTournoiPayant() côté serveur à la création d'un tournoi payant. */
export function soumettreCertification(ageConfirme: boolean, documentNom: string): boolean {
  if (typeof window === "undefined" || !ageConfirme || !documentNom.trim()) return false;
  const demande: DemandeCertification = {
    ageConfirme,
    documentNom: documentNom.trim(),
    soumisLe: new Date().toLocaleDateString("fr-FR"),
  };
  localStorage.setItem(cleCompte(CLE_DEMANDE), JSON.stringify(demande));
  localStorage.setItem(cleCompte(CLE_CERTIFICATION), "1");
  return true;
}

/**
 * Nom d'organisateur (distinct du pseudo joueur). Choisissable dès la
 * première session, sans attendre la certification (point 117) : la
 * vérification d'identité ne conditionne que les tournois payants, pas le
 * droit d'organiser tout court (point 41/49 couvrait le choix du nom, pas
 * l'accès à l'organisation gratuite).
 */
const CLE_NOM_ORGANISATEUR = "tourney-nom-organisateur";

export function nomOrganisateur(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(cleCompte(CLE_NOM_ORGANISATEUR)) || undefined;
}

export function definirNomOrganisateur(nom: string) {
  if (typeof window === "undefined" || !nom.trim()) return;
  localStorage.setItem(cleCompte(CLE_NOM_ORGANISATEUR), nom.trim());
  // Synchronise vers organisateur_profils (table Postgres) en tâche de
  // fond : sans ça, l'API tournois renvoie le pseudo joueur au lieu de ce
  // nom, et peutSuperviser() ne reconnaît plus l'organisateur comme le
  // sien (comparaison de noms) — cf. src/lib/server/tournois.ts.
  fetch("/api/organisateur", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomOrganisateur: nom.trim() }),
  }).catch(() => undefined);
}

/** Noms déjà pris par d'autres organisateurs — dérivé des tournois de démo
 * (mono-appareil : pas de vrai registre partagé tant qu'il n'y a pas de
 * backend, phase 8). Évite un import croisé avec mockTournaments.ts (qui
 * importe déjà ce fichier) en gardant une liste statique ici. */
const NOMS_ORGANISATEURS_CONNUS = [
  "Ivoire Esport",
  "Yop Gaming",
  "Abidjan Battle Royale",
  "Yopougon Gaming",
  "Treichville Esport",
  "War Room CI",
  "FGC Côte d'Ivoire",
];

export function nomOrganisateurDisponible(nom: string): boolean {
  const cible = nom.trim().toLowerCase();
  if (!cible) return false;
  if (cible === (nomOrganisateur() ?? "").trim().toLowerCase()) return true;
  return !NOMS_ORGANISATEURS_CONNUS.some((n) => n.toLowerCase() === cible);
}

export function suggererNomsOrganisateurDisponibles(nom: string, nombre = 3): string[] {
  const base = nom.trim();
  if (!base) return [];
  const candidats = [`${base}_`, ...Array.from({ length: 20 }, (_, i) => `${base}${i + 1}`)];
  const suggestions: string[] = [];
  for (const candidat of candidats) {
    if (suggestions.length >= nombre) break;
    if (nomOrganisateurDisponible(candidat)) suggestions.push(candidat);
  }
  return suggestions;
}

const CLE_NOM_ORGANISATEUR_MODIFIE_LE = "tourney-nom-organisateur-modifie-le";

/** Point 155 : le nom d'organisateur ne peut être changé qu'une fois par
 * mois — appelé APRÈS un renommage effectif, jamais lors du choix initial
 * (onboarding), qui n'est pas un "changement". */
export function marquerNomOrganisateurModifie() {
  if (typeof window === "undefined") return;
  localStorage.setItem(cleCompte(CLE_NOM_ORGANISATEUR_MODIFIE_LE), String(Date.now()));
}

export function peutChangerNomOrganisateur(): { ok: boolean; prochainChangementLe?: number } {
  if (typeof window === "undefined") return { ok: true };
  const brut = localStorage.getItem(cleCompte(CLE_NOM_ORGANISATEUR_MODIFIE_LE));
  return peutModifierMensuel(brut ? Number(brut) : undefined);
}

async function reponseJsonOrga<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string; prochainChangementLe?: number }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error, prochainChangementLe: json?.prochainChangementLe };
  return { ok: true, data: json.data as T };
}

type ProfilOrganisateurApiJSON = {
  tag?: string;
  bio?: string;
  banniereUrl?: string;
  photoUrl?: string;
  reseauxSociaux: ReseauSocial[];
  reglementStandardAccepteLe?: number;
  reglementCertifieAccepteLe?: number;
};

let profilOrganisateurCache: ProfilOrganisateurApiJSON | null = null;

async function chargerProfilOrganisateur(): Promise<ProfilOrganisateurApiJSON> {
  if (profilOrganisateurCache) return profilOrganisateurCache;
  const reponse = await fetch("/api/organisateur/profil");
  const resultat = await reponseJsonOrga<ProfilOrganisateurApiJSON>(reponse);
  profilOrganisateurCache = resultat.ok ? resultat.data : { reseauxSociaux: [] };
  return profilOrganisateurCache;
}

async function patchProfilOrganisateur(champ: Record<string, unknown>): Promise<{ ok: boolean; erreur?: string; prochainChangementLe?: number }> {
  const reponse = await fetch("/api/organisateur/profil", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(champ),
  });
  const resultat = await reponseJsonOrga<void>(reponse);
  if (resultat.ok) profilOrganisateurCache = null;
  return resultat.ok ? { ok: true } : { ok: false, erreur: resultat.erreur, prochainChangementLe: resultat.prochainChangementLe };
}

/** Point 164 : photo de profil organisateur, distincte de la photo de
 * profil joueur — modifiable une fois par semaine. */
export async function photoOrganisateur(): Promise<string | undefined> {
  return (await chargerProfilOrganisateur()).photoUrl;
}

export async function definirPhotoOrganisateur(dataUrl: string): Promise<{ ok: boolean; erreur?: string; prochainChangementLe?: number }> {
  return patchProfilOrganisateur({ photoUrl: dataUrl });
}

/** Identité organisateur utilisée partout où un tournoi doit être rattaché
 * à un organisateur (création, réputation, modération) : le nom
 * d'organisateur une fois choisi, sinon le pseudo joueur en repli. */
export function nomOrganisateurActuel(): string {
  return nomOrganisateur() ?? lireProfil().pseudo;
}

export function onboardingOrganisateurComplet(): boolean {
  return Boolean(nomOrganisateur());
}

/** Un organisateur standard ne peut créer que des tournois gratuits à
 * l'inscription (points 117, 167) — la certification reste requise pour les
 * tournois payants et la commission qui va avec. */
export function peutCreerTournoiPayantSelonCertification(): boolean {
  return estCertifie();
}

/**
 * Point 158 : un organisateur "certifié" a fait les DEUX démarches — la
 * vérification d'identité (CNI + selfie, points 41/49) ET la demande de
 * statut organisateur validée par l'administration (point 146). Un
 * organisateur "standard" (n'a fait ni l'une ni l'autre) peut organiser des
 * tournois gratuits sans attendre (point 167) ; seuls les tournois payants
 * et la commission associée exigent le statut certifié complet.
 */
export async function estOrganisateurCertifie(): Promise<boolean> {
  return estCertifie() && (await estOrganisateurApprouve());
}

/** Point 159 : règlement spécifique aux organisateurs certifiés, distinct du
 * règlement intérieur général (point 147) — accepté une seule fois, après
 * validation de la demande de certification, avant de pouvoir créer un
 * tournoi payant. */
export async function reglementCertifieAccepte(): Promise<boolean> {
  return Boolean((await chargerProfilOrganisateur()).reglementCertifieAccepteLe);
}

export async function marquerReglementCertifieAccepte(): Promise<void> {
  await patchProfilOrganisateur({ reglementCertifieAccepte: true });
}

/** Point 178 : règlement général affiché au clic sur "Devenir organisateur",
 * avant le choix du nom — distinct du règlement organisateur certifié
 * (point 159) qui, lui, ne concerne que les tournois payants. */
export async function reglementStandardAccepte(): Promise<boolean> {
  return Boolean((await chargerProfilOrganisateur()).reglementStandardAccepteLe);
}

export async function marquerReglementStandardAccepte(): Promise<void> {
  await patchProfilOrganisateur({ reglementStandardAccepte: true });
}

/**
 * Identité complémentaire du profil organisateur (point 58/59) : TAG
 * personnel, bio et bannière. Comme le nom d'organisateur ci-dessus, ces
 * champs ne sont connus que de l'appareil courant (pas de backend partagé) —
 * ils ne sont donc affichables que sur le profil "cestMoi", pas sur celui
 * d'un autre organisateur consulté depuis cet appareil.
 */
export async function tagOrganisateur(): Promise<string | undefined> {
  return (await chargerProfilOrganisateur()).tag;
}

export async function definirTagOrganisateur(tag: string): Promise<void> {
  await patchProfilOrganisateur({ tag: tag.trim() });
}

export async function bioOrganisateur(): Promise<string | undefined> {
  return (await chargerProfilOrganisateur()).bio;
}

export async function definirBioOrganisateur(bio: string): Promise<void> {
  await patchProfilOrganisateur({ bio: bio.trim() });
}

export async function banniereOrganisateur(): Promise<string | undefined> {
  return (await chargerProfilOrganisateur()).banniereUrl;
}

export async function definirBanniereOrganisateur(dataUrl: string): Promise<void> {
  await patchProfilOrganisateur({ banniereUrl: dataUrl });
}

/**
 * Réseaux sociaux de l'organisateur (profil organisateur) : liens directs
 * mentionnés par l'organisateur lui-même, affichés aux visiteurs de son
 * profil avec un bouton "Suivre" qui ouvre le réseau en question — pas un
 * vrai suivi in-app, juste une redirection directe. Un seul lien par
 * plateforme (contrainte unique en base, profile_id+plateforme).
 */
export type PlateformeSociale = "instagram" | "tiktok" | "youtube" | "facebook" | "x" | "whatsapp" | "twitch" | "discord" | "snapchat" | "site";

export const PLATEFORMES_SOCIALES: { id: PlateformeSociale; label: string; couleur: string }[] = [
  { id: "instagram", label: "Instagram", couleur: "#E1306C" },
  { id: "tiktok", label: "TikTok", couleur: "#25F4EE" },
  { id: "youtube", label: "YouTube", couleur: "#FF0000" },
  { id: "facebook", label: "Facebook", couleur: "#1877F2" },
  { id: "x", label: "X (Twitter)", couleur: "#E8E8F0" },
  { id: "whatsapp", label: "WhatsApp", couleur: "#25D366" },
  { id: "twitch", label: "Twitch", couleur: "#9146FF" },
  { id: "discord", label: "Discord", couleur: "#5865F2" },
  { id: "snapchat", label: "Snapchat", couleur: "#FFFC00" },
  { id: "site", label: "Site web", couleur: "#9C9CB8" },
];

export type ReseauSocial = { plateforme: PlateformeSociale; url: string };

export async function reseauxSociauxOrganisateur(): Promise<ReseauSocial[]> {
  return (await chargerProfilOrganisateur()).reseauxSociaux;
}

/** Ajoute ou remplace le lien d'une plateforme (un seul lien par plateforme). */
export async function definirReseauSocial(plateforme: PlateformeSociale, url: string): Promise<void> {
  if (!url.trim()) return;
  const reponse = await fetch("/api/organisateur/profil/reseaux", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plateforme, url }),
  });
  if (reponse.ok) profilOrganisateurCache = null;
}

export async function retirerReseauSocial(plateforme: PlateformeSociale): Promise<void> {
  const reponse = await fetch("/api/organisateur/profil/reseaux", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plateforme }),
  });
  if (reponse.ok) profilOrganisateurCache = null;
}

/**
 * Réputation & modération anti-triche — basée sur les avis cœur/cœur brisé
 * laissés en fin de tournoi (cf. mockAvis). Un organisateur qui accumule
 * trop de cœurs brisés voit sa capacité à créer des tournois payants
 * suspendue le temps d'une vérification admin (bannissement + liste noire
 * du document d'identité en cas de triche confirmée). Entièrement
 * server-side désormais (src/lib/server/moderation.ts) — bannir/suspendre/
 * lister en liste noire depuis cet appareil n'a plus de sens côté client :
 * ce sont des actions admin réelles, gérées depuis /tourney-control.
 */

/** Réputation globale : cumule les avis laissés sur chacun de ses tournois
 * (point 19/51) et les avis laissés directement sur son profil (point 51). */
export async function statistiquesReputation(organisateur: string): Promise<{ coeurs: number; coeursBrises: number }> {
  return reputationOrganisateur(organisateur);
}

export type StatutModeration = "actif" | "suspendu" | "banni";

/** Le compte connecté peut-il créer/gérer un tournoi impliquant de l'argent
 * réel maintenant ? Vérifié à nouveau côté serveur à la création elle-même
 * (POST /api/tournois) — cet appel ne sert qu'à l'affichage anticipé. */
export async function peutCreerTournoiPayant(): Promise<boolean> {
  const reponse = await fetch("/api/organisateur/statut-moderation");
  if (!reponse.ok) return false;
  const json = await reponse.json().catch(() => null);
  return json?.success ? Boolean(json.data.peutCreerPayant) : false;
}

export async function monStatutModeration(): Promise<StatutModeration> {
  const reponse = await fetch("/api/organisateur/statut-moderation");
  if (!reponse.ok) return "actif";
  const json = await reponse.json().catch(() => null);
  return json?.success ? (json.data.statut as StatutModeration) : "actif";
}
