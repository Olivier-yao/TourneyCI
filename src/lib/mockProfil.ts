/**
 * Données mock pour la phase 6 du chantier V2 (profil + classement).
 *
 * Le profil lui-même (pseudo/ville/photo) n'est plus mock : il vient de
 * /api/profil (table Postgres profiles, cf. ROADMAP-backend-et-mobile.md).
 * lireProfil() reste volontairement SYNCHRONE — comme sessionActuelle dans
 * mockAuth.ts, un cache module-level est rempli en tâche de fond par un
 * fetch, et rafraîchi à chaque changement de compte connecté (onAuthStateChange),
 * pour que les ~25 écrans qui appellent lireProfil().pseudo n'aient rien à
 * changer. Seuls les écrans qui ENREGISTRENT (bienvenue-profil, paramètres)
 * doivent gérer sauvegarderProfil()/sauvegarderPhoto() comme des appels async.
 */

import { creerClientSupabaseNavigateur } from "./supabase/client";

export type Rang = "Débutant" | "Amateur" | "Confirmé" | "Expert" | "Élite" | "Légende";

export type Profil = {
  pseudo: string;
  ville: string;
  rang: Rang;
  rangNational: number;
  matchsJoues: number;
  victoires: number;
  photoUrl?: string;
};

/** Base de démo : matchsJoues/victoires/rangNational ne sont pas encore
 * suivis par un vrai backend (aucun historique de match réel n'est stocké
 * nulle part) — ces trois champs restent des valeurs figées tant que ce
 * domaine n'est pas migré à son tour. */
export const MON_PROFIL: Profil = {
  pseudo: "Kader B.",
  ville: "Abidjan",
  rang: "Légende",
  rangNational: 14,
  matchsJoues: 86,
  victoires: 61,
};

