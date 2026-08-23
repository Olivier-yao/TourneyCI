/**
 * Chat d'équipe (design v8, lot N1) : scope par équipe pré-créée, pas par
 * tournoi — contrairement à mockChat.ts (chat de tournoi), ce fil reste
 * accessible entre les tournois auxquels l'équipe participe ensemble.
 *
 * Réel côté serveur (table messages_chat_equipe, RLS réservée aux membres —
 * cf. src/lib/server/chatEquipe.ts) — remplace l'ancien stockage
 * localStorage, jamais partagé d'un appareil à l'autre (bug rapporté :
 * "je ne reçois aucun message").
 */

export type MessageChatEquipe = { id: string; type: "message" | "systeme"; auteur?: string; estChef?: boolean; texte: string; horodatage: number };

export async function messagesChatEquipe(equipeId: string): Promise<MessageChatEquipe[]> {
  const reponse = await fetch(`/api/equipes-profil/${equipeId}/chat`);
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function envoyerMessageChatEquipe(equipeId: string, texte: string): Promise<MessageChatEquipe[]> {
  if (!texte.trim()) return messagesChatEquipe(equipeId);
  const reponse = await fetch(`/api/equipes-profil/${equipeId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texte }),
  });
  if (!reponse.ok) return messagesChatEquipe(equipeId);
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}
