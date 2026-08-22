/**
 * Battle Royale multi-manches avec points cumulés (barème façon PUBG) —
 * tables `manches_br`/`manches_br_resultats`/`manche_br_en_cours` (Postgres
 * via /api/tournois/[id]/manches-br), même pattern que les migrations
 * précédentes (fonctions async, mêmes noms/signatures quand c'est possible).
 *
 * participantsBR()/unitesBR() ne dérivent plus d'un roster de démo généré
 * aléatoirement (l'ancien mock ne fonctionnait qu'avec une poignée d'ids de
 * tournois codés en dur) : ils viennent désormais des vraies inscriptions du
 * tournoi (déjà migrées, cf. mockInscriptions.ts). Un participant est
 * identifié par son pseudo (solo) ou le nom de son équipe (duo/trio/squad) —
 * même identifiant que celui stocké dans manches_br_resultats.participant,
 * pas d'id opaque séparé à maintenir.
 *
 * Champ perdu, accepté : le statut "éliminé"/l'ordre d'élimination en direct
 * (StatutBR/ordreElimination) n'existait que dans le générateur de démo,
 * jamais alimenté par une vraie action côté organisateur — aucune régression
 * puisque rien ne l'écrivait réellement. classementFinalBR() retombe sur
 * l'ordre d'inscription si aucune manche n'a été jouée, au lieu d'un ordre
 * d'élimination qui n'a jamais existé pour de vraies données.
 */

export type SousTypeBR = "solo" | "duo" | "trio" | "squad";

/** Libellés d'unité par sous-type (point 177 : ajout de Trio), utilisés
 * partout où le sous-type doit s'afficher (gestion des manches, inscription). */
export const LABEL_UNITE_BR: Record<SousTypeBR, { nom: string; singulier: string; pluriel: string }> = {
  solo: { nom: "Joueur", singulier: "JOUEUR", pluriel: "JOUEURS" },
  duo: { nom: "Duo", singulier: "DUO", pluriel: "DUOS" },
  trio: { nom: "Trio", singulier: "TRIO", pluriel: "TRIOS" },
  squad: { nom: "Squad", singulier: "SQUAD", pluriel: "SQUADS" },
};

export type ParticipantBR = { id: string; nom: string; equipe?: string };
export type UniteBR = { id: string; nom: string };

export type ResultatManche = { participantId: string; placement: number; eliminations: number };
export type MancheBR = { numero: number; resultats: ResultatManche[]; horodatage: number };

export type LigneClassementBR = {
  participantId: string;
  nom: string;
  points: number;
  manchesJouees: number;
  qualifie: boolean;
};

/** Barème façon PUBG : points par place (index 0 = 1er). Au-delà : 0. */
const BAREME_PLACEMENT = [10, 6, 5, 4, 3, 2, 1, 1];

export function pointsPlacementBR(placement: number): number {
  return placement >= 1 && placement <= BAREME_PLACEMENT.length ? BAREME_PLACEMENT[placement - 1] : 0;
}

export function pointsManche(r: { placement: number; eliminations: number }): number {
  return pointsPlacementBR(r.placement) + r.eliminations;
}

async function inscriptionsDuTournoi(tournoiId: string): Promise<{ pseudo: string; equipe?: string }[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/inscriptions`);
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function participantsBR(tournoiId: string): Promise<ParticipantBR[]> {
  const inscriptions = await inscriptionsDuTournoi(tournoiId);
  return inscriptions.map((i) => ({ id: i.pseudo, nom: i.pseudo, equipe: i.equipe }));
}

/** Unités classées : un joueur en solo, une équipe en duo/trio/squad. */
export async function unitesBR(tournoiId: string, sousType: SousTypeBR = "solo"): Promise<UniteBR[]> {
  const participants = await participantsBR(tournoiId);
  if (sousType === "solo") {
    return participants.map((p) => ({ id: p.id, nom: p.nom }));
  }
  const equipes = new Set<string>();
  for (const p of participants) {
    if (p.equipe) equipes.add(p.equipe);
  }
  return Array.from(equipes).map((nom) => ({ id: nom, nom }));
}

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

type ManchesBRApiJSON = { manches: MancheBR[]; enCours: ResultatManche[] };

async function chargerManchesBR(tournoiId: string): Promise<ManchesBRApiJSON> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/manches-br`);
  const resultat = await reponseJson<ManchesBRApiJSON>(reponse);
  return resultat.ok ? resultat.data : { manches: [], enCours: [] };
}

export async function manchesBR(tournoiId: string): Promise<MancheBR[]> {
  return (await chargerManchesBR(tournoiId)).manches;
}

/** Point 205 : aperçu provisoire de la manche en cours de saisie, poussé par
 * "Valider" — visible immédiatement des spectateurs (classement en direct)
 * sans clôturer la manche. Volontairement séparé de manchesBR/
 * classementCumuleBR (source du classement final, point 118) : un brouillon
 * jamais clôturé ne doit jamais compter dans les points officiels. */
export async function mancheEnCoursBR(tournoiId: string): Promise<ResultatManche[]> {
  return (await chargerManchesBR(tournoiId)).enCours;
}

export async function validerMancheEnDirect(tournoiId: string, resultats: ResultatManche[]): Promise<void> {
  await fetch(`/api/tournois/${tournoiId}/manches-br/en-cours`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultats }),
  });
}

export async function ajouterMancheBR(tournoiId: string, resultats: ResultatManche[]): Promise<void> {
  await fetch(`/api/tournois/${tournoiId}/manches-br`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultats }),
  });
}

/** Classement cumulé sur toutes les manches jouées, trié par points décroissants.
 * Une unité = un joueur (solo) ou une équipe (duo/squad). La moitié supérieure
 * (avec au moins un point) est marquée "Qualifié". */
export async function classementCumuleBR(tournoiId: string, sousType: SousTypeBR = "solo"): Promise<LigneClassementBR[]> {
  const [unites, manches] = await Promise.all([unitesBR(tournoiId, sousType), manchesBR(tournoiId)]);
  const totaux = new Map<string, number>();
  const joues = new Map<string, number>();

  for (const manche of manches) {
    for (const r of manche.resultats) {
      totaux.set(r.participantId, (totaux.get(r.participantId) ?? 0) + pointsManche(r));
      joues.set(r.participantId, (joues.get(r.participantId) ?? 0) + 1);
    }
  }

  const lignes = unites
    .map((u) => ({
      participantId: u.id,
      nom: u.nom,
      points: totaux.get(u.id) ?? 0,
      manchesJouees: joues.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.points - a.points);

  const seuilQualif = Math.ceil(unites.length / 2);
  return lignes.map((l, i) => ({ ...l, qualifie: l.points > 0 && i < seuilQualif }));
}

/** Classement final (pour la distribution automatique des points/gains en fin
 * de tournoi) : cumul des manches si disponible, sinon ordre d'inscription
 * (aucune manche jouée — rien à départager). */
export async function classementFinalBR(tournoiId: string, sousType: SousTypeBR = "solo"): Promise<string[]> {
  const manches = await manchesBR(tournoiId);
  if (manches.length > 0) {
    return (await classementCumuleBR(tournoiId, sousType)).map((l) => l.nom);
  }
  const unites = await unitesBR(tournoiId, sousType);
  return unites.map((u) => u.nom);
}
