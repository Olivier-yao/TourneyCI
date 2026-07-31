/**
 * Données mock pour le chantier V2 (accueil + détail tournoi).
 * Pas de backend : à remplacer par de vraies requêtes Supabase en phase 8.
 * Les tournois créés par un organisateur sont persistés en localStorage
 * (mêmes limites que src/lib/mockAuth.ts : local au navigateur, pas partagé
 * entre appareils tant que la phase 8 n'est pas faite).
 */

export type TypeCompetition = "1v1" | "equipes" | "battle_royale";
export type Modalite = "virtuel" | "presentiel";
export type ModeEquipe = "libre" | "predefinies";

export type EquipeInfo = { id: string; nom: string };

export type RepartitionCashPrize = {
  label: string;
  montantXof: number;
};

export type Tournoi = {
  id: string;
  jeuId: string;
  jeuLabel: string;
  titre: string;
  organisateur: string;
  format: string;
  type: TypeCompetition;
  modalite: Modalite;
  ville: string;
  dateLabel: string;
  cashPrizeXof: number;
  fraisXof: number;
  placesInscrites: number;
  placesTotal: number;
  checkin: string;
  enDirect: boolean;
  reglement: string;
  inscrits: string[];
  equipes?: EquipeInfo[];
  modeEquipe?: ModeEquipe;
  repartitionCashPrize?: RepartitionCashPrize[];
};

/** Commission de l'organisateur sur les tournois payants, en plus du cash prize. */
export const COMMISSION_PCT = 0.05;

export function commissionEstimee(fraisXof: number, placesTotal: number): number {
  return Math.round(fraisXof * placesTotal * COMMISSION_PCT);
}

/**
 * Liste indicative pour les chips de filtre. Un organisateur n'est pas
 * limité à cette liste : il peut saisir n'importe quel nom de jeu via
 * l'option "Autre" du formulaire de création.
 */
export const JEUX: { id: string; label: string }[] = [
  { id: "eafc", label: "EA FC" },
  { id: "freefire", label: "Free Fire" },
  { id: "codm", label: "CODM" },
  { id: "tekken", label: "Tekken" },
  { id: "pubgm", label: "PUBG Mobile" },
  { id: "mlbb", label: "Mobile Legends" },
  { id: "bloodstrike", label: "Bloodstrike" },
  { id: "farlight84", label: "Farlight 84" },
  { id: "valorant", label: "Valorant" },
  { id: "wildrift", label: "LoL: Wild Rift" },
  { id: "fortnite", label: "Fortnite" },
  { id: "brawlstars", label: "Brawl Stars" },
  { id: "clashroyale", label: "Clash Royale" },
  { id: "efootball", label: "eFootball" },
  { id: "nba2k", label: "NBA 2K" },
];