type SurchargeServeur = { pseudo?: string; ville?: string; photoUrl?: string; reglementAccepteLe?: string };

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
}): SurchargeServeur {
  return {
    pseudo: data.pseudo,
    ville: data.villes?.nom,
    photoUrl: data.photo_url ?? undefined,
    reglementAccepteLe: data.reglement_interieur_accepte_le ?? undefined,
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

/** Profil de base (pseudo/ville/photo) sans le grade calculé — utilisé en
 * interne pour éviter une boucle infinie avec calculerGrade()/lireProfil(). */
function profilBase(): Profil {
  return { ...MON_PROFIL, ...(surchargeCache ?? {}) };
}

/** Fusionne MON_PROFIL avec les données serveur (pseudo/ville/photo), et
 * recalcule le grade (point 66) selon les matchs joués et les points
 * cumulés au classement. */
export function lireProfil(): Profil {
  const base = profilBase();
  const points = mesPointsCumules();
  return { ...base, rang: calculerGrade(base.matchsJoues, points) };
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

/** Recherche un profil connu (données de démo, mono-appareil) dont le TAG
 * dérivé correspond exactement — utilisée pour l'invitation en équipe par
 * TAG (point 192). Exclut "moi" : on ne s'invite pas soi-même. */
export function joueurParTag(tag: string): { nom: string } | undefined {
  const cible = tag.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (!cible) return undefined;
  const moi = profilBase().pseudo;
  const nom = pseudosDejaPris().find((n) => n !== moi && tagDeJoueur(n) === cible);
  return nom ? { nom } : undefined;
}

/** Pseudos déjà "pris" par d'autres joueurs — dérivé des données de
 * classement de démo (mono-appareil : pas de vrai registre partagé tant
 * qu'il n'y a pas de backend, phase 8). Exclut la ligne "moi" pour ne pas se
 * bloquer soi-même. */
function pseudosDejaPris(): string[] {
  return Object.values(CLASSEMENTS)
    .flat()
    .filter((e) => !e.moi)
    .map((e) => e.nom);
}

/** Point 154 : un pseudo saisi ne doit pas déjà être utilisé par un autre
 * joueur (comparaison insensible à la casse). */
export function pseudoDisponible(pseudo: string): boolean {
  const cible = pseudo.trim().toLowerCase();
  if (!cible) return false;
  return !pseudosDejaPris().some((n) => n.toLowerCase() === cible);
}

/** Alternatives disponibles à partir d'un pseudo déjà pris (chiffre ou
 * underscore ajouté), pour proposer un choix immédiat sans obliger à
 * ressaisir de zéro. */
export function suggererPseudosDisponibles(pseudo: string, nombre = 3): string[] {
  const base = pseudo.trim();
  if (!base) return [];
  const candidats = [`${base}_`, ...Array.from({ length: 20 }, (_, i) => `${base}${i + 1}`)];
  const suggestions: string[] = [];
  for (const candidat of candidats) {
    if (suggestions.length >= nombre) break;
    if (pseudoDisponible(candidat)) suggestions.push(candidat);
  }
  return suggestions;
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

export type HistoriqueEntree = {
  id: string;
  adversaire: string;
  resultat: "victoire" | "defaite";
  score: string;
  tournoi: string;
  dateLabel: string;
};

export const HISTORIQUE: HistoriqueEntree[] = [
  {
    id: "h1",
    adversaire: "Sory D.",
    resultat: "victoire",
    score: "2 - 1",
    tournoi: "Abidjan Cup #12",
    dateLabel: "Il y a 2 jours",
  },
  {
    id: "h2",
    adversaire: "Yao M.",
    resultat: "victoire",
    score: "3 - 1",
    tournoi: "Abidjan Cup #12",
    dateLabel: "Il y a 2 jours",
  },
  {
    id: "h3",
    adversaire: "Fofana",
    resultat: "defaite",
    score: "1 - 2",
    tournoi: "Ligue Yopougon",
    dateLabel: "La semaine dernière",
  },
];

export type ClassementEntree = {
  position: number;
  initiales: string;
  nom: string;
  points: number;
  ville: string;
  moi?: boolean;
};

export const CLASSEMENTS: Record<string, ClassementEntree[]> = {
  eafc: [
    { position: 1, initiales: "SD", nom: "Sory D.", points: 2480, ville: "Abidjan" },
    { position: 2, initiales: "AY", nom: "Aya K.", points: 2310, ville: "Cocody" },
    { position: 3, initiales: "IT", nom: "Ismaël T.", points: 2205, ville: "Abidjan" },
    { position: 4, initiales: "MK", nom: "Malik K.", points: 2140, ville: "Yopougon" },
    { position: 5, initiales: "FT", nom: "Fatou T.", points: 2090, ville: "Bouaké" },
    { position: 6, initiales: "MD", nom: "Moussa D.", points: 2020, ville: "Dakar" },
    { position: 7, initiales: "KO", nom: "Koffi O.", points: 1950, ville: "Accra" },
    { position: 14, initiales: "KB", nom: "Kader B.", points: 1780, ville: "Abidjan", moi: true },
  ],
  freefire: [
    { position: 1, initiales: "GO", nom: "Gohou", points: 3120, ville: "Cocody" },
    { position: 2, initiales: "HL", nom: "Halima", points: 2950, ville: "Abidjan" },
    { position: 3, initiales: "KB", nom: "Kader B.", points: 2790, ville: "Abidjan", moi: true },
    { position: 4, initiales: "FT", nom: "Fatou T.", points: 2600, ville: "Bouaké" },
    { position: 5, initiales: "NR", nom: "Nour", points: 2510, ville: "Yamoussoukro" },
    { position: 6, initiales: "CB", nom: "Chidi B.", points: 2440, ville: "Lagos" },
    { position: 7, initiales: "AT", nom: "Aminata T.", points: 2380, ville: "Bamako" },
  ],
  codm: [
    { position: 1, initiales: "NR", nom: "Nour", points: 1980, ville: "Yamoussoukro" },
    { position: 2, initiales: "ZK", nom: "Zeka", points: 1870, ville: "Bouaké" },
    { position: 3, initiales: "PT", nom: "Petit", points: 1790, ville: "Yamoussoukro" },
    { position: 4, initiales: "KB", nom: "Kader B.", points: 1650, ville: "Abidjan", moi: true },
  ],
  tekken: [
    { position: 1, initiales: "PT", nom: "Petit", points: 2210, ville: "Yamoussoukro" },
    { position: 2, initiales: "ZK", nom: "Zeka", points: 2050, ville: "Bouaké" },
    { position: 3, initiales: "DL", nom: "Delta", points: 1980, ville: "Yopougon" },
  ],
};

export const SAISON = "Saison 3 : Éclipse";
/** Les classements se réinitialisent chaque saison (1-2 mois). Purement
 * indicatif tant qu'il n'y a pas de vrai backend planifié (phase 8) : rien
 * ne se réinitialise automatiquement ici. */
export const SAISON_FIN_LABEL = "se termine dans 18 jours";

/** Classement partagé (pas de cleCompte()) : les points sont attribués à des
 * joueurs nommés, pas au compte connecté — la ligne "moi" n'en est qu'une
 * parmi d'autres, le reste doit rester visible identiquement pour tous les
 * comptes qui consultent ce classement. */
const CLE_POINTS_ATTRIBUES = "tourney-points-attribues";

function lirePointsAttribues(): Record<string, ClassementEntree[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_POINTS_ATTRIBUES);
    return brut ? (JSON.parse(brut) as Record<string, ClassementEntree[]>) : {};
  } catch {
    return {};
  }
}

function initiales(nom: string): string {
  return nom
    .split(" ")
    .map((m) => m[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Points attribués par un organisateur pendant/après un tournoi (ex. classement
 * final d'un battle royale, résultat d'un bracket). Cumulés par joueur+jeu,
 * fusionnés avec le classement de base à la lecture. */
export function attribuerPoints(jeuId: string, nom: string, points: number, ville: string) {
  if (typeof window === "undefined" || !nom.trim() || points === 0) return;
  const tout = lirePointsAttribues();
  const liste = tout[jeuId] ?? [];
  const existant = liste.find((e) => e.nom.toLowerCase() === nom.trim().toLowerCase());
  if (existant) {
    existant.points += points;
  } else {
    liste.push({ position: 0, initiales: initiales(nom.trim()), nom: nom.trim(), points, ville });
  }
  localStorage.setItem(CLE_POINTS_ATTRIBUES, JSON.stringify({ ...tout, [jeuId]: liste }));
}

/** Classement de base + points attribués localement, refusionnés en un seul
 * classement trié et re-numéroté pour un jeu donné. */
export function classementDuJeu(jeuId: string): ClassementEntree[] {
  const base = CLASSEMENTS[jeuId] ?? [];
  const attribues = lirePointsAttribues()[jeuId] ?? [];
  const fusion = base.map((e) => ({ ...e }));
  for (const entree of attribues) {
    const existant = fusion.find((e) => e.nom.toLowerCase() === entree.nom.toLowerCase());
    if (existant) existant.points += entree.points;
    else fusion.push(entree);
  }
  // La ligne "moi" affiche toujours le pseudo actuel (source unique = le
  // profil), pas le nom figé dans les données de seed.
  const monPseudo = profilBase().pseudo;
  const avecPseudoActuel = fusion.map((e) => (e.moi ? { ...e, nom: monPseudo, initiales: initiales(monPseudo) } : e));
  return avecPseudoActuel.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, position: i + 1 }));
}

/** Somme des points "moi" à travers tous les jeux classés — signal utilisé
 * par calculerGrade() en complément des matchs joués. */
export function mesPointsCumules(): number {
  let total = 0;
  for (const jeuId of Object.keys(CLASSEMENTS)) {
    const entree = classementDuJeu(jeuId).find((e) => e.moi);
    if (entree) total += entree.points;
  }
  return total;
}
