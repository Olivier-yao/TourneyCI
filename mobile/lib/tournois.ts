import { apiFetch } from "./api";

/** Contrat complet de versTournoiJSON (src/lib/server/tournois.ts) — même
 * forme que le type Tournoi côté web (src/lib/mockTournaments.ts), à
 * l'exception de `equipes` (liste d'équipes prédéfinies) qui n'existe que
 * côté client web et n'est jamais renvoyée par l'API réelle. */
export type Tournoi = {
  id: string;
  code: string;
  jeuId: string;
  jeuLabel: string;
  titre: string;
  organisateur: string;
  format: string;
  type: "1v1" | "equipes" | "battle_royale";
  modalite: "virtuel" | "presentiel";
  ville: string;
  dateLabel: string;
  cashPrizeXof: number;
  fraisXof: number;
  placesInscrites: number;
  placesTotal: number;
  checkin: string;
  checkinTs: number;
  enDirect: boolean;
  reglement: string;
  informations?: string;
  inscrits: string[];
  modeEquipe?: "libre" | "predefinies";
  brSousType?: "solo" | "duo" | "trio" | "squad";
  equipeSousType?: "solo" | "duo" | "trio" | "squad";
  financementCashPrize: "inscriptions" | "organisateur";
  commissionActivee: boolean;
  repartitionCashPrize?: { label: string; montantXof: number }[];
  banniereUrl?: string;
  symboleId?: string;
  termine: boolean;
  termineLe?: number;
  annule: boolean;
  annuleLe?: number;
  manchesPrevues?: number;
  manchesParMatch?: number;
  debutTournoiTs: number;
  debutInscriptionsTs?: number;
  finInscriptionsTs?: number;
  streamActif: boolean;
};

export async function listerTournois(): Promise<Tournoi[]> {
  const resultat = await apiFetch<Tournoi[]>("/api/tournois");
  return resultat.success ? resultat.data : [];
}

export async function tournoiParId(id: string): Promise<Tournoi | undefined> {
  const resultat = await apiFetch<Tournoi>(`/api/tournois/${id}`);
  return resultat.success ? resultat.data : undefined;
}

const COMMISSION_PCT = 0.2;
const MARGE_CLOTURE_PAR_DEFAUT_MS = 12 * 60 * 1000;

/** Port des fonctions pures de src/lib/mockTournaments.ts — mêmes noms,
 * même logique, aucune nouvelle règle métier inventée côté mobile. */

export function clotureEffectiveInscriptions(t: Pick<Tournoi, "finInscriptionsTs" | "debutTournoiTs">): number | undefined {
  if (t.finInscriptionsTs) return t.finInscriptionsTs;
  if (t.debutTournoiTs) return t.debutTournoiTs - MARGE_CLOTURE_PAR_DEFAUT_MS;
  return undefined;
}

export function tournoiComplet(t: Pick<Tournoi, "placesInscrites" | "placesTotal">): boolean {
  return t.placesTotal > 0 && t.placesInscrites >= t.placesTotal;
}

export function inscriptionsFermees(
  t: Pick<Tournoi, "finInscriptionsTs" | "debutTournoiTs" | "placesInscrites" | "placesTotal" | "enDirect">,
): boolean {
  if (t.enDirect) return true;
  if (tournoiComplet(t)) return true;
  const cloture = clotureEffectiveInscriptions(t);
  return cloture !== undefined && Date.now() >= cloture;
}

export function cashPrizeAffiche(
  t: Pick<
    Tournoi,
    "fraisXof" | "placesInscrites" | "placesTotal" | "financementCashPrize" | "commissionActivee" | "cashPrizeXof" | "finInscriptionsTs" | "debutTournoiTs" | "enDirect"
  >,
): number {
  if (t.financementCashPrize === "organisateur" || t.fraisXof <= 0) return t.cashPrizeXof;
  const places = inscriptionsFermees(t) ? t.placesInscrites : t.placesTotal;
  const poolBrut = t.fraisXof * places;
  const commissionBrute = t.commissionActivee ? Math.round(poolBrut * COMMISSION_PCT) : 0;
  return Math.max(0, poolBrut - commissionBrute);
}

export function cashPrizeEstEstime(
  t: Pick<Tournoi, "fraisXof" | "financementCashPrize" | "finInscriptionsTs" | "debutTournoiTs" | "placesInscrites" | "placesTotal" | "enDirect">,
): boolean {
  if (t.financementCashPrize === "organisateur" || t.fraisXof <= 0) return false;
  return !inscriptionsFermees(t);
}

export type InscriptionResume = { tournoiId: string; tag?: string; equipe?: string };

export async function mesInscriptions(): Promise<InscriptionResume[]> {
  const resultat = await apiFetch<InscriptionResume[]>("/api/inscriptions");
  return resultat.success ? resultat.data : [];
}

export type ResultatInscription = { ok: true; tag?: string; equipe?: string } | { ok: false; erreur: string };

export async function inscrire(tournoiId: string, body: { tag?: string; equipe?: string; montant?: number }): Promise<ResultatInscription> {
  const resultat = await apiFetch<{ tournoiId: string; tag?: string; equipe?: string }>(`/api/tournois/${tournoiId}/inscriptions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!resultat.success) return { ok: false, erreur: resultat.error };
  return { ok: true, tag: resultat.data.tag, equipe: resultat.data.equipe };
}
