/**
 * Litiges sur un match (points A1-A3 du design v3) : signalement structuré
 * (motif + preuve) distinct de la simple contestation de résultat final
 * (mockAppel.ts, point 25). Mock mono-appareil : aucun back-office de
 * modération réel, un litige reste "en attente" tant qu'aucune action admin
 * ne le referme.
 */

export type StatutLitige = "en_attente" | "resolu_faveur" | "rejete";

export type Litige = {
  id: string;
  matchId: string;
  tournoiId: string;
  tournoiTitre: string;
  adversaire: string;
  arbitre: string;
  motifId: string;
  motifLabel: string;
  description: string;
  preuves: string[];
  statut: StatutLitige;
  horodatage: number;
};

const CLE_LITIGES = "tourney-litiges";

function lireTout(): Litige[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_LITIGES);
    return brut ? (JSON.parse(brut) as Litige[]) : [];
  } catch {
    return [];
  }
}

export function mesLitiges(): Litige[] {
  return lireTout().sort((a, b) => b.horodatage - a.horodatage);
}

export function litigeDuMatch(matchId: string): Litige | undefined {
  return lireTout().find((l) => l.matchId === matchId);
}

export function litigeParId(id: string): Litige | undefined {
  return lireTout().find((l) => l.id === id);
}

export function creerLitige(donnees: {
  matchId: string;
  tournoiId: string;
  tournoiTitre: string;
  adversaire: string;
  arbitre: string;
  motifId: string;
  motifLabel: string;
  description: string;
  preuves: string[];
}): Litige {
  const litige: Litige = {
    id: `LT-${Date.now().toString(36).toUpperCase()}`,
    statut: "en_attente",
    horodatage: Date.now(),
    ...donnees,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CLE_LITIGES, JSON.stringify([...lireTout(), litige]));
  }
  return litige;
}

export function ajouterPreuveLitige(litigeId: string, nomFichier: string) {
  if (typeof window === "undefined") return;
  const tout = lireTout();
  const maj = tout.map((l) => (l.id === litigeId ? { ...l, preuves: [...l.preuves, nomFichier] } : l));
  localStorage.setItem(CLE_LITIGES, JSON.stringify(maj));
}

/** Tranche un litige côté organisateur : "resolu_faveur" donne raison au
 * joueur qui a signalé, "rejete" maintient le score déjà enregistré. */
export function resoudreLitige(litigeId: string, statut: "resolu_faveur" | "rejete") {
  if (typeof window === "undefined") return;
  const tout = lireTout();
  const maj = tout.map((l) => (l.id === litigeId ? { ...l, statut } : l));
  localStorage.setItem(CLE_LITIGES, JSON.stringify(maj));
}
