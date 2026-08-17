/**
 * Certification organisateur (mock) : tant que l'organisateur n'a pas
 * complété la vérification d'âge + document officiel, il ne touche pas la
 * commission sur ses tournois payants (elle reste calculée pour information
 * mais n'est jamais créditée).
 */

import { avisDeOrganisateur, avisGlobalDeOrganisateur } from "./mockAvis";
import { lireProfil } from "./mockProfil";
import { estOrganisateurApprouve } from "./mockDemandesOrganisateur";
import { peutModifierMensuel } from "./limiteMensuelle";

export type DemandeCertification = {
  ageConfirme: boolean;
  documentNom: string;
  soumisLe: string;
};

const CLE_CERTIFICATION = "tourney-organisateur-certifie";
const CLE_DEMANDE = "tourney-organisateur-demande";

export function estCertifie(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLE_CERTIFICATION) === "1";
}

export function demandeCertification(): DemandeCertification | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_DEMANDE);
    return brut ? (JSON.parse(brut) as DemandeCertification) : null;
  } catch {
    return null;
  }
}

/** Soumission mock : dès qu'un document est fourni et l'âge confirmé, on
 * considère la vérification instantanément validée (pas de vrai back-office
 * de modération dans ce mock). */
export function soumettreCertification(ageConfirme: boolean, documentNom: string): boolean {
  if (typeof window === "undefined" || !ageConfirme || !documentNom.trim()) return false;
  const demande: DemandeCertification = {
    ageConfirme,
    documentNom: documentNom.trim(),
    soumisLe: new Date().toLocaleDateString("fr-FR"),
  };
  if (documentEnListeNoire(documentNom)) return false;
  localStorage.setItem(CLE_DEMANDE, JSON.stringify(demande));
  localStorage.setItem(CLE_CERTIFICATION, "1");
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
  return localStorage.getItem(CLE_NOM_ORGANISATEUR) || undefined;
}

export function definirNomOrganisateur(nom: string) {
  if (typeof window === "undefined" || !nom.trim()) return;
  localStorage.setItem(CLE_NOM_ORGANISATEUR, nom.trim());
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
  localStorage.setItem(CLE_NOM_ORGANISATEUR_MODIFIE_LE, String(Date.now()));
}

export function peutChangerNomOrganisateur(): { ok: boolean; prochainChangementLe?: number } {
  if (typeof window === "undefined") return { ok: true };
  const brut = localStorage.getItem(CLE_NOM_ORGANISATEUR_MODIFIE_LE);
  return peutModifierMensuel(brut ? Number(brut) : undefined);
}

const CLE_PHOTO_ORGANISATEUR = "tourney-photo-organisateur";
const CLE_PHOTO_ORGANISATEUR_MODIFIEE_LE = "tourney-photo-organisateur-modifiee-le";

/** Point 164 : photo de profil organisateur, distincte de la photo de
 * profil joueur — modifiable une fois par semaine. */
export function photoOrganisateur(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(CLE_PHOTO_ORGANISATEUR) || undefined;
}

export function peutChangerPhotoOrganisateur(): { ok: boolean; prochainChangementLe?: number } {
  if (typeof window === "undefined") return { ok: true };
  const brut = localStorage.getItem(CLE_PHOTO_ORGANISATEUR_MODIFIEE_LE);
  if (!brut) return { ok: true };
  const dernierChangement = Number(brut);
  const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;
  const prochain = dernierChangement + SEPT_JOURS_MS;
  if (Date.now() >= prochain) return { ok: true };
  return { ok: false, prochainChangementLe: prochain };
}

export function definirPhotoOrganisateur(dataUrl: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_PHOTO_ORGANISATEUR, dataUrl);
  localStorage.setItem(CLE_PHOTO_ORGANISATEUR_MODIFIEE_LE, String(Date.now()));
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
export function estOrganisateurCertifie(): boolean {
  return estCertifie() && estOrganisateurApprouve();
}

const CLE_REGLEMENT_CERTIFIE_ACCEPTE = "tourney-reglement-certifie-accepte";

