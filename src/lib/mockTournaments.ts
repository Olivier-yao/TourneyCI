/**
 * Données mock pour le chantier V2 (accueil + détail tournoi).
 * Pas de backend : à remplacer par de vraies requêtes Supabase en phase 8.
 * Les tournois créés par un organisateur sont persistés en localStorage
 * (mêmes limites que src/lib/mockAuth.ts : local au navigateur, pas partagé
 * entre appareils tant que la phase 8 n'est pas faite).
 */

import { classementFinalBracket } from "./mockBracket";
import { classementFinalBR } from "./mockBattleRoyale";
import { attribuerPoints, lireProfil } from "./mockProfil";
import { crediter } from "./mockWallet";
import { estCertifie } from "./mockOrganisateur";
import { estInscrit, inscriptionDe } from "./mockInscriptions";
import { notifierParticipants } from "./mockNotifications";
import { avisDuTournoi } from "./mockAvis";
import { appelOuvertPourTournoi } from "./mockAppel";

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
  code: string;
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
  /** Détails additionnels distincts du règlement (facultatif). */
  informations?: string;
  inscrits: string[];
  equipes?: EquipeInfo[];
  modeEquipe?: ModeEquipe;
  /** Sous-type Battle Royale (obligatoire quand type === "battle_royale"). */
  brSousType?: "solo" | "duo" | "squad";
  /** Origine du financement du cash prize : frais d'inscription des
   * participants (défaut) ou solde de l'organisateur (inscription gratuite). */
  financementCashPrize?: "inscriptions" | "organisateur";
  /** Commission organisateur activée pour ce tournoi payant (COMMISSION_PCT
   * des frais collectés, moins la part plateforme prélevée au versement). */
  commissionActivee?: boolean;
  repartitionCashPrize?: RepartitionCashPrize[];
  banniereUrl?: string;
  termine?: boolean;
  annule?: boolean;
  /** Horodatage (ms) de début du tournoi. */
  debutTournoiTs?: number;
  /** Horodatages (ms) optionnels renseignés par l'organisateur pour la fenêtre
   * d'inscription. Si absents, comportement par défaut (voir clotureEffectiveInscriptions). */
  debutInscriptionsTs?: number;
  finInscriptionsTs?: number;
};

const DELAI_VERROU_BRACKET_MS = 10 * 60 * 1000;
/** Marge par défaut avant le début du tournoi quand "Fin des inscriptions"
 * n'est pas renseignée (comprise dans la fourchette 15-10 min demandée). */
const MARGE_CLOTURE_PAR_DEFAUT_MS = 12 * 60 * 1000;

/** Moment effectif de clôture des inscriptions : la valeur explicite de
 * l'organisateur si renseignée, sinon 10-15 min avant le début du tournoi. */
export function clotureEffectiveInscriptions(
  tournoi: Pick<Tournoi, "finInscriptionsTs" | "debutTournoiTs">,
): number | undefined {
  if (tournoi.finInscriptionsTs) return tournoi.finInscriptionsTs;
  if (tournoi.debutTournoiTs) return tournoi.debutTournoiTs - MARGE_CLOTURE_PAR_DEFAUT_MS;
  return undefined;
}

/** Complet : la capacité fixée par l'organisateur est atteinte — les
 * inscriptions se ferment alors immédiatement, sans attendre la marge de
 * 10-15 min avant le début (point 76). */
export function tournoiComplet(tournoi: Pick<Tournoi, "placesInscrites" | "placesTotal">): boolean {
  return tournoi.placesTotal > 0 && tournoi.placesInscrites >= tournoi.placesTotal;
}

export function inscriptionsFermees(
  tournoi: Pick<Tournoi, "finInscriptionsTs" | "debutTournoiTs" | "placesInscrites" | "placesTotal">,
): boolean {
  if (tournoiComplet(tournoi)) return true;
  const cloture = clotureEffectiveInscriptions(tournoi);
  return cloture !== undefined && Date.now() >= cloture;
}

