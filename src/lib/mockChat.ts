/**
 * Chats en direct d'un tournoi, désormais réels (Postgres, table
 * messages_chat) : trois salons distincts partagent le même backend.
 * - Chat du tournoi (salon "general") : réservé aux inscrits + organisateur.
 * - Tribune des spectateurs d'un match (salon "tribune") : lecture ouverte
 *   à tous, écriture réservée aux comptes connectés.
 * - Salon des inscrits d'un match (salon "inscrits") : entièrement privé.
 * auteur (pseudo) et role (organisateur/participant) sont dérivés côté
 * serveur à partir de la session — plus besoin de les passer au client.
 */

export type MessageChat = {
  id: string;
  auteur: string;
  texte: string;
  horodatage: number;
  role: "organisateur" | "participant";
};

async function recupererMessages(url: string): Promise<MessageChat[]> {
  const reponse = await fetch(url);
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

async function envoyerMessage(url: string, texte: string): Promise<void> {
  if (!texte.trim()) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texte: texte.trim() }),
  });
}

export function messagesChatTournoi(tournoiId: string): Promise<MessageChat[]> {
  return recupererMessages(`/api/tournois/${tournoiId}/chat`);
}

export function envoyerMessageChatTournoi(tournoiId: string, texte: string): Promise<void> {
  return envoyerMessage(`/api/tournois/${tournoiId}/chat`, texte);
}

export function messagesChatTribune(matchId: string): Promise<MessageChat[]> {
  return recupererMessages(`/api/matches/${matchId}/chat`);
}

export function envoyerMessageChatTribune(matchId: string, texte: string): Promise<void> {
  return envoyerMessage(`/api/matches/${matchId}/chat`, texte);
}

export function messagesChatInscrits(matchId: string): Promise<MessageChat[]> {
  return recupererMessages(`/api/matches/${matchId}/chat-inscrits`);
}

export function envoyerMessageChatInscrits(matchId: string, texte: string): Promise<void> {
  return envoyerMessage(`/api/matches/${matchId}/chat-inscrits`, texte);
}
