import { apiFetch } from "./api";
import type { Tournoi } from "./tournois";

/** Tournois organisés par le compte connecté — même endpoint que
 * listerTournois() avec ?organisateur=me (src/app/api/tournois/route.ts). */
export async function mesTournoisOrganises(): Promise<Tournoi[]> {
  const resultat = await apiFetch<Tournoi[]>("/api/tournois?organisateur=me");
  return resultat.success ? resultat.data : [];
}