export function inscriptionsPasEncoreOuvertes(tournoi: Pick<Tournoi, "debutInscriptionsTs">): boolean {
  return tournoi.debutInscriptionsTs !== undefined && Date.now() < tournoi.debutInscriptionsTs;
}

/** La bracket reste masquée jusqu'à 10 min après la clôture effective des inscriptions. */
export function bracketVerrouillee(
  tournoi: Pick<Tournoi, "finInscriptionsTs" | "debutTournoiTs" | "placesInscrites" | "placesTotal">,
): boolean {
  // Un tournoi complet débloque l'accès en avance (point 76) : plus la peine
  // d'attendre la marge post-clôture puisque les inscriptions sont déjà closes.
  if (tournoiComplet(tournoi)) return false;
  const cloture = clotureEffectiveInscriptions(tournoi);
  if (cloture === undefined) return false;
  return Date.now() < cloture + DELAI_VERROU_BRACKET_MS;
}

/** Frais fixes payés par l'organisateur à la création d'un tournoi payant à
 * l'inscription (bloquant, distinct de la commission ci-dessous). */
export const FRAIS_CREATION_TOURNOI_PAYANT_XOF = 150;

/** Commission de l'organisateur sur les tournois payants (optionnelle,
 * activée tournoi par tournoi), en plus du cash prize. */
export const COMMISSION_PCT = 0.15;

export function commissionEstimee(fraisXof: number, placesTotal: number): number {
  return Math.round(fraisXof * placesTotal * COMMISSION_PCT);
}

/** Répartition automatique et dégressive du cash prize entre N finalistes
 * (point 82) : plus de saisie manuelle place par place — l'organisateur ne
 * choisit que le nombre de finalistes, l'app calcule les parts (poids en
 * 1/rang, comme un barème de prize pool esport classique). */
export function repartitionAutomatique(montantNetXof: number, nbFinalistes: number): RepartitionCashPrize[] {
  const n = Math.max(1, Math.min(Math.round(nbFinalistes) || 1, 20));
  const libelle = (i: number) => (i === 0 ? "1er" : i === 1 ? "2e" : i === 2 ? "3e" : `${i + 1}e`);
  if (n === 1) return [{ label: "Vainqueur", montantXof: montantNetXof }];
  const poids = Array.from({ length: n }, (_, i) => 1 / (i + 1));
  const totalPoids = poids.reduce((a, b) => a + b, 0);
  const montants = poids.map((p) => Math.round((p / totalPoids) * montantNetXof));
  const ecart = montantNetXof - montants.reduce((a, b) => a + b, 0);
  montants[montants.length - 1] += ecart;
  return montants.map((montantXof, i) => ({ label: libelle(i), montantXof }));
}

const CLE_TAUX_PLATEFORME = "tourney-taux-plateforme-commission";
const TAUX_PLATEFORME_DEFAUT = 0.2;

/** Part que la plateforme prélève sur la commission de l'organisateur
 * (configurable côté administration, pas un forfait fixe). */
export function tauxPlateformeSurCommission(): number {
  if (typeof window === "undefined") return TAUX_PLATEFORME_DEFAUT;
  const val = Number(localStorage.getItem(CLE_TAUX_PLATEFORME));
  return Number.isFinite(val) && val >= 0 && val <= 1 && localStorage.getItem(CLE_TAUX_PLATEFORME) !== null
    ? val
    : TAUX_PLATEFORME_DEFAUT;
}

export function definirTauxPlateformeSurCommission(taux: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_TAUX_PLATEFORME, String(Math.min(1, Math.max(0, taux))));
}

/** Décompose la commission organisateur : brute (part des frais collectés),
 * part prélevée par la plateforme, net réellement perçu par l'organisateur.
 * Le prélèvement n'a lieu qu'au moment du versement (fin de tournoi), jamais
 * à la création — l'organisateur ne peut donc jamais être en perte. */
