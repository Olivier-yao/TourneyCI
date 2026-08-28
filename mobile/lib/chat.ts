import { apiFetch } from "./api";

/** Chat "des inscrits" du tournoi (salon "general") — lecture publique,
 * écriture réservée aux inscrits/organisateur (cf. src/app/api/tournois/
 * [id]/chat/route.ts). Le salon "tribune" (spectateurs) reste hors scope
 * mobile pour l'instant. */
export type MessageChat = { id: string; auteur: string; texte: string; horodatage: number; role: "organisateur" | "participant" };

export async function chargerChat(tournoiId: string): Promise<MessageChat[]> {
  const resultat = await apiFetch<MessageChat[]>(`/api/tournois/${tournoiId}/chat`);
  return resultat.success ? resultat.data : [];
}

export async function envoyerMessage(tournoiId: string, texte: string): Promise<MessageChat | undefined> {
  const resultat = await apiFetch<MessageChat>(`/api/tournois/${tournoiId}/chat`, {
    method: "POST",
    body: JSON.stringify({ texte }),
  });
  return resultat.success ? resultat.data : undefined;
}
