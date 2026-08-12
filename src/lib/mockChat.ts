/**
 * Chat mock réservé aux inscrits d'un tournoi (+ organisateur), actif dès la
 * clôture des inscriptions et pendant le déroulement du tournoi. Persisté en
 * localStorage, à remplacer par un vrai canal temps réel en phase 8.
 */

export type MessageChat = {
  id: string;
  auteur: string;
  texte: string;
  horodatage: number;
  role: "organisateur" | "participant";
};

const CLE_CHAT = "tourney-chat";

function lireTout(): Record<string, MessageChat[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_CHAT);
    return brut ? (JSON.parse(brut) as Record<string, MessageChat[]>) : {};
  } catch {
    return {};
  }
}

export function messagesChat(tournoiId: string): MessageChat[] {
  return lireTout()[tournoiId] ?? [];
}

export function envoyerMessageChat(tournoiId: string, auteur: string, texte: string, role: "organisateur" | "participant") {
  if (typeof window === "undefined" || !texte.trim()) return;
  const tout = lireTout();
  const existants = tout[tournoiId] ?? [];
  const message: MessageChat = { id: `msg-${Date.now().toString(36)}`, auteur, texte: texte.trim(), horodatage: Date.now(), role };
  localStorage.setItem(CLE_CHAT, JSON.stringify({ ...tout, [tournoiId]: [...existants, message] }));
}