export function decomposerCommission(fraisXof: number, placesTotal: number): { brute: number; partPlateforme: number; net: number } {
  const brute = commissionEstimee(fraisXof, placesTotal);
  const partPlateforme = Math.round(brute * tauxPlateformeSurCommission());
  return { brute, partPlateforme, net: brute - partPlateforme };
}

export type GenreJeu = "FPS" | "TPS" | "Combat" | "Sport" | "Battle Royale";

/**
 * Liste indicative pour les chips de filtre. Un organisateur n'est pas
 * limité à cette liste : il peut saisir n'importe quel nom de jeu via
 * l'option "Autre" du formulaire de création (dans ce cas, aucun genre
 * n'est présumé — le jeu n'apparaît simplement pas dans le filtre Type).
 */
export const JEUX: { id: string; label: string; genre: GenreJeu }[] = [
  { id: "eafc", label: "EA FC", genre: "Sport" },
  { id: "freefire", label: "Free Fire", genre: "Battle Royale" },
  { id: "codm", label: "CODM", genre: "FPS" },
  { id: "tekken", label: "Tekken", genre: "Combat" },
  { id: "pubgm", label: "PUBG Mobile", genre: "Battle Royale" },
  { id: "mlbb", label: "Mobile Legends", genre: "TPS" },
  { id: "bloodstrike", label: "Bloodstrike", genre: "Battle Royale" },
  { id: "farlight84", label: "Farlight 84", genre: "Battle Royale" },
  { id: "valorant", label: "Valorant", genre: "FPS" },
  { id: "wildrift", label: "LoL: Wild Rift", genre: "TPS" },
  { id: "fortnite", label: "Fortnite", genre: "Battle Royale" },
  { id: "brawlstars", label: "Brawl Stars", genre: "TPS" },
  { id: "clashroyale", label: "Clash Royale", genre: "Combat" },
  { id: "efootball", label: "eFootball", genre: "Sport" },
  { id: "nba2k", label: "NBA 2K", genre: "Sport" },
];

export const TYPES_JEU: GenreJeu[] = ["FPS", "TPS", "Combat", "Sport", "Battle Royale"];

/** Capacité technique maximale d'une lobby par jeu (Battle Royale) : plafond
 * que l'organisateur ne peut pas dépasser en choisissant son effectif. */
const CAPACITE_LOBBY_PAR_JEU: Record<string, number> = {
  freefire: 50,
  pubgm: 100,
  fortnite: 100,
  bloodstrike: 60,
  farlight84: 60,
};
const CAPACITE_LOBBY_DEFAUT = 50;

export function capaciteLobbyMax(jeuId: string): number {
  return CAPACITE_LOBBY_PAR_JEU[jeuId] ?? CAPACITE_LOBBY_DEFAUT;
}

export const MODES_JEU = ["1v1", "Team", "Battle Royale", "Recherche et destruction", "Capture de zone"] as const;
export type ModeJeu = (typeof MODES_JEU)[number];

export function genreDuJeu(jeuId: string): GenreJeu | undefined {
  return JEUX.find((j) => j.id === jeuId)?.genre;
}

export function modeDuTournoi(t: Pick<Tournoi, "type" | "format">): ModeJeu | undefined {
  if (t.type === "battle_royale") return "Battle Royale";
  if (t.type === "equipes") return "Team";
  if (t.type === "1v1") {
    if (/recherche et destruction/i.test(t.format)) return "Recherche et destruction";
    if (/capture de zone/i.test(t.format)) return "Capture de zone";
    return "1v1";
  }
  return undefined;
}

