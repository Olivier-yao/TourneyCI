import { prisma } from "@/lib/prisma";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

export type MessageChatJSON = { id: string; auteur: string; texte: string; horodatage: number; role: "organisateur" | "participant" };

/** Adapte un lot de lignes `messages_chat` vers le format attendu côté UI
 * (auteur = pseudo, role dérivé du tournoi plutôt que stocké par message —
 * même principe que termine/enDirect : calculé à la lecture). Une seule
 * requête de résolution des pseudos pour tout le lot. */
export async function versMessagesChatJSON(
  lignes: { id: string; auteur_id: string; texte: string; created_at: Date }[],
  organisateurId: string,
): Promise<MessageChatJSON[]> {
  const ids = Array.from(new Set(lignes.map((l) => l.auteur_id)));
  const profils = ids.length > 0 ? await prisma.profiles.findMany({ where: { id: { in: ids } }, select: { id: true, pseudo: true } }) : [];
  const pseudos = new Map(profils.map((p) => [p.id, p.pseudo]));

  const adjoints = new Set<string>();
  for (const id of ids) {
    if (id !== organisateurId && (await estAdjointAccepteDe(organisateurId, id))) adjoints.add(id);
  }

  return lignes.map((l) => ({
    id: l.id,
    auteur: pseudos.get(l.auteur_id) ?? "?",
    texte: l.texte,
    horodatage: l.created_at.getTime(),
    role: l.auteur_id === organisateurId || adjoints.has(l.auteur_id) ? "organisateur" : "participant",
  }));
}
