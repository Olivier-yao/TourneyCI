/**
 * Données mock pour la phase 6 du chantier V2 (profil + classement).
 *
 * Le profil (pseudo/ville/photo) et les stats de progression
 * (matchsJoues/victoires/points cumulés/rang national) viennent tous de
 * /api/profil (table Postgres profiles + points_classement, cf.
 * src/lib/server/classement.ts). lireProfil() reste volontairement
 * SYNCHRONE — comme sessionActuelle dans mockAuth.ts, un cache module-level
 * est rempli en tâche de fond par un fetch, et rafraîchi à chaque
 * changement de compte connecté (onAuthStateChange) ou sauvegarde, pour que
 * les écrans qui appellent lireProfil() n'aient rien à changer.
 *
 * Le classement (CLASSEMENTS/attribuerPoints) était jusqu'ici entièrement
 * localStorage : jamais partagé d'un appareil à l'autre, et les points
 * n'étaient attribués que sur l'appareil ayant déclenché la clôture du
 * tournoi. Les points sont désormais attribués server-side à la clôture
 * (cf. appliquerProgressionEtPoints dans src/lib/server/cloture.ts) et lus
 * via GET /api/classement (classementGlobal, tous jeux confondus — cet
 * écran n'a jamais affiché de classement par jeu séparé).
 */

import { creerClientSupabaseNavigateur } from "./supabase/client";

export type Rang = "Débutant" | "Amateur" | "Confirmé" | "Expert" | "Élite" | "Légende";

export type Profil = {
  pseudo: string;
  ville: string;
  rang: Rang;
  rangNational?: number;
  matchsJoues: number;
  victoires: number;
  photoUrl?: string;
};

const PROFIL_VIDE = {
  pseudo: "",
  ville: "",
  matchsJoues: 0,
  victoires: 0,
  pointsCumules: 0,
  rangNational: undefined as number | undefined,
  photoUrl: undefined as string | undefined,
};

type SurchargeServeur = {
  pseudo?: string;
  ville?: string;
  photoUrl?: string;
  reglementAccepteLe?: string;
  matchsJoues?: number;
  victoires?: number;
  pointsCumules?: number;
  rangNational?: number;
};

/** null = aucun profil serveur pour ce compte (ou pas encore chargé). */
let surchargeCache: SurchargeServeur | null = null;
let profilInitialise = false;
let resoudreProfilInitialise: (() => void) | null = null;
const initialisationProfil = new Promise<void>((resolve) => {
  resoudreProfilInitialise = resolve;
});

function marquerInitialise() {
  if (!profilInitialise) {
    profilInitialise = true;
    resoudreProfilInitialise?.();
  }
}

function surchargeDepuisReponse(data: {
  pseudo: string;
  photo_url: string | null;
  villes: { nom: string } | null;
  reglement_interieur_accepte_le: string | null;
  matchs_joues: number;
  victoires: number;
  points_cumules: number;
  rang_national?: number;
}): SurchargeServeur {
  return {
    pseudo: data.pseudo,
    ville: data.villes?.nom,
    photoUrl: data.photo_url ?? undefined,
    reglementAccepteLe: data.reglement_interieur_accepte_le ?? undefined,
    matchsJoues: data.matchs_joues,
    victoires: data.victoires,
    pointsCumules: data.points_cumules,
    rangNational: data.rang_national,
  };
}

async function rafraichirProfilServeur() {
  try {
    const reponse = await fetch("/api/profil");
    const json = await reponse.json();
    surchargeCache = json.success && json.data ? surchargeDepuisReponse(json.data) : null;
  } catch {
    surchargeCache = null;
  } finally {
    marquerInitialise();
  }
}

if (typeof window !== "undefined") {
  creerClientSupabaseNavigateur().auth.onAuthStateChange((_evenement, session) => {
    if (session?.user) {
      rafraichirProfilServeur();
    } else {
      surchargeCache = null;
      marquerInitialise();
    }
  });
}

/** À attendre avant de traiter profilExiste()/lireProfil() comme définitifs
 * (juste après une connexion, le premier fetch peut être encore en vol). */
export async function attendreProfil(): Promise<void> {
  if (profilInitialise) return;
  await initialisationProfil;
}

/** Un profil serveur existe pour le compte connecté — remplace l'ancien
 * flag localStorage profilInitialComplet() : l'existence de la ligne EST la
 * complétude, pas besoin d'un drapeau séparé à poser après coup. */
export function profilExiste(): boolean {
  return surchargeCache !== null;
}

