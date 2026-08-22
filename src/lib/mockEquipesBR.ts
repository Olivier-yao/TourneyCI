/**
 * Équipes (duo/squad) éphémères pour l'inscription à un tournoi Battle
 * Royale — tables `equipes_br`/`equipes_br_membres`/`demandes_equipe_br`/
 * `retraits_equipe_br` (Postgres), même pattern que les migrations
 * précédentes (fonctions async, mêmes noms/signatures quand c'est
 * possible).
 *
 * Chef/demandeur/membre sont désormais de vrais comptes (profile_id en
 * base) au lieu de simples pseudos en localStorage : la file de demandes et
 * les retraits sont enfin visibles depuis n'importe quel appareil du chef,
 * pas seulement celui qui les a créés. Les paramètres d'identité "moi"
 * (chef à la création, demandeur, joueur) ont disparu des signatures — ils
 * sont désormais dérivés de la session côté serveur, jamais pris tels quels
 * depuis le client.
 */

import type { SousTypeBR } from "./mockBattleRoyale";

export type EquipeBR = {
  id: string;
  tournoiId: string;
  nom: string;
  chef: string;
  membres: string[];
  paiementCouvert: boolean;
  creeLe: number;
};

export type DemandeEquipeBR = { id: string; equipeId: string; demandeur: string; horodatage: number };
export type RetraitEquipeBR = { id: string; equipeId: string; membre: string; motif: string; horodatage: number };

/** Taille cible d'une équipe selon le sous-type Battle Royale. */
export const TAILLE_EQUIPE_BR: Record<Exclude<SousTypeBR, "solo">, number> = {
  duo: 2,
  trio: 3,
  squad: 4,
};

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function equipesDuTournoi(tournoiId: string): Promise<EquipeBR[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/equipes-br`);
  const resultat = await reponseJson<EquipeBR[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function equipeParId(equipeId: string): Promise<EquipeBR | undefined> {
  const reponse = await fetch(`/api/equipes-br/${equipeId}`);
  const resultat = await reponseJson<EquipeBR>(reponse);
  return resultat.ok ? resultat.data : undefined;
}

/** Équipe dont le compte connecté est déjà membre pour ce tournoi. */
export async function equipeDeJoueur(tournoiId: string): Promise<EquipeBR | undefined> {
  const reponse = await fetch(`/api/mes-equipes-br?tournoiId=${tournoiId}`);
  const resultat = await reponseJson<EquipeBR[]>(reponse);
  return resultat.ok ? resultat.data[0] : undefined;
}

/** Toutes les équipes (tous tournois confondus) dont le compte connecté est membre. */
export async function equipesDuJoueur(): Promise<EquipeBR[]> {
  const reponse = await fetch("/api/mes-equipes-br");
  const resultat = await reponseJson<EquipeBR[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function creerEquipeBR(tournoiId: string, nom: string, paiementCouvert: boolean): Promise<EquipeBR> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/equipes-br`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, paiementCouvert }),
  });
  const resultat = await reponseJson<EquipeBR>(reponse);
  if (!resultat.ok) throw new Error(resultat.erreur ?? "Impossible de créer l'équipe.");
  return resultat.data;
}

export async function demanderRejoindre(equipeId: string): Promise<DemandeEquipeBR | undefined> {
  const reponse = await fetch(`/api/equipes-br/${equipeId}/demandes`, { method: "POST" });
  const resultat = await reponseJson<DemandeEquipeBR | null>(reponse);
  return resultat.ok && resultat.data ? resultat.data : undefined;
}

export async function demandesEnAttente(equipeId: string): Promise<DemandeEquipeBR[]> {
  const reponse = await fetch(`/api/equipes-br/${equipeId}/demandes`);
  const resultat = await reponseJson<DemandeEquipeBR[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function aUneDemandeEnAttente(equipeId: string): Promise<boolean> {
  const reponse = await fetch(`/api/equipes-br/${equipeId}/demandes?moi=1`);
  const resultat = await reponseJson<{ enAttente: boolean }>(reponse);
  return resultat.ok ? resultat.data.enAttente : false;
}

export async function approuverDemande(demandeId: string): Promise<void> {
  await fetch(`/api/equipes-br/demandes/${demandeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approuver" }),
  });
}

export async function refuserDemande(demandeId: string): Promise<void> {
  await fetch(`/api/equipes-br/demandes/${demandeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refuser" }),
  });
}

/** Retire un membre déjà intégré (motif obligatoire, conservé à l'historique). */
export async function retirerMembre(equipeId: string, membre: string, motif: string): Promise<void> {
  if (!motif.trim()) return;
  await fetch(`/api/equipes-br/${equipeId}/retraits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membre, motif }),
  });
}

export async function historiqueRetraits(equipeId: string): Promise<RetraitEquipeBR[]> {
  const reponse = await fetch(`/api/equipes-br/${equipeId}/retraits`);
  const resultat = await reponseJson<RetraitEquipeBR[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function marquerPaiementCouvert(equipeId: string): Promise<void> {
  await fetch(`/api/equipes-br/${equipeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "marquerPaiementCouvert" }),
  });
}

export async function rejoindreEquipeAleatoire(tournoiId: string, sousType: Exclude<SousTypeBR, "solo">): Promise<EquipeBR> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/equipes-br/aleatoire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sousType }),
  });
  const resultat = await reponseJson<EquipeBR>(reponse);
  if (!resultat.ok) throw new Error(resultat.erreur ?? "Impossible de rejoindre une équipe.");
  return resultat.data;
}

/** Fragment de requête à ajouter au lien du tournoi pour pré-sélectionner
 * cette équipe dans le flux d'inscription (invitation à rejoindre). */
export function lienInvitation(tournoiId: string, equipeId: string): string {
  const origine = typeof window !== "undefined" ? window.location.origin : "";
  return `${origine}/tournois/${tournoiId}?equipe=${equipeId}`;
}

/** Intègre directement des membres sans passer par la file de demandes —
 * réservé au cas où le chef a déjà validé ces joueurs en amont (équipe
 * pré-créée du profil, point 140). */
export async function ajouterMembresDirect(equipeId: string, membres: string[]): Promise<void> {
  if (membres.length === 0) return;
  await fetch(`/api/equipes-br/${equipeId}/membres-directs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membres }),
  });
}

/** Point 140 : les équipes éphémères (point 54) sont un repli propre au
 * tournoi — une fois celui-ci terminé, elles n'ont plus lieu de persister. */
export async function supprimerEquipesDuTournoi(tournoiId: string): Promise<void> {
  await fetch(`/api/tournois/${tournoiId}/equipes-br`, { method: "DELETE" });
}
