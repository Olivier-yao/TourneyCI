/**
 * Solde & TourneyCard (mock) — pas de vrai argent, tout est simulé en
 * localStorage. Sert à payer les inscriptions et à recevoir les gains
 * automatiquement à la fin d'un tournoi (cf. mockTournaments.terminerTournoi).
 */

export type TypeMouvement = "gain" | "inscription" | "recharge" | "retrait" | "commission";

export type Mouvement = {
  id: string;
  type: TypeMouvement;
  libelle: string;
  montantXof: number;
  dateLabel: string;
  horodatage: number;
};

const CLE_SOLDE = "tourneyci-solde";
const CLE_MOUVEMENTS = "tourneyci-mouvements";
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

export function crediter(montantXof: number, libelle: string, type: TypeMouvement = "gain") {
  if (montantXof <= 0) return;
  enregistrerMouvement({ type, libelle, montantXof, dateLabel: AUJOURD_HUI() });
}

/** Débite si le solde est suffisant. Retourne false sinon (aucun effet). */
export function debiter(montantXof: number, libelle: string, type: TypeMouvement): boolean {
  if (montantXof <= 0) return false;
  if (lireSolde() < montantXof) return false;
  enregistrerMouvement({ type, libelle, montantXof: -montantXof, dateLabel: AUJOURD_HUI() });
  return true;
}

export function recharger(montantXof: number, moyen: string) {
  crediter(montantXof, `Recharge ${moyen}`, "recharge");
}

/** Frais de retrait : 1 %, plancher et plafond pour rester indolore quel que
 * soit le montant (pas de quoi faire râler les joueurs sur de petits retraits,
 * pas non plus de manque à gagner disproportionné sur les gros). */
const FRAIS_RETRAIT_PCT = 0.01;
const FRAIS_RETRAIT_MIN = 100;
const FRAIS_RETRAIT_MAX = 1000;

export function fraisRetrait(montantXof: number): number {
  if (montantXof <= 0) return 0;
  return Math.min(FRAIS_RETRAIT_MAX, Math.max(FRAIS_RETRAIT_MIN, Math.round(montantXof * FRAIS_RETRAIT_PCT)));
}

export function retirer(montantXof: number, moyen: string): { ok: boolean; erreur?: string } {
  if (montantXof < 1000) return { ok: false, erreur: "Le retrait minimum est de 1 000 F." };
  const frais = fraisRetrait(montantXof);
  const total = montantXof + frais;
  if (lireSolde() < total) return { ok: false, erreur: "Solde insuffisant pour ce retrait (frais inclus)." };
  enregistrerMouvement({
    type: "retrait",
    libelle: `Retrait ${moyen}`,
    montantXof: -total,
    dateLabel: AUJOURD_HUI(),
  });
  return { ok: true };
}

export function gainsTotal(): number {
  return mesMouvements()
    .filter((m) => m.type === "gain")
    .reduce((somme, m) => somme + m.montantXof, 0);
}
