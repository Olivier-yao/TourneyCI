/**
 * Plaintes/signalements envoyés depuis "Service client" (point 148) —
 * distinctes des litiges de match (mockLitige.ts) : un problème de sécurité
 * ou de comportement qui concerne la plateforme elle-même, examiné dans
 * l'interface administrateur sécurisée (point 160).
 *
 * Réel côté serveur (table `plaintes`, déjà présente en base mais jamais
 * exploitée — cf. src/lib/server/plaintes.ts) — remplace l'ancien stockage
 * localStorage, qui ne pouvait pas rester "un registre partagé" comme
 * l'exigeait déjà le commentaire d'origine (l'admin doit voir les
 * signalements envoyés depuis n'importe quel appareil).
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

export async function creerPlainte(sujet: string, description: string): Promise<Plainte | null> {
  const reponse = await fetch("/api/plaintes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sujet, description }),
  });
  if (!reponse.ok) return null;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : null;
}

/** Supervision admin (lecture seule côté client — le traitement passe par
 * traiterPlainte ci-dessous). */
export async function plaintesEnAttente(): Promise<Plainte[]> {
  const reponse = await fetch("/api/tourney-control/plaintes");
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function traiterPlainte(id: string, messageAdmin: string): Promise<void> {
  await fetch(`/api/tourney-control/plaintes/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageAdmin }),
  });
}
