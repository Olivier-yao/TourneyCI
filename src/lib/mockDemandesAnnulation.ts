/**
 * Demandes d'annulation de tournoi (point 116) : l'organisateur ne peut plus
 * annuler directement — il motive sa demande, qui part à l'administration
 * pour inspection. Le tournoi reste actif tant qu'elle n'est pas validée.
 */

import { VALIDATION_AUTOMATIQUE_ACTIVE } from "./mockValidationAuto";
import { annulerTournoi } from "./mockTournaments";

export type StatutDemandeAnnulation = "en_attente" | "validee" | "refusee";

export type DemandeAnnulation = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  organisateur: string;
  motif: string;
  statut: StatutDemandeAnnulation;
  /** Motif du refus ou note de validation, visible par l'organisateur (point 160). */
  messageAdmin?: string;
  horodatage: number;
};

const CLE_DEMANDES_ANNULATION = "tourney-demandes-annulation";

function lireTout(): DemandeAnnulation[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_DEMANDES_ANNULATION);
    return brut ? (JSON.parse(brut) as DemandeAnnulation[]) : [];
  } catch {
    return [];
  }
}

/** Une seule demande active à la fois par tournoi. */
export function demandeAnnulationPourTournoi(tournoiId: string): DemandeAnnulation | undefined {
  return lireTout().find((d) => d.tournoiId === tournoiId && d.statut === "en_attente");
}

export function creerDemandeAnnulation(
  tournoiId: string,
  tournoiTitre: string,
  organisateur: string,
  motif: string,
): DemandeAnnulation | null {
  if (typeof window === "undefined" || !motif.trim()) return null;
  if (demandeAnnulationPourTournoi(tournoiId)) return null;
  const demande: DemandeAnnulation = {
    id: `annul-${Date.now().toString(36)}`,
    tournoiId,
    tournoiTitre,
    organisateur,
    motif: motif.trim(),
    statut: VALIDATION_AUTOMATIQUE_ACTIVE ? "validee" : "en_attente",
    messageAdmin: VALIDATION_AUTOMATIQUE_ACTIVE ? "Validation automatique (pré-backend, point 157)." : undefined,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_DEMANDES_ANNULATION, JSON.stringify([...lireTout(), demande]));
  // Pré-backend (point 157) : l'administration ne clique plus "Valider" pour
  // déclencher l'annulation réelle (annulerTournoi gère remboursements etc.,
  // point 22) puisque la demande est déjà "validee" — on l'appelle donc ici.
  if (VALIDATION_AUTOMATIQUE_ACTIVE) annulerTournoi(tournoiId);
  return demande;
}

export function demandesEnAttente(): DemandeAnnulation[] {
  return lireTout()
    .filter((d) => d.statut === "en_attente")
    .sort((a, b) => a.horodatage - b.horodatage);
}

export function traiterDemandeAnnulation(id: string, statut: "validee" | "refusee", messageAdmin?: string) {
  if (typeof window === "undefined") return;
  const maj = lireTout().map((d) => (d.id === id ? { ...d, statut, messageAdmin: messageAdmin?.trim() || undefined } : d));
  localStorage.setItem(CLE_DEMANDES_ANNULATION, JSON.stringify(maj));
}
