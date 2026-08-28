import { apiFetch } from "./api";

/** Port de src/lib/mockCheckin.ts — présence à l'inscription (check-in). */
export async function presentsDuTournoi(tournoiId: string): Promise<string[]> {
  const resultat = await apiFetch<string[]>(`/api/tournois/${tournoiId}/checkin`);
  return resultat.success ? resultat.data : [];
}

export async function confirmerMaPresence(tournoiId: string): Promise<string[]> {
  const resultat = await apiFetch<string[]>(`/api/tournois/${tournoiId}/checkin`, {
    method: "POST",
    body: JSON.stringify({ present: true }),
  });
  return resultat.success ? resultat.data : [];
}