export const TOURNOIS: Tournoi[] = [
  {
    id: "abidjan-cup-12",
    code: "AC12X4",
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
    code: "LYP7B2",
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
    code: "FFN9K1",
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
    id: "br-solo-yopougon",
    code: "BRS7Q2",
    jeuId: "pubgm",
    jeuLabel: "PUBG Mobile",
    titre: "PUBG Solo Marathon",
    organisateur: "Yopougon Gaming",
    format: "Battle Royale · Solo · 50 joueurs",
    type: "battle_royale",
    modalite: "virtuel",
    ville: "Yopougon",
    dateLabel: "En cours",
    cashPrizeXof: 60000,
    fraisXof: 500,
    placesInscrites: 50,
    placesTotal: 50,
    checkin: "Terminé",
    enDirect: true,
    reglement: "Manches successives, barème de points cumulés. Les 25 meilleurs se qualifient.",
    inscrits: ["KB", "YM", "AK"],
    brSousType: "solo",
  },
  {
    id: "br-squad-treichville",
    code: "BRQ4M8",
    jeuId: "freefire",
    jeuLabel: "Free Fire",
    titre: "Free Fire Squad Wars",
    organisateur: "Treichville Esport",
    format: "Battle Royale · Squad · 48 joueurs (12 squads)",
    type: "battle_royale",
    modalite: "presentiel",
    ville: "Treichville",
    dateLabel: "En cours",
    cashPrizeXof: 150000,
    fraisXof: 1000,
    placesInscrites: 48,
    placesTotal: 48,
    checkin: "Terminé",
    enDirect: true,
    reglement: "Manches successives par squad de 4. Barème de points cumulés, top 6 squads qualifiés.",
    inscrits: ["Squad 1", "Squad 2", "Squad 3"],
    brSousType: "squad",
  },
  {
    id: "codm-showdown",
    code: "CDM5W3",
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
    code: "TKN4Y8",
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

const CLE_TOURNOIS_CREES = "tourney-tournois-crees";

function lireTournoisCrees(): Tournoi[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_TOURNOIS_CREES);
    if (!brut) return [];
    const tournois = JSON.parse(brut) as Tournoi[];
    // Rétrocompatibilité : les tournois créés avant l'ajout du champ "code"
    // n'en ont pas encore un — on leur en génère un et on le persiste,
    // sous peine d'un code qui change à chaque lecture.
    let modifie = false;
    const corriges = tournois.map((t) => {
      if (t.code) return t;
      modifie = true;
      return { ...t, code: genererCode() };
    });
    if (modifie) localStorage.setItem(CLE_TOURNOIS_CREES, JSON.stringify(corriges));
    return corriges;
  } catch {
    return [];
  }
}

const CLE_INSCRITS_SUPPLEMENTAIRES = "tourney-inscrits-supplementaires";

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

const CLE_TOURNOIS_TERMINES = "tourney-tournois-termines";
const CLE_TOURNOIS_ANNULES = "tourney-tournois-annules";

