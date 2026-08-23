/**
 * Demandes d'annulation de tournoi (point 116) : l'organisateur ne peut plus
 * annuler directement — il motive sa demande, qui part à l'administration
 * pour inspection. Le tournoi reste actif tant qu'elle n'est pas validée.
 */

export type StatutDemandeAnnulation = "en_attente" | "validee" | "refusee";

export type DemandeAnnulation = {
  id: string;
  tournoiId: string;
  motif: string;
  statut: StatutDemandeAnnulation;
  /** Motif du refus ou note de validation, visible par l'organisateur (point 160). */
  messageAdmin?: string;
  horodatage: number;
};

/** Une seule demande active à la fois par tournoi. */
export async function demandeAnnulationPourTournoi(tournoiId: string): Promise<DemandeAnnulation | undefined> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/demande-annulation`);
  if (!reponse.ok) return undefined;
  const json = await reponse.json().catch(() => null);
  return json?.success ? (json.data ?? undefined) : undefined;
}

/** La demande la plus récente quel que soit son statut — pour afficher le
 * motif réel d'un tournoi déjà annulé (écran Régie). */
export async function derniereDemandeAnnulation(tournoiId: string): Promise<DemandeAnnulation | undefined> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/demande-annulation?derniere=1`);
  if (!reponse.ok) return undefined;
  const json = await reponse.json().catch(() => null);
  return json?.success ? (json.data ?? undefined) : undefined;
}

export async function creerDemandeAnnulation(tournoiId: string, motif: string): Promise<DemandeAnnulation | null> {
  if (!motif.trim()) return null;
  const reponse = await fetch(`/api/tournois/${tournoiId}/demande-annulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motif: motif.trim() }),
  });
  if (!reponse.ok) return null;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : null;
}
