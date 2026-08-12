/**
 * Données mock pour un tournoi Battle Royale (une seule manche, pas d'arbre).
 * Élimination et fil d'actions persistés en localStorage (overlay par-dessus
 * la génération aléatoire initiale), pour survivre aux rechargements et
 * nourrir la distribution automatique des points en fin de tournoi.
 */

export type StatutBR = "en_jeu" | "elimine";

export type ParticipantBR = {
  id: string;
  nom: string;
  statut: StatutBR;
  ordreElimination?: number;
};

export type ActionBR = {
  id: string;
  acteur: string;
  cible: string;
  libelle: string;
  horodatage: number;
};

export const ACTIONS_PREDEFINIES: { id: string; libelle: string; eliminecible: boolean }[] = [
  { id: "elimine", libelle: "a éliminé", eliminecible: true },
  { id: "a_terre", libelle: "a mis à terre", eliminecible: false },
  { id: "reanime", libelle: "a réanimé", eliminecible: false },
  { id: "duel", libelle: "a remporté un duel contre", eliminecible: false },
];

const NOMS = [
  "Kader B.", "Yao M.", "Aya K.", "Sory D.", "Ismaël T.", "Fofana", "Traoré", "Bamba",
  "Malik K.", "Fatou T.", "Gohou", "Halima", "Nour", "Zeka", "Petit", "Delta",
  "Mariam D.", "Issa K.", "Abou S.", "Awa C.", "Kouassi", "Adjoua", "Brou", "Konan",
  "Yves L.", "Nadège", "Serge P.", "Aminata", "Moussa D.", "Rokia", "Boubacar", "Christelle",
  "Franck O.", "Grace A.", "Hervé", "Inès B.", "Jean-Luc", "Kadidia", "Lamine", "Marc T.",
  "Nadia S.", "Oumar B.", "Priscille", "Quentin", "Rachelle", "Salif K.", "Tenin", "Ulrich",
  "Vanessa", "William K.",
];

function genererParticipants(nbElimines: number): ParticipantBR[] {
  const melanges = [...NOMS];
  for (let i = melanges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [melanges[i], melanges[j]] = [melanges[j], melanges[i]];
  }

  return melanges.map((nom, i) => ({
    id: `br-${i}`,
    nom,
    statut: i < nbElimines ? "elimine" : "en_jeu",
    ordreElimination: i < nbElimines ? i + 1 : undefined,
  }));
}

const PARTICIPANTS_INITIAUX: Record<string, ParticipantBR[]> = {
  "freefire-night": genererParticipants(15),
};

const CLE_PARTICIPANTS_BR = "tourney-participants-br";
const CLE_ACTIONS_BR = "tourney-actions-br";

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

function sauvegarderParticipants(tournoiId: string, participants: ParticipantBR[]) {
  if (typeof window === "undefined") return;
  const overlay = lireOverlayParticipants();
  localStorage.setItem(CLE_PARTICIPANTS_BR, JSON.stringify({ ...overlay, [tournoiId]: participants }));
}

export function eliminerParticipantBR(tournoiId: string, participantId: string) {
  const participants = participantsBR(tournoiId);
  const ordreMax = Math.max(0, ...participants.map((p) => p.ordreElimination ?? 0));
  const maj = participants.map((p) =>
    p.id === participantId ? { ...p, statut: "elimine" as const, ordreElimination: ordreMax + 1 } : p,
  );
  sauvegarderParticipants(tournoiId, maj);
}

function eliminerParNom(tournoiId: string, nom: string) {
  const cible = participantsBR(tournoiId).find((p) => p.nom === nom && p.statut === "en_jeu");
  if (cible) eliminerParticipantBR(tournoiId, cible.id);
}

function lireOverlayActions(): Record<string, ActionBR[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_ACTIONS_BR);
    return brut ? (JSON.parse(brut) as Record<string, ActionBR[]>) : {};
  } catch {
    return {};
  }
}

export function filActionsBR(tournoiId: string): ActionBR[] {
  return lireOverlayActions()[tournoiId] ?? [];
}

export function ajouterActionBR(tournoiId: string, acteur: string, cible: string, actionId: string) {
  if (typeof window === "undefined") return;
  const action = ACTIONS_PREDEFINIES.find((a) => a.id === actionId);
  if (!action) return;

  const overlay = lireOverlayActions();
  const fil = overlay[tournoiId] ?? [];
  const nouvelle: ActionBR = {
    id: `act-${Date.now().toString(36)}`,
    acteur,
    cible,
    libelle: action.libelle,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_ACTIONS_BR, JSON.stringify({ ...overlay, [tournoiId]: [nouvelle, ...fil] }));

  if (action.eliminecible) eliminerParNom(tournoiId, cible);
}

/** Classement final (1er = dernier survivant), pour la distribution
 * automatique des points en fin de tournoi. */
export function classementFinalBR(tournoiId: string): string[] {
  const participants = participantsBR(tournoiId);
  const enJeu = participants.filter((p) => p.statut === "en_jeu").map((p) => p.nom);
  const elimines = [...participants]
    .filter((p) => p.statut === "elimine")
    .sort((a, b) => (b.ordreElimination ?? 0) - (a.ordreElimination ?? 0))
    .map((p) => p.nom);
  return [...enJeu, ...elimines];
}