/** Point 147 : acceptation obligatoire du règlement intérieur, une seule
 * fois par COMPTE (pas par appareil) — remplace l'ancien flag localStorage
 * de mockAuth.ts, qui redemandait le règlement à chaque nouvel appareil ou
 * navigateur puisqu'il ne vivait jamais côté serveur. */
export function reglementAccepte(): boolean {
  return !!surchargeCache?.reglementAccepteLe;
}

export async function marquerReglementAccepte(): Promise<ResultatSauvegardeProfil> {
  const reponse = await fetch("/api/profil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reglementAccepte: true }),
  });
  const json = await reponse.json();
  if (!json.success) return { ok: false, erreur: json.error };
  surchargeCache = surchargeDepuisReponse(json.data);
  marquerInitialise();
  return { ok: true };
}

/** Fusionne les valeurs par défaut avec les données serveur, et recalcule le
 * grade (point 66) selon les matchs joués et les points cumulés au
 * classement. */
export function lireProfil(): Profil {
  const base = { ...PROFIL_VIDE, ...(surchargeCache ?? {}) };
  return {
    pseudo: base.pseudo,
    ville: base.ville,
    photoUrl: base.photoUrl,
    matchsJoues: base.matchsJoues,
    victoires: base.victoires,
    rangNational: base.rangNational,
    rang: calculerGrade(base.matchsJoues, base.pointsCumules),
  };
}

export type DefinitionPalier = { id: number; nom: Rang; matchsRequis: number; pointsRequis: number };

/**
 * Paliers de progression (point 66) : un joueur n'atteint un palier que s'il
 * remplit LES DEUX conditions (matchs joués ET points cumulés au classement
 * toutes disciplines confondues) — pas seulement l'une des deux, sinon un
 * joueur très actif mais peu performant "saute" des paliers sur le seul
 * volume de matchs.
 */
export const PALIERS: DefinitionPalier[] = [
  { id: 0, nom: "Débutant", matchsRequis: 0, pointsRequis: 0 },
  { id: 1, nom: "Amateur", matchsRequis: 10, pointsRequis: 120 },
  { id: 2, nom: "Confirmé", matchsRequis: 30, pointsRequis: 450 },
  { id: 3, nom: "Expert", matchsRequis: 55, pointsRequis: 900 },
  { id: 4, nom: "Élite", matchsRequis: 80, pointsRequis: 1500 },
  { id: 5, nom: "Légende", matchsRequis: 120, pointsRequis: 2500 },
];

export function palierActuel(matchsJoues: number, pointsCumules: number): DefinitionPalier {
  let atteint = PALIERS[0];
  for (const p of PALIERS) {
    if (matchsJoues >= p.matchsRequis && pointsCumules >= p.pointsRequis) atteint = p;
  }
  return atteint;
}

export function palierSuivant(id: number): DefinitionPalier | undefined {
  return PALIERS.find((p) => p.id === id + 1);
}

export function calculerGrade(matchsJoues: number, pointsCumules: number): Rang {
  return palierActuel(matchsJoues, pointsCumules).nom;
}

/** Approximation à partir des seuls points (classement, palmarès affichés
 * pour d'autres joueurs dont on ne connaît pas le nombre de matchs joués). */
export function palierParPoints(pointsCumules: number): DefinitionPalier {
  let atteint = PALIERS[0];
  for (const p of PALIERS) {
    if (pointsCumules >= p.pointsRequis) atteint = p;
  }
  return atteint;
}

/** Seuil de matchs joués à partir duquel un profil est considéré "actif"
 * (participation régulière aux tournois). */
const SEUIL_MATCHS_ACTIF = 15;

export function estActif(matchsJoues: number): boolean {
  return matchsJoues >= SEUIL_MATCHS_ACTIF;
}

/** TAG dérivé du pseudo (point 192) : identifiant stable, insensible à la
 * casse et aux espaces, utilisé pour rechercher un profil (ex. invitation en
 * équipe) sans exposer/dupliquer le pseudo affiché. Même formule que la
 * page profil joueur (joueur/[nom]). */