/** Point 159 : règlement spécifique aux organisateurs certifiés, distinct du
 * règlement intérieur général (point 147) — accepté une seule fois, après
 * validation de la demande de certification, avant de pouvoir créer un
 * tournoi payant. */
export function reglementCertifieAccepte(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLE_REGLEMENT_CERTIFIE_ACCEPTE) === "1";
}

export function marquerReglementCertifieAccepte() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_REGLEMENT_CERTIFIE_ACCEPTE, "1");
}

const CLE_REGLEMENT_STANDARD_ACCEPTE = "tourney-reglement-standard-accepte";

/** Point 178 : règlement général affiché au clic sur "Devenir organisateur",
 * avant le choix du nom — distinct du règlement organisateur certifié
 * (point 159) qui, lui, ne concerne que les tournois payants. */
export function reglementStandardAccepte(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLE_REGLEMENT_STANDARD_ACCEPTE) === "1";
}

export function marquerReglementStandardAccepte() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_REGLEMENT_STANDARD_ACCEPTE, "1");
}

/**
 * Identité complémentaire du profil organisateur (point 58/59) : TAG
 * personnel, bio et bannière. Comme le nom d'organisateur ci-dessus, ces
 * champs ne sont connus que de l'appareil courant (pas de backend partagé) —
 * ils ne sont donc affichables que sur le profil "cestMoi", pas sur celui
 * d'un autre organisateur consulté depuis cet appareil.
 */
const CLE_TAG_ORGANISATEUR = "tourney-tag-organisateur";
const CLE_BIO_ORGANISATEUR = "tourney-bio-organisateur";
const CLE_BANNIERE_ORGANISATEUR = "tourney-banniere-organisateur";

export function tagOrganisateur(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(CLE_TAG_ORGANISATEUR) || undefined;
}

export function definirTagOrganisateur(tag: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_TAG_ORGANISATEUR, tag.trim());
}

export function bioOrganisateur(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(CLE_BIO_ORGANISATEUR) || undefined;
}

export function definirBioOrganisateur(bio: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_BIO_ORGANISATEUR, bio.trim());
}

export function banniereOrganisateur(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(CLE_BANNIERE_ORGANISATEUR) || undefined;
}

export function definirBanniereOrganisateur(dataUrl: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_BANNIERE_ORGANISATEUR, dataUrl);
}

/**
 * Réseaux sociaux de l'organisateur (profil organisateur) : liens directs
 * mentionnés par l'organisateur lui-même, affichés aux visiteurs de son
 * profil avec un bouton "Suivre" qui ouvre le réseau en question — pas un
 * vrai suivi in-app, juste une redirection directe. Comme le TAG/bio/
 * bannière ci-dessus, ces données ne sont connues que de l'appareil courant
 * (pas de backend partagé tant que la phase 8 n'est pas là) : un seul lien
 * par plateforme.
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

const CLE_RESEAUX_SOCIAUX = "tourney-reseaux-sociaux-organisateur";

function normaliserUrlReseau(url: string): string {
  const cible = url.trim();
  if (!cible) return cible;
  return /^https?:\/\//i.test(cible) ? cible : `https://${cible}`;
}

export function reseauxSociauxOrganisateur(): ReseauSocial[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_RESEAUX_SOCIAUX);
    return brut ? (JSON.parse(brut) as ReseauSocial[]) : [];
  } catch {
    return [];
  }
}

/** Ajoute ou remplace le lien d'une plateforme (un seul lien par plateforme). */
export function definirReseauSocial(plateforme: PlateformeSociale, url: string) {
  if (typeof window === "undefined" || !url.trim()) return;
  const existants = reseauxSociauxOrganisateur().filter((r) => r.plateforme !== plateforme);
  localStorage.setItem(
    CLE_RESEAUX_SOCIAUX,
    JSON.stringify([...existants, { plateforme, url: normaliserUrlReseau(url) }]),
  );
}

