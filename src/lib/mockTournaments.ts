/**
 * Tournois — migré vers un vrai backend (Postgres via /api/tournois, cf.
 * ROADMAP-backend-et-mobile.md et src/lib/server/tournois.ts pour
 * l'adaptateur serveur). Les fonctions de lecture/écriture sont désormais
 * async (fetch), mais gardent les mêmes noms/signatures qu'avant pour
 * limiter les changements côté écrans, qui les appellent déjà dans un
 * useEffect (jamais de lecture synchrone au rendu comme pour le profil).
 *
 * Restent mockés/localStorage, volontairement inchangés (agnostiques du
 * format d'id, continuent de fonctionner à l'identique avec de vrais UUID) :
 * mockWallet (solde), mockEquipesBR/mockPropositionsEquipe/mockEquipesProfil
 * (formation d'équipes), mockOrganisateur (nom/certification, gating client
 * uniquement — écart déjà connu, cf. roadmap 2.2), mockNotifications,
 * mockAvis, mockAppel, mockBracket, mockBattleRoyale, et l'escroquesequestre
 * du cash prize (paiementsEnAttente).
 */

import { classementFinalBracket } from "./mockBracket";
import { classementFinalBR } from "./mockBattleRoyale";
import { attribuerPoints, lireProfil } from "./mockProfil";
import { crediter } from "./mockWallet";
import { estCertifie, nomOrganisateurActuel } from "./mockOrganisateur";
import { estInscrit } from "./mockInscriptions";
import { notifierParticipants } from "./mockNotifications";
import { avisDuTournoi } from "./mockAvis";
import { appelOuvertPourTournoi } from "./mockAppel";
import { supprimerEquipesDuTournoi } from "./mockEquipesBR";

export type TypeCompetition = "1v1" | "equipes" | "battle_royale";
export type Modalite = "virtuel" | "presentiel";
export type ModeEquipe = "libre" | "predefinies";

/** Sous-types Équipes (bracket à élimination directe, distinct du Battle
 * Royale) : Solo/Duo/Trio/Squad, alignés sur les tailles du Battle Royale
 * (point 198 avait ajouté Escouade/5 pour les formats 5v5 type CODM classé,
 * remplacée par Solo sur demande utilisateur — la colonne Postgres
 * sous_type_equipe garde "escouade" comme valeur héritée, plus proposée
 * côté app). */
export type EquipeSousType = "solo" | "duo" | "trio" | "squad";

