/**
 * Plaintes/signalements envoyés depuis "Service client" (point 148) —
 * distinctes des litiges de match (mockLitige.ts) : un problème de sécurité
 * ou de comportement qui concerne la plateforme elle-même, examiné dans
 * l'interface administrateur sécurisée (point 160).
 */

export type StatutPlainte = "en_attente" | "traitee";

export type Plainte = {
  id: string;
  auteur: string;
  sujet: string;
  description: string;
  statut: StatutPlainte;
  /** Réponse de l'administration, visible par l'auteur (point 160). */
  messageAdmin?: string;
  horodatage: number;
};

const CLE_PLAINTES = "tourney-plaintes";

function lireTout(): Plainte[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_PLAINTES);
    return brut ? (JSON.parse(brut) as Plainte[]) : [];
  } catch {
    return [];
  }
}

export function creerPlainte(auteur: string, sujet: string, description: string): Plainte | null {
  if (typeof window === "undefined" || !sujet.trim() || !description.trim()) return null;
  const plainte: Plainte = {
    id: `plt-${Date.now().toString(36)}`,
    auteur,
    sujet: sujet.trim(),
    description: description.trim(),
    statut: "en_attente",
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_PLAINTES, JSON.stringify([...lireTout(), plainte]));
  return plainte;
}

export function mesPlaintes(auteur: string): Plainte[] {
  return lireTout()
    .filter((p) => p.auteur === auteur)
    .sort((a, b) => b.horodatage - a.horodatage);
}

export function plaintesEnAttente(): Plainte[] {
  return lireTout()
    .filter((p) => p.statut === "en_attente")
    .sort((a, b) => a.horodatage - b.horodatage);
}

export function traiterPlainte(id: string, messageAdmin: string) {
  if (typeof window === "undefined") return;
  const maj = lireTout().map((p) => (p.id === id ? { ...p, statut: "traitee" as const, messageAdmin: messageAdmin.trim() || undefined } : p));
  localStorage.setItem(CLE_PLAINTES, JSON.stringify(maj));
}
