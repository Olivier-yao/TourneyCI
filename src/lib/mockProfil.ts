/**
 * Données mock pour la phase 6 du chantier V2 (profil + classement).
 */

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

export const MON_PROFIL: Profil = {
  pseudo: "Kader B.",
  ville: "Abidjan",
  rang: "Légende",
  rangNational: 14,
  matchsJoues: 86,
  victoires: 61,
};

const CLE_PROFIL_MODIFIE = "tourney-profil-modifie";

/** Profil de base (pseudo/ville/photo) sans le grade calculé — utilisé en
 * interne pour éviter une boucle infinie avec calculerGrade()/lireProfil(). */
function profilBase(): Profil {
  if (typeof window === "undefined") return MON_PROFIL;
  try {
    const brut = localStorage.getItem(CLE_PROFIL_MODIFIE);
    const surcharge = brut ? (JSON.parse(brut) as Partial<Profil>) : {};
    return { ...MON_PROFIL, ...surcharge };
  } catch {
    return MON_PROFIL;
  }
}

/** Fusionne MON_PROFIL avec les surcharges (pseudo/ville) enregistrées en
 * localStorage, et recalcule le grade (point 66) selon les matchs joués et
 * les points cumulés au classement. */
export function lireProfil(): Profil {
  const base = profilBase();
  const points = mesPointsCumules();
  return { ...base, rang: calculerGrade(base.matchsJoues, points) };
}

type PalierGrade = { nom: Rang; matchs: number; points: number };

/**
 * Paliers de progression (point 66), du plus haut au plus bas : un joueur
 * atteint un palier dès qu'il remplit L'UNE des deux conditions (matchs
 * joués OU points cumulés au classement toutes disciplines confondues) —
 * on retient le palier le plus élevé atteint par au moins un des critères.
 */
const PALIERS_GRADE: PalierGrade[] = [
  { nom: "Légende", matchs: 100, points: 6000 },
  { nom: "Élite", matchs: 60, points: 3000 },
  { nom: "Expert", matchs: 30, points: 1200 },
  { nom: "Confirmé", matchs: 15, points: 500 },
  { nom: "Amateur", matchs: 5, points: 150 },
  { nom: "Débutant", matchs: 0, points: 0 },
];

export function calculerGrade(matchsJoues: number, pointsCumules: number): Rang {
  for (const palier of PALIERS_GRADE) {
    if (matchsJoues >= palier.matchs || pointsCumules >= palier.points) return palier.nom;
  }
  return "Débutant";
}

function lireSurcharge(): Partial<Profil> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_PROFIL_MODIFIE);
    return brut ? (JSON.parse(brut) as Partial<Profil>) : {};
  } catch {
    return {};
  }
}

/** Seuil de matchs joués à partir duquel un profil est considéré "actif"
 * (participation régulière aux tournois). */
const SEUIL_MATCHS_ACTIF = 15;

export function estActif(matchsJoues: number): boolean {
  return matchsJoues >= SEUIL_MATCHS_ACTIF;
}

export function sauvegarderProfil(donnees: { pseudo: string; ville: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_PROFIL_MODIFIE, JSON.stringify({ ...lireSurcharge(), ...donnees }));
}

export function sauvegarderPhoto(photoUrl: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_PROFIL_MODIFIE, JSON.stringify({ ...lireSurcharge(), photoUrl }));
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

export const VILLES = ["Abidjan", "Bouaké", "Yamoussoukro", "Cocody", "Yopougon"];

export const CLASSEMENTS: Record<string, ClassementEntree[]> = {
  eafc: [
    { position: 1, initiales: "SD", nom: "Sory D.", points: 2480, ville: "Abidjan" },
    { position: 2, initiales: "AY", nom: "Aya K.", points: 2310, ville: "Cocody" },
    { position: 3, initiales: "IT", nom: "Ismaël T.", points: 2205, ville: "Abidjan" },
    { position: 4, initiales: "MK", nom: "Malik K.", points: 2140, ville: "Yopougon" },
    { position: 5, initiales: "FT", nom: "Fatou T.", points: 2090, ville: "Bouaké" },
    { position: 14, initiales: "KB", nom: "Kader B.", points: 1780, ville: "Abidjan", moi: true },
  ],
  freefire: [
    { position: 1, initiales: "GO", nom: "Gohou", points: 3120, ville: "Cocody" },
    { position: 2, initiales: "HL", nom: "Halima", points: 2950, ville: "Abidjan" },
    { position: 3, initiales: "KB", nom: "Kader B.", points: 2790, ville: "Abidjan", moi: true },
    { position: 4, initiales: "FT", nom: "Fatou T.", points: 2600, ville: "Bouaké" },
    { position: 5, initiales: "NR", nom: "Nour", points: 2510, ville: "Yamoussoukro" },
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
function mesPointsCumules(): number {
  let total = 0;
  for (const jeuId of Object.keys(CLASSEMENTS)) {
    const entree = classementDuJeu(jeuId).find((e) => e.moi);
    if (entree) total += entree.points;
  }
  return total;
}
