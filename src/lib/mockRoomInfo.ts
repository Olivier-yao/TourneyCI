/**
 * Informations de connexion à la room (lien + mot de passe), communiquées
 * par l'organisateur une fois les inscriptions closes (point 121). Simple
 * overlay par tournoi, modifiable à tout moment en cas d'erreur de saisie.
 */

export type InfosRoom = { lien: string; motDePasse: string };

const VIDE: InfosRoom = { lien: "", motDePasse: "" };

export async function infosRoomDuTournoi(tournoiId: string): Promise<InfosRoom> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/room`);
  if (!reponse.ok) return VIDE;
  const json = await reponse.json();
  return json.success ? json.data : VIDE;
}

export async function definirInfosRoom(tournoiId: string, infos: InfosRoom): Promise<void> {
  await fetch(`/api/tournois/${tournoiId}/room`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(infos),
  });
}
