/**
 * Solde & TourneyCard (mock) — pas de vrai argent, tout est simulé en
 * localStorage. Sert à payer les inscriptions et à recevoir les gains
 * automatiquement à la fin d'un tournoi (cf. mockTournaments.terminerTournoi).
 */

export type TypeMouvement = "gain" | "inscription" | "recharge" | "retrait" | "commission" | "financement" | "remboursement";

export type Mouvement = {
  id: string;
  type: TypeMouvement;
  libelle: string;
  montantXof: number;
  dateLabel: string;
  horodatage: number;
  /** Tournoi lié (point 196), quand le mouvement en découle directement
   * (gain, inscription, commission, financement, remboursement). */
  tournoiId?: string;
};

/** Code de transaction unique (point 196) — dérivé de l'id, déjà unique par
 * construction, pour éviter un champ redondant à stocker/migrer. */
export function codeTransaction(id: string): string {
  return `TXN-${id.replace(/^mv-/, "").toUpperCase()}`;
}

const CLE_SOLDE = "tourney-solde";
const CLE_MOUVEMENTS = "tourney-mouvements";
const SOLDE_INITIAL = 128500;

const MOUVEMENTS_INITIAUX: Mouvement[] = [
  { id: "m1", type: "gain", libelle: "Gain · Abidjan Cup #11", montantXof: 150000, dateLabel: "27/07 23:41", horodatage: 1 },
  { id: "m2", type: "inscription", libelle: "Inscription · Ligue Yopougon", montantXof: -2000, dateLabel: "26/07", horodatage: 2 },
  { id: "m3", type: "retrait", libelle: "Retrait Wave", montantXof: -40000, dateLabel: "22/07", horodatage: 3 },
];

function lireBrut<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

export function lireSolde(): number {
  return lireBrut(CLE_SOLDE, SOLDE_INITIAL);
}

export function mesMouvements(): Mouvement[] {
  return lireBrut(CLE_MOUVEMENTS, MOUVEMENTS_INITIAUX);
}

function enregistrerMouvement(m: Omit<Mouvement, "id" | "horodatage">) {
  if (typeof window === "undefined") return;
  const mouvements = mesMouvements();
  const nouveau: Mouvement = { ...m, id: `mv-${Date.now().toString(36)}`, horodatage: Date.now() };
  localStorage.setItem(CLE_MOUVEMENTS, JSON.stringify([nouveau, ...mouvements]));
  localStorage.setItem(CLE_SOLDE, JSON.stringify(lireSolde() + m.montantXof));
}

const AUJOURD_HUI = () =>
  new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

export function crediter(montantXof: number, libelle: string, type: TypeMouvement = "gain", tournoiId?: string) {
  if (montantXof <= 0) return;
  enregistrerMouvement({ type, libelle, montantXof, dateLabel: AUJOURD_HUI(), tournoiId });
}

/** Débite si le solde est suffisant. Retourne false sinon (aucun effet). */
export function debiter(montantXof: number, libelle: string, type: TypeMouvement, tournoiId?: string): boolean {
  if (montantXof <= 0) return false;
  if (lireSolde() < montantXof) return false;
  enregistrerMouvement({ type, libelle, montantXof: -montantXof, dateLabel: AUJOURD_HUI(), tournoiId });
  return true;
}

export function recharger(montantXof: number, moyen: string) {
  crediter(montantXof, `Recharge ${moyen}`, "recharge");
}

/** Frais de retrait : 1 % du montant retiré, plafonné pour rester indolore
 * sur les gros retraits — déduits du montant lui-même (point 138), jamais
 * ajoutés en plus : le joueur saisit ce qu'il retire de son solde, pas ce
 * qu'il doit débourser en plus pour compenser les frais. */
const FRAIS_RETRAIT_PCT = 0.01;
const FRAIS_RETRAIT_MAX = 1000;

export function fraisRetrait(montantXof: number): number {
  if (montantXof <= 0) return 0;
  return Math.min(FRAIS_RETRAIT_MAX, Math.round(montantXof * FRAIS_RETRAIT_PCT));
}

/** Montant net réellement envoyé vers le moyen de paiement, frais déduits. */
export function montantNetRetrait(montantXof: number): number {
  return Math.max(0, montantXof - fraisRetrait(montantXof));
}

export function retirer(montantXof: number, moyen: string): { ok: boolean; erreur?: string } {
  if (montantXof < 1000) return { ok: false, erreur: "Le retrait minimum est de 1 000 F." };
  if (lireSolde() < montantXof) return { ok: false, erreur: "Solde insuffisant pour ce retrait." };
  enregistrerMouvement({
    type: "retrait",
    libelle: `Retrait ${moyen}`,
    montantXof: -montantXof,
    dateLabel: AUJOURD_HUI(),
  });
  return { ok: true };
}

/** Délai de vérification avant qu'un retrait ne soit considéré traité
 * définitivement (anti-fraude, mock). */
export const DELAI_VERIFICATION_RETRAIT_MS = 5 * 60 * 1000;

export function retraitEnVerification(m: Pick<Mouvement, "type" | "horodatage">): boolean {
  return m.type === "retrait" && Date.now() - m.horodatage < DELAI_VERIFICATION_RETRAIT_MS;
}

export function gainsTotal(): number {
  return mesMouvements()
    .filter((m) => m.type === "gain")
    .reduce((somme, m) => somme + m.montantXof, 0);
}
