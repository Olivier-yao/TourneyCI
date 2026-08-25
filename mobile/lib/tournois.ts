import { apiFetch } from "./api";

/** Sous-ensemble des champs de versTournoiJSON (src/lib/server/tournois.ts)
 * réellement utilisés par l'écran Accueil — pas besoin du contrat complet
 * pour ce premier écran. */
export type Tournoi = {
  id: string;
  titre: string;
  jeuLabel: string;
  ville: string;
  dateLabel: string;
  cashPrizeXof: number;
  placesInscrites: number;
  placesTotal: number;
  enDirect: boolean;
  termine: boolean;
  annule: boolean;
};

export async function listerTournois(): Promise<Tournoi[]> {
  const resultat = await apiFetch<Tournoi[]>("/api/tournois");
  return resultat.success ? resultat.data : [];
}