function lireListe(cle: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

function ajouterA(cle: string, id: string) {
  if (typeof window === "undefined") return;
  const liste = lireListe(cle);
  if (!liste.includes(id)) localStorage.setItem(cle, JSON.stringify([...liste, id]));
}

export function estTermine(id: string): boolean {
  return lireListe(CLE_TOURNOIS_TERMINES).includes(id);
}

export function estAnnule(id: string): boolean {
  return lireListe(CLE_TOURNOIS_ANNULES).includes(id);
}

/** Annule un tournoi (compte comme un "flop" pour le classement organisateur). */
/** Annule un tournoi et rembourse automatiquement les frais déjà payés par
 * l'inscrit de cet appareil (mock mono-utilisateur : pas de vrai registre
 * multi-comptes, seul le participant local peut être remboursé ici). */
export function annulerTournoi(id: string) {
  ajouterA(CLE_TOURNOIS_ANNULES, id);
  const tournoi = tournoiParId(id);
  if (tournoi && tournoi.fraisXof > 0 && estInscrit(id)) {
    crediter(tournoi.fraisXof, `Remboursement · ${tournoi.titre}`, "remboursement");
  }
}

function avecEtatsSuperposes(tournois: Tournoi[]): Tournoi[] {
  const supplements = lireInscritsSupplementaires();
  const termines = lireListe(CLE_TOURNOIS_TERMINES);
  const annules = lireListe(CLE_TOURNOIS_ANNULES);
  const profil = lireProfil();
  return tournois.map((t) => {
    const inscrits = t.inscrits;
    const inscription = estInscrit(t.id) ? inscriptionDe(t.id) : undefined;
    const monNom = inscription ? (inscription.equipe ?? inscription.tag ?? profil.pseudo) : null;
    return {
      ...t,
      placesInscrites: t.placesInscrites + (supplements[t.id] ?? 0),
      termine: t.termine || termines.includes(t.id),
      annule: t.annule || annules.includes(t.id),
      inscrits: monNom && !inscrits.includes(monNom) ? [...inscrits, monNom] : inscrits,
    };
  });
}

export function tousLesTournois(): Tournoi[] {
  return avecEtatsSuperposes([...lireTournoisCrees(), ...TOURNOIS]);
}

export function tournoiParId(id: string): Tournoi | undefined {
  return tousLesTournois().find((t) => t.id === id);
}

export function tournoiParCode(code: string): Tournoi | undefined {
  const normalise = code.trim().toUpperCase();
  if (!normalise) return undefined;
  return tousLesTournois().find((t) => t.code === normalise);
}

/** Code court (6 caractères, sans caractères ambigus) pour retrouver un
 * tournoi facilement via la recherche, à la place du titre complet. */
function genererCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export function creerTournoi(donnees: Omit<Tournoi, "id" | "code" | "placesInscrites">): Tournoi {
  const tournoi: Tournoi = {
    ...donnees,
    id: `${donnees.titre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`,
    code: genererCode(),
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
  return avecEtatsSuperposes(lireTournoisCrees());
}

function pointsPourPlace(place: number, effectif: number): number {
  if (place === 1) return 100;
  if (place === 2) return 70;
  if (place <= 4) return 50;
  if (place <= 8) return 30;
  if (place <= Math.ceil(effectif / 2)) return 15;
  return 5;
}

/** Même barème pour la première moitié, mais les éliminés de la seconde
 * moitié reçoivent des points négatifs (plus sévère pour les tout premiers
 * éliminés) plutôt qu'un minimum symbolique. */
function pointsPourPlaceBR(place: number, effectif: number): number {
  if (place === 1) return 100;
  if (place === 2) return 70;
  if (place <= 4) return 50;
  if (place <= 8) return 30;
  const moitie = Math.ceil(effectif / 2);
  if (place <= moitie) return 15;
  return Math.max(-20, -(place - moitie) * 2);
}

/**
 * Clôture un tournoi : distribue les points de classement de façon
 * automatique et équilibrée selon la place finale (bracket ou battle royale),
 * puis crédite le solde de l'utilisateur local s'il fait partie des gagnants
 * du cash prize. La commission de l'organisateur n'est créditée que
 * s'il est certifié (cf. mockOrganisateur).
 */
/**
 * Séquestre du cash prize : à la clôture, le gain du vainqueur (s'il s'agit
 * de l'utilisateur de cet appareil) est mis en attente plutôt que crédité
 * directement. Il est ensuite libéré automatiquement dès que les avis
 * "cœur brisé" du tournoi (cf. mockAvis) restent sous le seuil, ou reste
 * bloqué jusqu'à une libération manuelle par l'administration.
 */
export const SEUIL_COEURS_BRISES_SEQUESTRE = 2;

export type PaiementEnAttente = { tournoiId: string; titre: string; montantXof: number; horodatage: number };

const CLE_PAIEMENTS_ATTENTE = "tourney-paiements-attente";

function lirePaiementsAttente(): PaiementEnAttente[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_PAIEMENTS_ATTENTE);
    return brut ? (JSON.parse(brut) as PaiementEnAttente[]) : [];
  } catch {
    return [];
  }
}

