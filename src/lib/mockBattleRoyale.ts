/**
 * Données mock pour un tournoi Battle Royale multi-manches avec points
 * cumulés (barème façon PUBG). Persisté en localStorage (overlay par-dessus
 * la génération aléatoire initiale du roster), pour survivre aux
 * rechargements et nourrir la distribution automatique des gains en fin de
 * tournoi.
 */

export type StatutBR = "en_jeu" | "elimine";
export type SousTypeBR = "solo" | "duo" | "squad";

export type ParticipantBR = {
  id: string;
  nom: string;
  statut: StatutBR;
  ordreElimination?: number;
  /** Nom de la duo/squad d'appartenance (absent en solo). */
  equipe?: string;
};

export type UniteBR = { id: string; nom: string };

/** Unités classées : un joueur en solo, une équipe en duo/squad. */
export function unitesBR(tournoiId: string, sousType: SousTypeBR = "solo"): UniteBR[] {
  const participants = participantsBR(tournoiId);
  if (sousType === "solo") {
    return participants.map((p) => ({ id: p.id, nom: p.nom }));
  }
  const equipes = new Set<string>();
  for (const p of participants) {
    if (p.equipe) equipes.add(p.equipe);
  }
  return Array.from(equipes).map((nom) => ({ id: `equipe-${nom}`, nom }));
}

export type ResultatManche = {
  participantId: string;
  placement: number;
  eliminations: number;
};

export type MancheBR = {
  numero: number;
  resultats: ResultatManche[];
  horodatage: number;
};

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

const NOMS = [
  "Kader B.", "Yao M.", "Aya K.", "Sory D.", "Ismaël T.", "Fofana", "Traoré", "Bamba",
  "Malik K.", "Fatou T.", "Gohou", "Halima", "Nour", "Zeka", "Petit", "Delta",
  "Mariam D.", "Issa K.", "Abou S.", "Awa C.", "Kouassi", "Adjoua", "Brou", "Konan",
  "Yves L.", "Nadège", "Serge P.", "Aminata", "Moussa D.", "Rokia", "Boubacar", "Christelle",
  "Franck O.", "Grace A.", "Hervé", "Inès B.", "Jean-Luc", "Kadidia", "Lamine", "Marc T.",
  "Nadia S.", "Oumar B.", "Priscille", "Quentin", "Rachelle", "Salif K.", "Tenin", "Ulrich",
  "Vanessa", "William K.",
];

/** PRNG déterministe (mulberry32) : évite un ordre différent entre le rendu
 * serveur et le rendu client (Math.random() casserait l'hydratation). */
function alea(graine: number): () => number {
  let t = graine;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function melangerNoms(graine: number): string[] {
  const suivant = alea(graine);
  const melanges = [...NOMS];
  for (let i = melanges.length - 1; i > 0; i--) {
    const j = Math.floor(suivant() * (i + 1));
    [melanges[i], melanges[j]] = [melanges[j], melanges[i]];
  }
  return melanges;
}

function genererParticipants(nbElimines: number, graine = 42): ParticipantBR[] {
  return melangerNoms(graine).map((nom, i) => ({
    id: `br-${i}`,
    nom,
    statut: i < nbElimines ? "elimine" : "en_jeu",
    ordreElimination: i < nbElimines ? i + 1 : undefined,
  }));
}

/** Roster groupé en squads de taille fixe (demo mode duo/squad). */
function genererParticipantsSquad(effectif: number, tailleEquipe: number, nbElimines: number, graine: number): ParticipantBR[] {
  return melangerNoms(graine)
    .slice(0, effectif)
    .map((nom, i) => ({
      id: `br-${i}`,
      nom,
      statut: i < nbElimines ? ("elimine" as const) : ("en_jeu" as const),
      ordreElimination: i < nbElimines ? i + 1 : undefined,
      equipe: `Squad ${Math.floor(i / tailleEquipe) + 1}`,
    }));
}

const PARTICIPANTS_INITIAUX: Record<string, ParticipantBR[]> = {
  "freefire-night": genererParticipants(15),
  "br-solo-yopougon": genererParticipants(14, 7),
  "br-squad-treichville": genererParticipantsSquad(48, 4, 16, 13),
};

const CLE_PARTICIPANTS_BR = "tourney-participants-br";
const CLE_MANCHES_BR = "tourney-manches-br";

function lireOverlayParticipants(): Record<string, ParticipantBR[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_PARTICIPANTS_BR);
    return brut ? (JSON.parse(brut) as Record<string, ParticipantBR[]>) : {};
  } catch {
    return {};
  }
}

export function participantsBR(tournoiId: string): ParticipantBR[] {
  const overlay = lireOverlayParticipants()[tournoiId];
  if (overlay) return overlay;
  return PARTICIPANTS_INITIAUX[tournoiId] ?? [];
}

function lireOverlayManches(): Record<string, MancheBR[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_MANCHES_BR);
    return brut ? (JSON.parse(brut) as Record<string, MancheBR[]>) : {};
  } catch {
    return {};
  }
}

export function manchesBR(tournoiId: string): MancheBR[] {
  return lireOverlayManches()[tournoiId] ?? [];
}

export function ajouterMancheBR(tournoiId: string, resultats: ResultatManche[]) {
  if (typeof window === "undefined") return;
  const overlay = lireOverlayManches();
  const manches = overlay[tournoiId] ?? [];
  const nouvelle: MancheBR = { numero: manches.length + 1, resultats, horodatage: Date.now() };
  localStorage.setItem(CLE_MANCHES_BR, JSON.stringify({ ...overlay, [tournoiId]: [...manches, nouvelle] }));
}

/** Classement cumulé sur toutes les manches jouées, trié par points décroissants.
 * Une unité = un joueur (solo) ou une équipe (duo/squad). Les moitié supérieure
 * (avec au moins un point) sont marqués "Qualifié". */
export function classementCumuleBR(tournoiId: string, sousType: SousTypeBR = "solo"): LigneClassementBR[] {
  const unites = unitesBR(tournoiId, sousType);
  const manches = manchesBR(tournoiId);
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
 * de tournoi) : cumul des manches si disponible, sinon ancien ordre par élimination. */
export function classementFinalBR(tournoiId: string, sousType: SousTypeBR = "solo"): string[] {
  const manches = manchesBR(tournoiId);
  if (manches.length > 0) {
    return classementCumuleBR(tournoiId, sousType).map((l) => l.nom);
  }
  const participants = participantsBR(tournoiId);
  const enJeu = participants.filter((p) => p.statut === "en_jeu").map((p) => p.nom);
  const elimines = [...participants]
    .filter((p) => p.statut === "elimine")
    .sort((a, b) => (b.ordreElimination ?? 0) - (a.ordreElimination ?? 0))
    .map((p) => p.nom);
  return [...enJeu, ...elimines];
}
