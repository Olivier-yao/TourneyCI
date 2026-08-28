import { apiFetch } from "./api";

/** Port de src/lib/mockRoomInfo.ts — infos de connexion à la room
 * (lien/mot de passe), lisibles par l'organisateur et tout inscrit. */
export type InfosRoom = { lien: string; motDePasse: string };

export async function infosRoomDuTournoi(tournoiId: string): Promise<InfosRoom> {
  const resultat = await apiFetch<InfosRoom>(`/api/tournois/${tournoiId}/room`);
  return resultat.success ? resultat.data : { lien: "", motDePasse: "" };
}
