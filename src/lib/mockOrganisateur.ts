/**
 * Certification organisateur — vérification d'identité (KYC) réelle,
 * server-side (cf. src/lib/server/kyc.ts et la table kyc_verifications,
 * déjà en base mais jamais branchée avant ce chantier). Tant qu'elle n'est
 * pas validée par un admin, l'organisateur ne touche pas la commission sur
 * ses tournois payants (calculée pour information mais jamais créditée,
 * vérifié côté serveur à la clôture — cf. src/lib/server/cloture.ts).
 */

import { reputationOrganisateur } from "./mockAvis";
import { lireProfil } from "./mockProfil";
import { estOrganisateurApprouve } from "./mockDemandesOrganisateur";

export type StatutKyc = "en_attente" | "validee" | "refusee";

export type VerificationIdentite = {
  id: string;
  typePiece: string;
  ageConfirme: boolean;
  statut: StatutKyc;
  horodatage: number;
};

/** Ma dernière vérification d'identité soumise, quel que soit son statut —
 * null si jamais soumise. */
export async function maVerificationIdentite(): Promise<VerificationIdentite | null> {
  const reponse = await fetch("/api/verification-identite");
  if (!reponse.ok) return null;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : null;
}

export async function estCertifie(): Promise<boolean> {
  const v = await maVerificationIdentite();
  return v?.statut === "validee";
}

export type SoumissionVerificationIdentite = {
  typePiece: string;
  /** Data URL (comme la photo/bannière de profil, cf. PhotoCropper) — pas
   * d'object storage dédié dans ce projet. */
  rectoUrl: string;
  versoUrl: string;
  selfieUrl: string;
  ageConfirme: boolean;
};

export type ResultatSoumissionKyc = { ok: boolean; erreur?: string; data?: VerificationIdentite };

/** Envoie les documents pour vérification — reste "en_attente" jusqu'à ce
 * qu'un admin la traite depuis /tourney-control (onglet Modération),
 * jamais instantanément validée côté client. */
export async function soumettreVerificationIdentite(s: SoumissionVerificationIdentite): Promise<ResultatSoumissionKyc> {
  const reponse = await fetch("/api/verification-identite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(s),
  });
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data };
}

async function reponseJsonOrga<T>(
  reponse: Response,
): Promise<{ ok: true; data: T } | { ok: false; erreur?: string; prochainChangementLe?: number; suggestions?: string[] }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error, prochainChangementLe: json?.prochainChangementLe, suggestions: json?.suggestions };
  return { ok: true, data: json.data as T };
}

type ProfilOrganisateurApiJSON = {
  nomOrganisateur?: string;
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

async function patchProfilOrganisateur(
  champ: Record<string, unknown>,
): Promise<{ ok: boolean; erreur?: string; prochainChangementLe?: number; suggestions?: string[] }> {
  const reponse = await fetch("/api/organisateur/profil", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(champ),
  });
  const resultat = await reponseJsonOrga<void>(reponse);
  if (resultat.ok) profilOrganisateurCache = null;
  return resultat.ok
    ? { ok: true }
    : { ok: false, erreur: resultat.erreur, prochainChangementLe: resultat.prochainChangementLe, suggestions: resultat.suggestions };
}

/** Point 164 : photo de profil organisateur, distincte de la photo de
 * profil joueur — modifiable une fois par semaine. */
export async function photoOrganisateur(): Promise<string | undefined> {
  return (await chargerProfilOrganisateur()).photoUrl;
}

export async function definirPhotoOrganisateur(dataUrl: string): Promise<{ ok: boolean; erreur?: string; prochainChangementLe?: number }> {
  return patchProfilOrganisateur({ photoUrl: dataUrl });
}

/**
 * Nom d'organisateur (distinct du pseudo joueur), server-sourced (via
 * chargerProfilOrganisateur, même cache que tag/bio/bannière) — choisissable
 * dès la première session, sans attendre la certification (point 117) : la
 * vérification d'identité ne conditionne que les tournois payants, pas le
 * droit d'organiser tout court.
 */
export async function nomOrganisateur(): Promise<string | undefined> {
  return (await chargerProfilOrganisateur()).nomOrganisateur;
}

/** Choisit ou renomme le nom d'organisateur — unicité et limite "1
 * renommage par mois" vérifiées côté serveur en un seul aller-retour (cf.
 * definirNomOrganisateurServeur dans src/lib/server/organisateurProfil.ts) :
 * plus de vérification client contre une fausse liste statique, plus de
 * cooldown en localStorage contournable. */
export async function definirNomOrganisateur(
  nom: string,
): Promise<{ ok: boolean; erreur?: string; prochainChangementLe?: number; suggestions?: string[] }> {
  if (!nom.trim()) return { ok: false };
  return patchProfilOrganisateur({ nomOrganisateur: nom.trim() });
}

/** Identité organisateur utilisée partout où un tournoi doit être rattaché
 * à un organisateur (création, réputation, modération) : le nom
 * d'organisateur une fois choisi, sinon le pseudo joueur en repli. */
export async function nomOrganisateurActuel(): Promise<string> {
  return (await nomOrganisateur()) ?? lireProfil().pseudo;
}

export async function onboardingOrganisateurComplet(): Promise<boolean> {
  return Boolean(await nomOrganisateur());
}

/** Un organisateur standard ne peut créer que des tournois gratuits à
 * l'inscription (points 117, 167) — la certification reste requise pour les
 * tournois payants et la commission qui va avec. */
export async function peutCreerTournoiPayantSelonCertification(): Promise<boolean> {
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
  return (await estCertifie()) && (await estOrganisateurApprouve());
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
 * personnel, bio et bannière — server-sourced comme le nom d'organisateur
 * ci-dessus (même chargerProfilOrganisateur()), mais le cache local ne
 * contient que les données DU COMPTE CONNECTÉ : affichables uniquement sur
 * le profil "cestMoi", pas sur celui d'un autre organisateur consulté
 * depuis cet appareil (qui, lui, vient de GET /api/organisateur/[nom]).
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