export function tagDeJoueur(nom: string): string {
  return nom.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** Points cumulés (tous jeux confondus) du compte connecté — lu depuis le
 * cache serveur (même fraîcheur que lireProfil()), jamais un fetch séparé. */
export function mesPointsCumules(): number {
  return surchargeCache?.pointsCumules ?? 0;
}

export type ClassementEntree = {
  position: number;
  initiales: string;
  nom: string;
  points: number;
  ville: string;
  moi?: boolean;
};

/** Classement global réel (tous jeux confondus), GET /api/classement — le
 * ladder n'a jamais affiché de classement par jeu séparé, seulement filtré
 * par pays/ville côté client (cf. Classement.tsx). */
export async function classementGlobal(): Promise<ClassementEntree[]> {
  const reponse = await fetch("/api/classement");
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return [];
  const lignes: { profileId: string; pseudo: string; initiales: string; ville?: string; points: number; moi?: boolean }[] = json.data;
  return lignes.map((l, i) => ({ position: i + 1, initiales: l.initiales, nom: l.pseudo, points: l.points, ville: l.ville ?? "", moi: l.moi }));
}

export type StatsJoueurPublic = { pseudo: string; ville: string; photoUrl?: string; matchsJoues: number; victoires: number; points: number; rangNational?: number };

/** Stats publiques d'un joueur (fiche /joueur/[nom]) par pseudo, réel que ce
 * soit "moi" ou un autre compte — GET /api/joueurs/[pseudo]. */
export async function statsJoueurParPseudo(pseudo: string): Promise<StatsJoueurPublic | undefined> {
  const reponse = await fetch(`/api/joueurs/${encodeURIComponent(pseudo)}`);
  if (!reponse.ok) return undefined;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : undefined;
}

async function pseudosDejaPris(candidats: string[]): Promise<Set<string>> {
  if (candidats.length === 0) return new Set();
  const reponse = await fetch(`/api/pseudos-disponibles?candidats=${encodeURIComponent(candidats.join(","))}`);
  if (!reponse.ok) return new Set();
  const json = await reponse.json().catch(() => null);
  const pris: string[] = json?.success ? json.data.pris : [];
  return new Set(pris.map((p) => p.toLowerCase()));
}

/** Point 154 : un pseudo saisi ne doit pas déjà être utilisé par un autre
 * joueur (comparaison insensible à la casse) — vérifié en direct contre les
 * vrais comptes (GET /api/pseudos-disponibles). L'unicité définitive reste
 * imposée par la contrainte Postgres à l'enregistrement. */
export async function pseudoDisponible(pseudo: string): Promise<boolean> {
  const cible = pseudo.trim();
  if (!cible) return false;
  const pris = await pseudosDejaPris([cible]);
  return !pris.has(cible.toLowerCase());
}

/** Alternatives disponibles à partir d'un pseudo déjà pris (chiffre ou
 * underscore ajouté), pour proposer un choix immédiat sans obliger à
 * ressaisir de zéro. */
export async function suggererPseudosDisponibles(pseudo: string, nombre = 3): Promise<string[]> {
  const base = pseudo.trim();
  if (!base) return [];
  const candidats = [`${base}_`, ...Array.from({ length: 20 }, (_, i) => `${base}${i + 1}`)];
  const pris = await pseudosDejaPris(candidats);
  return candidats.filter((c) => !pris.has(c.toLowerCase())).slice(0, nombre);
}

export type ResultatSauvegardeProfil = { ok: boolean; erreur?: string; prochainChangementLe?: number };

/** Enregistre pseudo/ville via PUT /api/profil (créé la ligne si c'est la
 * toute première fois). Point 155 (pseudo modifiable 1×/mois) est désormais
 * appliqué côté serveur — la réponse renvoie prochainChangementLe si bloqué,
 * plus besoin d'un flag local séparé à poser après coup. */
export async function sauvegarderProfil(donnees: { pseudo: string; ville: string }): Promise<ResultatSauvegardeProfil> {
  const reponse = await fetch("/api/profil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donnees),
  });
  const json = await reponse.json();
  if (!json.success) return { ok: false, erreur: json.error, prochainChangementLe: json.prochainChangementLe };
  surchargeCache = surchargeDepuisReponse(json.data);
  marquerInitialise();
  return { ok: true };
}

export async function sauvegarderPhoto(photoUrl: string): Promise<ResultatSauvegardeProfil> {
  const reponse = await fetch("/api/profil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoUrl }),
  });
  const json = await reponse.json();
  if (!json.success) return { ok: false, erreur: json.error };
  surchargeCache = surchargeDepuisReponse(json.data);
  marquerInitialise();
  return { ok: true };
}

export const SAISON = "Saison 3 : Éclipse";
/** Les classements se réinitialisent chaque saison (1-2 mois). Purement
 * indicatif tant qu'il n'y a pas de vrai système de saison (points_classement
 * cumule indéfiniment aujourd'hui) : rien ne se réinitialise automatiquement. */
export const SAISON_FIN_LABEL = "se termine dans 18 jours";
