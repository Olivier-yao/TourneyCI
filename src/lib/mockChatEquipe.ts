/**
 * Chat d'équipe (design v8, lot N1) : scope par équipe pré-créée, pas par
 * tournoi — contrairement à mockChat.ts (chat de tournoi), ce fil reste
 * accessible entre les tournois auxquels l'équipe participe ensemble.
 * Persisté en localStorage, à remplacer par un vrai canal temps réel une
 * fois le backend en place (voir ROADMAP-backend-et-mobile.md).
 */

export type MessageChatEquipe = {
  id: string;
  type: "message" | "systeme";
  auteur?: string;
  texte: string;
  horodatage: number;
};

const CLE = "tourney-chat-equipe";

function lireTout(): Record<string, MessageChatEquipe[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Record<string, MessageChatEquipe[]>) : {};
  } catch {
    return {};
  }
}

function ecrire(equipeId: string, messages: MessageChatEquipe[]) {
  if (typeof window === "undefined") return;
  const tout = lireTout();
  localStorage.setItem(CLE, JSON.stringify({ ...tout, [equipeId]: messages }));
}

export function messagesChatEquipe(equipeId: string): MessageChatEquipe[] {
  return lireTout()[equipeId] ?? [];
}

export function envoyerMessageChatEquipe(equipeId: string, auteur: string, texte: string) {
  if (typeof window === "undefined" || !texte.trim()) return;
  const existants = messagesChatEquipe(equipeId);
  const message: MessageChatEquipe = { id: `msgeq-${Date.now().toString(36)}`, type: "message", auteur, texte: texte.trim(), horodatage: Date.now() };
  ecrire(equipeId, [...existants, message]);
}

/** Message système auto (rejoint l'équipe, inscription confirmée...) — pas
 * de saisie utilisateur, juste un repère de contexte dans le fil. */
export function ajouterMessageSystemeEquipe(equipeId: string, texte: string) {
  if (typeof window === "undefined") return;
  const existants = messagesChatEquipe(equipeId);
  const message: MessageChatEquipe = { id: `sysmsgeq-${Date.now().toString(36)}`, type: "systeme", texte, horodatage: Date.now() };
  ecrire(equipeId, [...existants, message]);
}