export const LABEL_UNITE_EQUIPE: Record<EquipeSousType, { nom: string; singulier: string; pluriel: string }> = {
  solo: { nom: "Solo", singulier: "SOLO", pluriel: "SOLOS" },
  duo: { nom: "Duo", singulier: "DUO", pluriel: "DUOS" },
  trio: { nom: "Trio", singulier: "TRIO", pluriel: "TRIOS" },
  squad: { nom: "Squad", singulier: "SQUAD", pluriel: "SQUADS" },
};

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
  /** Dérivé de type/equipeSousType/modeEquipe/placesTotal (pas stocké), cf. src/lib/tournoiFormat.ts. */
  format: string;
  type: TypeCompetition;
  modalite: Modalite;
  ville: string;
  /** Dérivé de debutTournoiTs (pas stocké), cf. src/lib/tournoiFormat.ts. */
  dateLabel: string;
  cashPrizeXof: number;
  fraisXof: number;
  placesInscrites: number;
  placesTotal: number;
  /** Dérivé de checkinTs (pas stocké), cf. src/lib/tournoiFormat.ts. */
  checkin: string;
  enDirect: boolean;
  reglement: string;
  /** Détails additionnels distincts du règlement (facultatif). */
  informations?: string;
  inscrits: string[];
  equipes?: EquipeInfo[];
  modeEquipe?: ModeEquipe;
  /** Sous-type Battle Royale (obligatoire quand type === "battle_royale"). */
  brSousType?: "solo" | "duo" | "trio" | "squad";
  /** Nombre de manches choisi par l'organisateur à la création (obligatoire
   * quand type === "battle_royale") — la clôture automatique attend que ce
   * nombre de manches soit joué, pas juste la première. */
  manchesPrevues?: number;
  /** Best-of par match (1v1/Équipes uniquement) — purement informatif
   * (affiché dans `format`, ex. "BO3"), n'affecte pas la clôture. */
  manchesParMatch?: number;
  /** Sous-type Équipes (taille cible, point 177, escouade ajoutée au point
   * 198) — facultatif : "libre" sans sous-type précisé reste possible. */
  equipeSousType?: EquipeSousType;
  /** Origine du financement du cash prize : frais d'inscription des
   * participants (défaut) ou solde de l'organisateur (inscription gratuite). */
  financementCashPrize?: "inscriptions" | "organisateur";
  /** Commission organisateur activée pour ce tournoi payant (COMMISSION_PCT
   * des frais collectés, moins la part plateforme prélevée au versement). */
  commissionActivee?: boolean;
  repartitionCashPrize?: RepartitionCashPrize[];
  banniereUrl?: string;
  /** Symbole esport choisi par l'organisateur pour l'onglet "En direct"
   * (point 144, remplace l'upload d'image carrée du point 132) — identifiant
   * d'une icône du référentiel SYMBOLES_TOURNOI, pas une image libre. */
  symboleId?: string;
  termine?: boolean;
  annule?: boolean;
  /** Horodatage (ms) de début du tournoi. */
  debutTournoiTs?: number;
  /** Horodatages (ms) optionnels renseignés par l'organisateur pour la fenêtre
   * d'inscription. Si absents, comportement par défaut (voir clotureEffectiveInscriptions). */
  debutInscriptionsTs?: number;
  finInscriptionsTs?: number;
  /** Stream live de la partie en cours activé par l'organisateur (point 109) :
   * remplace la bannière statique par un cadre de stream une fois le tournoi
   * en direct. Pas de flux réel dans ce mock (voir point 110). */
  streamActif?: boolean;
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

/** Une fois le tournoi en direct, les inscriptions sont closes
 * définitivement — même si la capacité maximale n'a jamais été atteinte
 * (point 108) : on ne rejoint pas une compétition déjà commencée. */