export function retirerReseauSocial(plateforme: PlateformeSociale) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CLE_RESEAUX_SOCIAUX,
    JSON.stringify(reseauxSociauxOrganisateur().filter((r) => r.plateforme !== plateforme)),
  );
}

/**
 * Réputation & modération anti-triche (mock) — basée sur les avis
 * cœur/cœur brisé laissés en fin de tournoi (cf. mockAvis). Un organisateur
 * qui accumule trop de cœurs brisés voit sa capacité à créer des tournois
 * payants suspendue le temps d'une vérification. En cas de triche confirmée,
 * le compte est banni et sa pièce d'identité mise en liste noire pour
 * empêcher une nouvelle certification (la vérification faciale n'est pas
 * encore implémentée, mais la structure de données est prête pour l'accueillir).
 */
export const SEUIL_COEURS_BRISES_SUSPENSION = 3;

/** Réputation globale : cumule les avis laissés sur chacun de ses tournois
 * (point 19/51) et les avis laissés directement sur son profil (point 51). */
export function statistiquesReputation(organisateur: string): { coeurs: number; coeursBrises: number } {
  const parTournoi = avisDeOrganisateur(organisateur);
  const global = avisGlobalDeOrganisateur(organisateur);
  const tout = [...parTournoi, ...global];
  return {
    coeurs: tout.filter((a) => a.type === "coeur").length,
    coeursBrises: tout.filter((a) => a.type === "coeur_brise").length,
  };
}

export type StatutModeration = "actif" | "suspendu" | "banni";

const CLE_SUSPENDU = "tourney-organisateur-suspendu-leve";
const CLE_BANNI = "tourney-organisateur-banni";
const CLE_LISTE_NOIRE = "tourney-liste-noire";

export type EntreeListeNoire = {
  documentNom: string;
  /** Réservé à la vérification faciale future (non implémentée). */
  visageHash?: string;
  motif: string;
  horodatage: number;
};

/** Statut de modération de l'organisateur de cet appareil (mock mono-compte). */
export function statutModeration(organisateur: string): StatutModeration {
  if (typeof window === "undefined") return "actif";
  if (localStorage.getItem(CLE_BANNI) === "1") return "banni";
  const leve = localStorage.getItem(CLE_SUSPENDU) === "1";
  if (!leve && statistiquesReputation(organisateur).coeursBrises >= SEUIL_COEURS_BRISES_SUSPENSION) return "suspendu";
  return "actif";
}

export function peutCreerTournoiPayant(organisateur: string): boolean {
  return statutModeration(organisateur) === "actif";
}

function lireListeNoire(): EntreeListeNoire[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_LISTE_NOIRE);
    return brut ? (JSON.parse(brut) as EntreeListeNoire[]) : [];
  } catch {
    return [];
  }
}

export function listeNoire(): EntreeListeNoire[] {
  return lireListeNoire();
}

export function documentEnListeNoire(documentNom: string): boolean {
  const cible = documentNom.trim().toLowerCase();
  return lireListeNoire().some((e) => e.documentNom.trim().toLowerCase() === cible);
}

function ajouterListeNoire(documentNom: string, motif: string) {
  if (typeof window === "undefined" || !documentNom.trim()) return;
  localStorage.setItem(
    CLE_LISTE_NOIRE,
    JSON.stringify([...lireListeNoire(), { documentNom: documentNom.trim(), motif, horodatage: Date.now() }]),
  );
}

/** Action admin : triche confirmée après vérification → bannissement +
 * liste noire de la pièce d'identité fournie à la certification. */
export function confirmerTricheEtBannir(organisateur: string) {
  if (typeof window === "undefined") return;
  const demande = demandeCertification();
  localStorage.setItem(CLE_BANNI, "1");
  if (demande?.documentNom) {
    ajouterListeNoire(demande.documentNom, `Triche confirmée sur les tournois de ${organisateur}`);
  }
}

/** Action admin : vérification terminée, rien à reprocher → suspension levée. */
export function leverSuspension() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_SUSPENDU, "1");
}
