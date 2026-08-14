/**
 * Informations de connexion à la room (lien + mot de passe), communiquées
 * par l'organisateur une fois les inscriptions closes (point 121). Simple
 * overlay par tournoi, modifiable à tout moment en cas d'erreur de saisie.
 */

export type InfosRoom = { lien: string; motDePasse: string };

const CLE_ROOM_INFOS = "tourney-room-infos";
const VIDE: InfosRoom = { lien: "", motDePasse: "" };

function lireTout(): Record<string, InfosRoom> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_ROOM_INFOS);
    return brut ? (JSON.parse(brut) as Record<string, InfosRoom>) : {};
  } catch {
    return {};
  }
}

export function infosRoomDuTournoi(tournoiId: string): InfosRoom {
  return lireTout()[tournoiId] ?? VIDE;
}

export function definirInfosRoom(tournoiId: string, infos: InfosRoom) {
  if (typeof window === "undefined") return;
  const tout = lireTout();
  localStorage.setItem(CLE_ROOM_INFOS, JSON.stringify({ ...tout, [tournoiId]: infos }));
}