export function inscriptionsFermees(
  tournoi: Pick<Tournoi, "finInscriptionsTs" | "debutTournoiTs" | "placesInscrites" | "placesTotal" | "enDirect">,
): boolean {
  if (tournoi.enDirect) return true;
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

/** Seule commission du système (point 125) : celle de l'organisateur,
 * optionnelle et activée tournoi par tournoi, prélevée sur les frais
 * d'inscription collectés — versée intégralement à l'organisateur à la
 * clôture, sans aucune part plateforme. */
export const COMMISSION_PCT = 0.2;

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

/** Cash prize réellement affichable/versable (point 123) : jamais basé sur
 * la capacité maximale théorique fixée à la création, toujours recalculé
 * depuis le nombre réel d'inscrits (et donc de frais réellement collectés),
 * commission déduite. Les tournois gratuits financés par l'organisateur
 * gardent leur montant fixe, engagé dès la création — ce n'est pas une
 * cagnotte qui dépend des inscriptions. */
export function cashPrizeAffiche(
  tournoi: Pick<Tournoi, "fraisXof" | "placesInscrites" | "financementCashPrize" | "commissionActivee" | "cashPrizeXof">,
): number {
  if (tournoi.financementCashPrize === "organisateur" || tournoi.fraisXof <= 0) return tournoi.cashPrizeXof;
  const poolBrut = tournoi.fraisXof * tournoi.placesInscrites;
  const commissionBrute = tournoi.commissionActivee ? Math.round(poolBrut * COMMISSION_PCT) : 0;
  return Math.max(0, poolBrut - commissionBrute);
}

/** Vrai tant que la cagnotte peut encore grossir (inscriptions non closes) —
 * sert à afficher "cash prize estimé" plutôt qu'un montant présenté comme
 * définitif (point 123). */
export function cashPrizeEstEstime(
  tournoi: Pick<Tournoi, "fraisXof" | "financementCashPrize" | "finInscriptionsTs" | "debutTournoiTs" | "placesInscrites" | "placesTotal" | "enDirect">,
): boolean {
  if (tournoi.financementCashPrize === "organisateur" || tournoi.fraisXof <= 0) return false;
  return !inscriptionsFermees(tournoi);
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
  // Point 200 : bibliothèque élargie, chaque ajout associé à un genre
  // existant pour hériter automatiquement des formats pertinents.
  { id: "standoff2", label: "Standoff 2", genre: "FPS" },
  { id: "criticalops", label: "Critical Ops", genre: "FPS" },
  { id: "aov", label: "Arena of Valor", genre: "TPS" },
  { id: "marvelsuperwar", label: "Marvel Super War", genre: "TPS" },
  { id: "mortalkombat", label: "Mortal Kombat", genre: "Combat" },
  { id: "shadowfight3", label: "Shadow Fight 3", genre: "Combat" },
  { id: "streetfighter", label: "Street Fighter Duel", genre: "Combat" },
  { id: "basketballstars", label: "Basketball Stars", genre: "Sport" },
  { id: "headsoccer", label: "Head Soccer", genre: "Sport" },
  { id: "newstate", label: "New State Mobile", genre: "Battle Royale" },
  { id: "rulesofsurvival", label: "Rules of Survival", genre: "Battle Royale" },
];

export const TYPES_JEU: GenreJeu[] = ["FPS", "TPS", "Combat", "Sport", "Battle Royale"];

/** Point 200 : formats de compétition réellement proposés selon le genre du
 * jeu (ex. NBA 2K, genre Sport, n'a pas de mode Battle Royale) — utilisé par
 * le formulaire de création pour ne montrer que les formats pertinents. Un
 * jeu "Autre" (genre inconnu) garde volontairement tous les formats. */
export const FORMATS_PAR_GENRE: Record<GenreJeu, TypeCompetition[]> = {
  Sport: ["1v1", "equipes"],
  Combat: ["1v1"],
  FPS: ["1v1", "equipes", "battle_royale"],
  TPS: ["1v1", "equipes", "battle_royale"],
  "Battle Royale": ["equipes", "battle_royale"],
};

export function formatsDisponiblesPourJeu(jeuId: string): TypeCompetition[] {
  const genre = JEUX.find((j) => j.id === jeuId)?.genre;
  return genre ? FORMATS_PAR_GENRE[genre] : ["1v1", "equipes", "battle_royale"];
}

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

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function tousLesTournois(options?: { organisateurMoi?: boolean; enDirect?: boolean }): Promise<Tournoi[]> {
  const params = new URLSearchParams();
  if (options?.organisateurMoi) params.set("organisateur", "me");
  if (options?.enDirect) params.set("enDirect", "1");
  const reponse = await fetch(`/api/tournois${params.size ? `?${params}` : ""}`);
  const resultat = await reponseJson<Tournoi[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function tournoiParId(id: string): Promise<Tournoi | undefined> {
  const reponse = await fetch(`/api/tournois/${id}`);
  const resultat = await reponseJson<Tournoi>(reponse);
  return resultat.ok ? resultat.data : undefined;
}

export async function tournoiParCode(code: string): Promise<Tournoi | undefined> {
  const normalise = code.trim().toUpperCase();
  if (!normalise) return undefined;
  return tournoiParId(normalise);
}

/** Données envoyées à la création — distinctes de `Tournoi` : format/
 * dateLabel/checkin sont dérivés côté serveur (cf. src/lib/tournoiFormat.ts),
 * organisateur/inscrits/termine/annule/placesInscrites/code/id sont
 * calculés, pas saisis. */
export type DonneesCreationTournoi = {
  jeuId: string;
  jeuLabel: string;
  titre: string;
  type: TypeCompetition;
  modalite: Modalite;
  ville?: string;
  placesTotal: number;
  debutTournoiTs: number;
  /** Horodatage (ms) du check-in, remplace l'ancien champ texte "checkin". */
  checkinTs: number;
  debutInscriptionsTs?: number;
  finInscriptionsTs?: number;
  cashPrizeXof?: number;
  fraisXof?: number;
  financementCashPrize?: "inscriptions" | "organisateur";
  commissionActivee?: boolean;
  reglement: string;
  informations?: string;
  banniereUrl?: string;
  symboleId?: string;
  modeEquipe?: ModeEquipe;
  brSousType?: "solo" | "duo" | "trio" | "squad";
  manchesPrevues?: number;
  manchesParMatch?: number;
  equipeSousType?: EquipeSousType;
  repartitionCashPrize?: RepartitionCashPrize[];
};

export type ResultatCreationTournoi = { ok: true; tournoi: Tournoi } | { ok: false; erreur?: string };

export async function creerTournoi(donnees: DonneesCreationTournoi): Promise<ResultatCreationTournoi> {
  const reponse = await fetch("/api/tournois", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // organisateurNom : dérivé de la session courante, pas saisi par
    // l'appelant — cf. synchroniserNomOrganisateur ci-dessous.
    body: JSON.stringify({ ...donnees, organisateurNom: nomOrganisateurActuel() }),
  });
  const resultat = await reponseJson<Tournoi>(reponse);
  // repartitionCashPrize/équipes prédéfinies ne sont pas encore persistés
  // côté serveur (hors périmètre de cette étape, cf. plan) — réattaché
  // localement à la réponse pour ne pas casser l'écran de création, qui
  // l'affiche immédiatement après coup. manchesPrevues/manchesParMatch,
  // eux, sont bien persistés désormais : pas besoin de réattache.
  if (resultat.ok) {
    return { ok: true, tournoi: { ...resultat.data, repartitionCashPrize: donnees.repartitionCashPrize } };
  }
  return { ok: false, erreur: resultat.erreur };
}

/** Champs qu'un organisateur peut modifier après création (point 95) : pas
 * les champs structurels/financiers (type, frais, cash prize, dates) déjà
 * pris en compte par des inscriptions en cours. */
export type ParametresModifiablesTournoi = Partial<Pick<Tournoi, "titre" | "ville" | "reglement" | "informations" | "streamActif" | "symboleId">> & {
  /** Remplace l'ancien champ texte "checkin" — horodatage (ms). */
  checkinTs?: number;
};

export async function modifierTournoi(id: string, patch: ParametresModifiablesTournoi): Promise<boolean> {
  const reponse = await fetch(`/api/tournois/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const resultat = await reponseJson<Tournoi>(reponse);
  return resultat.ok;
}

/** Annule un tournoi et rembourse automatiquement les frais déjà payés par
 * l'inscrit de cet appareil (mock mono-utilisateur pour le remboursement :
 * pas de vrai registre multi-comptes, seul le participant local peut être
 * remboursé ici — cf. mockWallet, hors périmètre de cette étape). */
export async function annulerTournoi(id: string): Promise<void> {
  const tournoi = await tournoiParId(id);
  const reponse = await fetch(`/api/tournois/${id}/annuler`, { method: "POST" });
  if (!reponse.ok) return;
  if (tournoi && tournoi.fraisXof > 0 && (await estInscrit(id))) {
    crediter(tournoi.fraisXof, `Remboursement · ${tournoi.titre}`, "remboursement", tournoi.id);
  }
}

/** Pousse le nom d'organisateur courant (mockOrganisateur.ts, localStorage)
 * vers organisateur_profils côté serveur — auto-réparateur : un tournoi créé
 * avant cette synchronisation (ou depuis un autre appareil) retrouve le bon
 * nom dès le prochain appel de mesTournoisOrganises(). */
export async function synchroniserNomOrganisateur(nom: string): Promise<void> {
  if (!nom.trim()) return;
  await fetch("/api/organisateur", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomOrganisateur: nom }),
  }).catch(() => undefined);
}

export async function mesTournoisOrganises(): Promise<Tournoi[]> {
  await synchroniserNomOrganisateur(nomOrganisateurActuel());
  return tousLesTournois({ organisateurMoi: true });
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
  crediter(paiement.montantXof, `Gain (débloqué) · ${paiement.titre}`, "gain", paiement.tournoiId);
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
      crediter(paiement.montantXof, `Gain · ${paiement.titre}`, "gain", paiement.tournoiId);
      retirerPaiementAttente(paiement.tournoiId);
    }
  }
}

/**
 * Clôture un tournoi : distribue les points de classement de façon
 * automatique et équilibrée selon la place finale (bracket ou battle royale),
 * puis crédite le solde de l'utilisateur local s'il fait partie des gagnants
 * du cash prize. La commission de l'organisateur n'est créditée que
 * s'il est certifié (cf. mockOrganisateur). Seul termine_le devient réel
 * (POST /api/tournois/[id]/terminer) ; le reste (points, cash prize,
 * commission, notifications) reste géré ici, inchangé.
 */
export async function terminerTournoi(tournoiId: string): Promise<{ pointsAttribues: number; gainCredite: number }> {
  const tournoi = await tournoiParId(tournoiId);
  if (!tournoi) return { pointsAttribues: 0, gainCredite: 0 };

  const reponse = await fetch(`/api/tournois/${tournoiId}/terminer`, { method: "POST" });
  if (!reponse.ok) return { pointsAttribues: 0, gainCredite: 0 };

  const classement =
    tournoi.type === "battle_royale"
      ? classementFinalBR(tournoiId, tournoi.brSousType ?? "solo")
      : await classementFinalBracket(tournoiId);

  const bareme = tournoi.type === "battle_royale" ? pointsPourPlaceBR : pointsPourPlace;
  let pointsAttribues = 0;
  classement.forEach((nom, i) => {
    const points = bareme(i + 1, classement.length);
    attribuerPoints(tournoi.jeuId, nom, points, tournoi.ville);
    pointsAttribues += points;
  });

  let gainCredite = 0;
  const profil = lireProfil();
  // Le cash prize versé se recalcule ici sur les inscriptions réelles
  // (point 123) — jamais sur la capacité maximale théorique figée à la
  // création. Seul le nombre de finalistes choisi par l'organisateur est
  // repris de la répartition d'origine, pas les montants.
  const nbFinalistes = tournoi.repartitionCashPrize?.length ?? 0;
  const repartitionReelle = nbFinalistes > 0 ? repartitionAutomatique(cashPrizeAffiche(tournoi), nbFinalistes) : undefined;
  if (repartitionReelle) {
    for (let i = 0; i < repartitionReelle.length; i++) {
      if (classement[i] && classement[i] === profil.pseudo) {
        // Le gain part en attente (séquestre potentiel, cf. point 24) plutôt
        // que d'être crédité directement : reevaluerPaiementsEnAttente() le
        // libère aussitôt s'il n'y a pas assez de cœurs brisés signalés.
        ajouterPaiementAttente(tournoiId, tournoi.titre, repartitionReelle[i].montantXof);
        gainCredite += repartitionReelle[i].montantXof;
      }
    }
  }

  if (tournoi.fraisXof > 0 && tournoi.commissionActivee && estCertifie()) {
    const commission = commissionEstimee(tournoi.fraisXof, tournoi.placesInscrites);
    if (commission > 0) crediter(commission, `Commission · ${tournoi.titre}`, "commission", tournoi.id);
  }

  notifierParticipants(tournoiId, tournoi.titre, "le tournoi est terminé, découvre les résultats !");
  supprimerEquipesDuTournoi(tournoiId);
  return { pointsAttribues, gainCredite };
}