export const TOURNOIS: Tournoi[] = [
  {
    id: "abidjan-cup-12",
    jeuId: "eafc",
    jeuLabel: "EA FC 26",
    titre: "Abidjan Cup #12",
    organisateur: "Ivoire Esport",
    format: "1v1 · BO3",
    type: "1v1",
    modalite: "presentiel",
    ville: "Abidjan",
    dateLabel: "Samedi 21h00 GMT",
    cashPrizeXof: 500000,
    fraisXof: 2000,
    placesInscrites: 41,
    placesTotal: 64,
    checkin: "20h30",
    enDirect: true,
    reglement:
      "Élimination directe, BO3 en quarts, BO5 en finale. Score à signaler dans l'app avec capture d'écran.",
    inscrits: ["KB", "AY", "SD"],
  },
  {
    id: "ligue-yopougon",
    jeuId: "eafc",
    jeuLabel: "EA FC 26",
    titre: "Ligue Yopougon",
    organisateur: "Yop Gaming",
    format: "1v1 · BO1",
    type: "1v1",
    modalite: "presentiel",
    ville: "Yopougon",
    dateLabel: "Dimanche 18h00 GMT",
    cashPrizeXof: 150000,
    fraisXof: 1000,
    placesInscrites: 28,
    placesTotal: 64,
    checkin: "17h30",
    enDirect: false,
    reglement: "Élimination directe, BO1 jusqu'en demies, BO3 en finale.",
    inscrits: ["MK", "DL"],
  },
  {
    id: "freefire-night",
    jeuId: "freefire",
    jeuLabel: "Free Fire",
    titre: "Free Fire Night · Squad",
    organisateur: "Abidjan Battle Royale",
    format: "Battle Royale · 50 joueurs",
    type: "battle_royale",
    modalite: "presentiel",
    ville: "Cocody",
    dateLabel: "Vendredi 20h00 GMT",
    cashPrizeXof: 100000,
    fraisXof: 0,
    placesInscrites: 11,
    placesTotal: 50,
    checkin: "19h30",
    enDirect: false,
    reglement: "Manche unique, élimination au fur et à mesure. Gratuit, places limitées.",
    inscrits: ["FT", "GO", "HL"],
  },
  {
    id: "codm-showdown",
    jeuId: "codm",
    jeuLabel: "Call of Duty Mobile",
    titre: "CODM Showdown",
    organisateur: "War Room CI",
    format: "Équipes · 5v5",
    type: "equipes",
    modalite: "presentiel",
    ville: "Bouaké",
    dateLabel: "Samedi 15h00 GMT",
    cashPrizeXof: 200000,
    fraisXof: 3000,
    placesInscrites: 9,
    placesTotal: 16,
    checkin: "14h30",
    enDirect: false,
    reglement: "Poules puis élimination directe. BO3 dès les quarts.",
    inscrits: ["NR"],
    modeEquipe: "libre",
  },
  {
    id: "tekken-clash",
    jeuId: "tekken",
    jeuLabel: "Tekken 8",
    titre: "Tekken Clash Yamoussoukro",
    organisateur: "FGC Côte d'Ivoire",
    format: "1v1 · BO5",
    type: "1v1",
    modalite: "virtuel",
    ville: "En ligne",
    dateLabel: "Dimanche 14h00 GMT",
    cashPrizeXof: 75000,
    fraisXof: 1500,
    placesInscrites: 14,
    placesTotal: 32,
    checkin: "13h30",
    enDirect: false,
    reglement: "Élimination directe, BO5 sur tous les tours.",
    inscrits: ["ZK", "PT"],
  },
];

const CLE_TOURNOIS_CREES = "tourneyci-tournois-crees";

function lireTournoisCrees(): Tournoi[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_TOURNOIS_CREES);
    return brut ? (JSON.parse(brut) as Tournoi[]) : [];
  } catch {
    return [];
  }
}

const CLE_INSCRITS_SUPPLEMENTAIRES = "tourneyci-inscrits-supplementaires";

function lireInscritsSupplementaires(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_INSCRITS_SUPPLEMENTAIRES);
    return brut ? (JSON.parse(brut) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** Incrémente le compteur d'inscrits d'un tournoi (mock : pas de vraie table
 * de participants, juste un compteur superposé en localStorage). */
export function incrementerInscrits(tournoiId: string) {
  if (typeof window === "undefined") return;
  const supplements = lireInscritsSupplementaires();
  supplements[tournoiId] = (supplements[tournoiId] ?? 0) + 1;
  localStorage.setItem(CLE_INSCRITS_SUPPLEMENTAIRES, JSON.stringify(supplements));
}

function avecInscritsSupplementaires(tournois: Tournoi[]): Tournoi[] {
  const supplements = lireInscritsSupplementaires();
  if (Object.keys(supplements).length === 0) return tournois;
  return tournois.map((t) =>
    supplements[t.id]
      ? { ...t, placesInscrites: t.placesInscrites + supplements[t.id] }
      : t,
  );
}

export function tousLesTournois(): Tournoi[] {
  return avecInscritsSupplementaires([...lireTournoisCrees(), ...TOURNOIS]);
}

export function tournoiParId(id: string): Tournoi | undefined {
  return tousLesTournois().find((t) => t.id === id);
}

export function creerTournoi(donnees: Omit<Tournoi, "id" | "placesInscrites">): Tournoi {
  const tournoi: Tournoi = {
    ...donnees,
    id: `${donnees.titre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`,
    placesInscrites: 0,
  };
  const existants = lireTournoisCrees();
  if (typeof window !== "undefined") {
    localStorage.setItem(
      CLE_TOURNOIS_CREES,
      JSON.stringify([tournoi, ...existants]),
    );
  }
  return tournoi;
}

export function mesTournoisOrganises(): Tournoi[] {
  return lireTournoisCrees();
}
