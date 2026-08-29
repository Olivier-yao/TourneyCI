import { apiFetch } from "./api";
import type { Tournoi } from "./tournois";

/** Tournois organisés par le compte connecté — même endpoint que
 * listerTournois() avec ?organisateur=me (src/app/api/tournois/route.ts). */
export async function mesTournoisOrganises(): Promise<Tournoi[]> {
  const resultat = await apiFetch<Tournoi[]>("/api/tournois?organisateur=me");
  return resultat.success ? resultat.data : [];
}

/** Sous-ensemble du contrat de POST /api/tournois (src/app/api/tournois/
 * route.ts) réellement exposé par cet incrément — modalité "virtuel"
 * uniquement (pas de sélection de ville), type 1v1/équipes libre
 * uniquement (battle_royale a son propre système, hors scope comme le
 * reste de l'app mobile ce soir), pas de répartition personnalisée du
 * cash prize (répartition par défaut côté serveur à la clôture), pas de
 * commission organisateur (défaut désactivée). */
export type CreationTournoi = {
  titre: string;
  jeuId: string;
  type: "1v1" | "equipes";
  placesTotal: number;
  debutTournoiTs: number;
  checkinTs: number;
  reglement: string;
  fraisXof: number;
  cashPrizeXof: number;
  manchesParMatch: number;
  organisateurNom?: string;
};

export type ResultatCreation = { ok: true; id: string } | { ok: false; erreur: string };

export async function creerTournoi(data: CreationTournoi): Promise<ResultatCreation> {
  const resultat = await apiFetch<{ id: string }>("/api/tournois", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      modalite: "virtuel",
      modeEquipe: data.type === "equipes" ? "libre" : undefined,
      financementCashPrize: data.cashPrizeXof > 0 ? "organisateur" : undefined,
    }),
  });
  if (!resultat.success) return { ok: false, erreur: resultat.error };
  return { ok: true, id: resultat.data.id };
}
