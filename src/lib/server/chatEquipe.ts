/**
 * Chat d'équipe réel (priorité backend #5) — remplace mockChatEquipe.ts
 * (localStorage, jamais partagé d'un appareil à l'autre). Même principe que
 * src/lib/server/chat.ts (chat de tournoi) : le rôle ("chef" pour la
 * couronne) est dérivé à la lecture depuis equipes_profil.chef_id, jamais
 * stocké par message.
 */

import { prisma } from "@/lib/prisma";

export type MessageChatEquipeJSON = { id: string; type: "message" | "systeme"; auteur?: string; estChef?: boolean; texte: string; horodatage: number };

export async function estMembreEquipeProfil(equipeId: string, profileId: string): Promise<boolean> {
  const ligne = await prisma.equipes_profil.findUnique({
    where: { id: equipeId },
    select: { chef_id: true, equipes_profil_membres: { where: { profile_id: profileId } } },
  });
  return Boolean(ligne) && (ligne!.chef_id === profileId || ligne!.equipes_profil_membres.length > 0);
}

export async function messagesChatEquipeJSON(equipeId: string): Promise<MessageChatEquipeJSON[]> {
  const equipe = await prisma.equipes_profil.findUnique({ where: { id: equipeId }, select: { chef_id: true } });
  if (!equipe) return [];

  const lignes = await prisma.messages_chat_equipe.findMany({ where: { equipe_id: equipeId }, orderBy: { created_at: "asc" } });
  const auteurIds = Array.from(new Set(lignes.map((l) => l.auteur_id).filter((id): id is string => !!id)));
  const profils = auteurIds.length > 0 ? await prisma.profiles.findMany({ where: { id: { in: auteurIds } }, select: { id: true, pseudo: true } }) : [];
  const pseudos = new Map(profils.map((p) => [p.id, p.pseudo]));

  return lignes.map((l) => ({
    id: l.id,
    type: l.type,
    auteur: l.auteur_id ? (pseudos.get(l.auteur_id) ?? "?") : undefined,
    estChef: l.auteur_id ? l.auteur_id === equipe.chef_id : undefined,
    texte: l.texte,
    horodatage: l.created_at.getTime(),
  }));
}

export async function envoyerMessageChatEquipe(equipeId: string, auteurId: string, texte: string): Promise<void> {
  await prisma.messages_chat_equipe.create({ data: { equipe_id: equipeId, auteur_id: auteurId, texte, type: "message" } });
}
