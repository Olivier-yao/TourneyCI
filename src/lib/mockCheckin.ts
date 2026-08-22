/**
 * "Check-in" (validation de présence) des inscrits, juste avant le début du
 * tournoi. Un nom (pseudo, ou nom d'équipe pour les tournois Équipes) est
 * soit "présent", soit "en attente".
 */

export async function presentsDuTournoi(tournoiId: string): Promise<string[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/checkin`);
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export function estPresent(presents: string[], nom: string): boolean {
  return presents.includes(nom);
}

/** Confirme (ou retire) la présence de "nom" — réservé à l'organisateur/ses
 * adjoints quand nom diffère du compte connecté (cf. gestion des inscrits). */
export async function definirPresence(tournoiId: string, nom: string, present: boolean): Promise<string[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, present }),
  });
  if (!reponse.ok) return presentsDuTournoi(tournoiId);
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

/** Confirme sa propre présence (compte connecté). */
export async function confirmerMaPresence(tournoiId: string): Promise<string[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ present: true }),
  });
  if (!reponse.ok) return presentsDuTournoi(tournoiId);
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}
