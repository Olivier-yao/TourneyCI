import { prisma } from "@/lib/prisma";
import type { messages_chat } from "@/generated/prisma/client";
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

/** Tribune spectateurs — toujours scopée par tournoi_id (jamais match_id,
 * volontairement laissé à null) : un tournoi en direct sans aucun match
 * généré (bracket pas encore lancé, ou entre deux matchs) n'a pas de match
 * à rattacher, et la discussion doit rester continue du début à la fin de
 * l'événement plutôt que d'être remise à zéro à chaque match. Accessible
 * aussi bien via /api/tournois/[id]/chat-spectateurs (lien direct depuis la
 * fiche tournoi en direct) que via /api/matches/[id]/chat (lien depuis
 * l'écran d'un match précis) — les deux lisent/écrivent le même fil. */
export async function messagesTribuneJSON(tournoiId: string, organisateurId: string): Promise<MessageChatJSON[]> {
  const messages = await prisma.messages_chat.findMany({
    where: { tournoi_id: tournoiId, salon: "tribune" },
    orderBy: { created_at: "asc" },
  });
  return versMessagesChatJSON(messages, organisateurId);
}

export function envoyerMessageTribune(tournoiId: string, auteurId: string, texte: string): Promise<messages_chat> {
  return prisma.messages_chat.create({ data: { tournoi_id: tournoiId, auteur_id: auteurId, texte, salon: "tribune" } });
}

/** Fenêtre glissante utilisée pour compter des "spectateurs actifs" : compte
 * de comptes distincts ayant écrit dans la tribune récemment — remplace un
 * ancien nombre simulé (hash déterministe de l'id, aucune donnée réelle
 * derrière). Ce n'est qu'une mesure d'activité de chat, pas une vraie
 * présence temps réel (personne ne "compte" les lecteurs silencieux, cf.
 * absence de Realtime Presence dans ce projet) — assumé comme suffisant pour
 * "le nombre de spectateurs qui discutent". */
const FENETRE_SPECTATEURS_MS = 15 * 60_000;

export async function compteSpectateursTribunePlusieurs(tournoiIds: string[]): Promise<Record<string, number>> {
  const resultat: Record<string, number> = {};
  for (const id of tournoiIds) resultat[id] = 0;
  if (tournoiIds.length === 0) return resultat;

  const depuis = new Date(Date.now() - FENETRE_SPECTATEURS_MS);
  const lignes = await prisma.$queryRaw<{ tournoi_id: string; n: bigint }[]>`
    SELECT tournoi_id, count(DISTINCT auteur_id) AS n
    FROM messages_chat
    WHERE tournoi_id = ANY(${tournoiIds}::uuid[]) AND salon = 'tribune' AND created_at >= ${depuis}
    GROUP BY tournoi_id
  `;
  for (const ligne of lignes) resultat[ligne.tournoi_id] = Number(ligne.n);
  return resultat;
}
