/**
 * Solde & TourneyCard — table `mouvements` (Postgres via /api/wallet), même
 * pattern que les migrations précédentes (fonctions async, mêmes noms/
 * signatures que la version localStorage quand c'est possible). Le solde
 * n'est pas stocké : dérivé de la somme des mouvements, à la lecture, aussi
 * bien côté serveur (cf. src/lib/server/wallet.ts) que côté client.
 *
 * Pas d'agrégateur de paiement mobile money branché pour l'instant :
 * recharger()/retirer() restent des écritures directes (le joueur saisit un
 * montant, il est crédité/débité instantanément) — seule la PERSISTANCE
 * change ici, pas le flux de paiement réel, qui reste à brancher plus tard.
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

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

type WalletJSON = { solde: number; mouvements: Mouvement[] };

export async function lireSolde(): Promise<number> {
  const reponse = await fetch("/api/wallet");
  const resultat = await reponseJson<WalletJSON>(reponse);
  return resultat.ok ? resultat.data.solde : 0;
}

export async function mesMouvements(): Promise<Mouvement[]> {
  const reponse = await fetch("/api/wallet");
  const resultat = await reponseJson<WalletJSON>(reponse);
  return resultat.ok ? resultat.data.mouvements : [];
}

export type ResumeMouvementsTournoi = { gainsXof: number; gainsCount: number; remboursementsXof: number; remboursementsCount: number; commissionXof: number };

/** Résumé financier réel d'un tournoi (cash prize versé, total remboursé,
 * commission organisateur créditée) — réservé à l'organisateur/ses
 * adjoints, cf. /api/tournois/[id]/mouvements-resume. */
export async function resumeMouvementsTournoi(tournoiId: string): Promise<ResumeMouvementsTournoi> {
  const vide = { gainsXof: 0, gainsCount: 0, remboursementsXof: 0, remboursementsCount: 0, commissionXof: 0 };
  const reponse = await fetch(`/api/tournois/${tournoiId}/mouvements-resume`);
  const resultat = await reponseJson<ResumeMouvementsTournoi>(reponse);
  return resultat.ok ? resultat.data : vide;
}

/** Pure : dérive le solde d'une liste de mouvements déjà chargée (évite un
 * second appel réseau quand on a déjà mesMouvements()). */
export function soldeDepuisMouvements(mouvements: Mouvement[]): number {
  return mouvements.reduce((somme, m) => somme + m.montantXof, 0);
}

/** Pure : mêmes raisons que soldeDepuisMouvements — prend la liste déjà
 * chargée plutôt que de refaire un appel réseau. */
export function gainsTotal(mouvements: Mouvement[]): number {
  return mouvements.filter((m) => m.type === "gain").reduce((somme, m) => somme + m.montantXof, 0);
}

export type ResultatMouvement = { ok: boolean; erreur?: string };

async function ajouterMouvement(type: TypeMouvement, libelle: string, montantXof: number, tournoiId?: string): Promise<ResultatMouvement> {
  const reponse = await fetch("/api/wallet/mouvements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, libelle, montantXof, tournoiId }),
  });
  const resultat = await reponseJson<{ mouvement: Mouvement }>(reponse);
  return resultat.ok ? { ok: true } : { ok: false, erreur: resultat.erreur };
}

export async function crediter(montantXof: number, libelle: string, type: TypeMouvement = "gain", tournoiId?: string): Promise<void> {
  if (montantXof <= 0) return;
  await ajouterMouvement(type, libelle, montantXof, tournoiId);
}

/** Débite si le solde est suffisant (vérifié côté serveur). Retourne false
 * sinon (aucun effet). */
export async function debiter(montantXof: number, libelle: string, type: TypeMouvement, tournoiId?: string): Promise<boolean> {
  if (montantXof <= 0) return false;
  const resultat = await ajouterMouvement(type, libelle, -montantXof, tournoiId);
  return resultat.ok;
}

export async function recharger(montantXof: number, moyen: string): Promise<void> {
  await crediter(montantXof, `Recharge ${moyen}`, "recharge");
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

export async function retirer(montantXof: number, moyen: string): Promise<ResultatMouvement> {
  if (montantXof < 1000) return { ok: false, erreur: "Le retrait minimum est de 1 000 CFA." };
  return ajouterMouvement("retrait", `Retrait ${moyen}`, -montantXof);
}

/** Délai de vérification avant qu'un retrait ne soit considéré traité
 * définitivement (anti-fraude, mock). */
export const DELAI_VERIFICATION_RETRAIT_MS = 5 * 60 * 1000;

export function retraitEnVerification(m: Pick<Mouvement, "type" | "horodatage">): boolean {
  return m.type === "retrait" && Date.now() - m.horodatage < DELAI_VERIFICATION_RETRAIT_MS;
}