export function paiementsEnAttente(): PaiementEnAttente[] {
  return lirePaiementsAttente();
}

export function cashPrizeEnSequestre(tournoiId: string): boolean {
  return lirePaiementsAttente().some((p) => p.tournoiId === tournoiId);
}

function ajouterPaiementAttente(tournoiId: string, titre: string, montantXof: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CLE_PAIEMENTS_ATTENTE,
    JSON.stringify([...lirePaiementsAttente(), { tournoiId, titre, montantXof, horodatage: Date.now() }]),
  );
}

function retirerPaiementAttente(tournoiId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_PAIEMENTS_ATTENTE, JSON.stringify(lirePaiementsAttente().filter((p) => p.tournoiId !== tournoiId)));
}

/** Libération manuelle (action admin) après vérification anti-triche. */
export function libererSequestreCashPrize(tournoiId: string) {
  const paiement = lirePaiementsAttente().find((p) => p.tournoiId === tournoiId);
  if (!paiement) return;
  crediter(paiement.montantXof, `Gain (débloqué) · ${paiement.titre}`, "gain");
  retirerPaiementAttente(tournoiId);
}

/** Réévalue les paiements en attente : libère automatiquement ceux dont le
 * tournoi reste sous le seuil de cœurs brisés. À appeler après chaque avis
 * laissé, ou à l'arrivée sur l'écran d'un tournoi terminé. */
export function reevaluerPaiementsEnAttente() {
  for (const paiement of lirePaiementsAttente()) {
    const brises = avisDuTournoi(paiement.tournoiId).filter((a) => a.type === "coeur_brise").length;
    const conteste = appelOuvertPourTournoi(paiement.tournoiId);
    if (brises < SEUIL_COEURS_BRISES_SEQUESTRE && !conteste) {
      crediter(paiement.montantXof, `Gain · ${paiement.titre}`, "gain");
      retirerPaiementAttente(paiement.tournoiId);
    }
  }
}

export function terminerTournoi(tournoiId: string): { pointsAttribues: number; gainCredite: number } {
  const tournoi = tournoiParId(tournoiId);
  if (!tournoi) return { pointsAttribues: 0, gainCredite: 0 };

  const classement =
    tournoi.type === "battle_royale"
      ? classementFinalBR(tournoiId, tournoi.brSousType ?? "solo")
      : classementFinalBracket(tournoiId);

  const bareme = tournoi.type === "battle_royale" ? pointsPourPlaceBR : pointsPourPlace;
  let pointsAttribues = 0;
  classement.forEach((nom, i) => {
    const points = bareme(i + 1, classement.length);
    attribuerPoints(tournoi.jeuId, nom, points, tournoi.ville);
    pointsAttribues += points;
  });

  let gainCredite = 0;
  const profil = lireProfil();
  if (tournoi.repartitionCashPrize) {
    for (let i = 0; i < tournoi.repartitionCashPrize.length; i++) {
      if (classement[i] && classement[i] === profil.pseudo) {
        // Le gain part en attente (séquestre potentiel, cf. point 24) plutôt
        // que d'être crédité directement : reevaluerPaiementsEnAttente() le
        // libère aussitôt s'il n'y a pas assez de cœurs brisés signalés.
        ajouterPaiementAttente(tournoiId, tournoi.titre, tournoi.repartitionCashPrize[i].montantXof);
        gainCredite += tournoi.repartitionCashPrize[i].montantXof;
      }
    }
  }

  if (tournoi.fraisXof > 0 && tournoi.commissionActivee && estCertifie()) {
    const { net } = decomposerCommission(tournoi.fraisXof, tournoi.placesInscrites);
    if (net > 0) crediter(net, `Commission · ${tournoi.titre}`, "commission");
  }

  ajouterA(CLE_TOURNOIS_TERMINES, tournoiId);
  notifierParticipants(tournoiId, tournoi.titre, "le tournoi est terminé, découvre les résultats !");
  return { pointsAttribues, gainCredite };
}
