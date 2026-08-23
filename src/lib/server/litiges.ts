/**
 * Litiges sur un match (priorité backend #6) — remplace mockLitige.ts
 * (localStorage). La table `litiges` existait déjà en base (migration
 * v2_identite_organisateurs ou antérieure) mais rien ne l'utilisait ; le
 * commentaire d'origine du mock était explicite : "doit rester un registre
 * partagé, visible des deux côtés" — impossible avec du localStorage, un
 * litige signalé depuis l'appareil d'un joueur n'était jamais visible côté
 * organisateur sur un autre appareil.
 */

import { prisma } from "@/lib/prisma";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

/** Motifs fixes (5 options) — le mock les stockait comme {id, label} côté
 * client ; la colonne `litiges.motif` ne garde que l'id, le label est
 * résolu à la lecture. */
export const MOTIFS_LITIGE: Record<string, string> = {
  score: "Score erroné",
  noshow: "L'adversaire ne s'est pas présenté",
  cheat: "Triche suspectée",
  conn: "Déconnexion en cours de partie",
  other: "Autre motif",
};

export type LitigeJSON = {
  id: string;
  matchId: string;
  tournoiId: string;
  tournoiTitre: string;
  adversaire: string;
  arbitre: string;
  motifId: string;
  motifLabel: string;
  description: string;
  preuves: string[];
  statut: string;
  horodatage: number;
};

type LitigeAvecRelations = {
  id: string;
  match_id: string;
  auteur_id: string;
  motif: string;
  description: string;
  preuves: string[];
  statut: string;
  created_at: Date;
  matches: { joueur1: string | null; joueur2: string | null; tournoi_id: string; tournois: { id: string; titre: string; organisateur_id: string } };
  profiles: { pseudo: string };
};

async function versLitigesJSON(lignes: LitigeAvecRelations[]): Promise<LitigeJSON[]> {
  const organisateurIds = Array.from(new Set(lignes.map((l) => l.matches.tournois.organisateur_id)));
  const organisateurs = organisateurIds.length > 0 ? await prisma.profiles.findMany({ where: { id: { in: organisateurIds } }, select: { id: true, pseudo: true } }) : [];
  const pseudoOrganisateur = new Map(organisateurs.map((o) => [o.id, o.pseudo]));

  return lignes.map((l) => {
    const auteurPseudo = l.profiles.pseudo;
    const adversaire = l.matches.joueur1 === auteurPseudo ? l.matches.joueur2 : l.matches.joueur1;
    return {
      id: l.id,
      matchId: l.match_id,
      tournoiId: l.matches.tournoi_id,
      tournoiTitre: l.matches.tournois.titre,
      adversaire: adversaire ?? "l'adversaire",
      arbitre: pseudoOrganisateur.get(l.matches.tournois.organisateur_id) ?? "l'organisateur",
      motifId: l.motif,
      motifLabel: MOTIFS_LITIGE[l.motif] ?? l.motif,
      description: l.description,
      preuves: l.preuves,
      statut: l.statut,
      horodatage: l.created_at.getTime(),
    };
  });
}

const INCLUDE_RELATIONS = { matches: { include: { tournois: true } }, profiles: true } as const;

/** Un seul litige par match dans ce modèle. */
export async function litigeDuMatch(matchId: string): Promise<LitigeJSON | undefined> {
  const ligne = await prisma.litiges.findFirst({ where: { match_id: matchId }, include: INCLUDE_RELATIONS });
  return ligne ? (await versLitigesJSON([ligne]))[0] : undefined;
}

/** Autorisation de lecture d'un litige (Prisma contourne le RLS déjà en
 * place en base — recontrôlé explicitement ici) : les deux participants du
 * match concerné (auteur du litige et adversaire), ou l'organisateur du
 * tournoi/un adjoint accepté. */
export async function peutVoirLitigeDuMatch(matchId: string, profileId: string, pseudo: string): Promise<boolean> {
  const match = await prisma.matches.findUnique({ where: { id: matchId }, include: { tournois: true } });
  if (!match) return false;
  if (match.joueur1 === pseudo || match.joueur2 === pseudo) return true;
  return match.tournois.organisateur_id === profileId || (await estAdjointAccepteDe(match.tournois.organisateur_id, profileId));
}

/** Historique des litiges déposés par le compte connecté. */
export async function mesLitigesJSON(profileId: string): Promise<LitigeJSON[]> {
  const lignes = await prisma.litiges.findMany({ where: { auteur_id: profileId }, include: INCLUDE_RELATIONS, orderBy: { created_at: "desc" } });
  return versLitigesJSON(lignes);
}

/** Un joueur ne peut signaler un litige que sur un match où il a réellement
 * joué (jamais un match auquel il est étranger). */
async function estParticipantDuMatch(matchId: string, pseudo: string): Promise<boolean> {
  const match = await prisma.matches.findUnique({ where: { id: matchId }, select: { joueur1: true, joueur2: true } });
  return Boolean(match) && (match!.joueur1 === pseudo || match!.joueur2 === pseudo);
}

export type SoumissionLitige = { matchId: string; motifId: string; description: string; preuves: string[] };

export async function creerLitige(profileId: string, pseudo: string, s: SoumissionLitige): Promise<{ ok: true; data: LitigeJSON } | { ok: false; erreur: string }> {
  if (!(s.motifId in MOTIFS_LITIGE)) return { ok: false, erreur: "Motif invalide." };
  if (!(await estParticipantDuMatch(s.matchId, pseudo))) return { ok: false, erreur: "Tu n'as pas participé à ce match." };

  const existant = await prisma.litiges.findFirst({ where: { match_id: s.matchId } });
  if (existant) {
    const json = await litigeDuMatch(s.matchId);
    return json ? { ok: true, data: json } : { ok: false, erreur: "Litige déjà déposé." };
  }

  const ligne = await prisma.litiges.create({
    data: { match_id: s.matchId, auteur_id: profileId, motif: s.motifId, description: s.description, preuves: s.preuves, statut: "en_attente" },
    include: INCLUDE_RELATIONS,
  });
  return { ok: true, data: (await versLitigesJSON([ligne]))[0] };
}

export async function ajouterPreuveLitige(litigeId: string, profileId: string, nomFichier: string): Promise<LitigeJSON | undefined> {
  const existant = await prisma.litiges.findUnique({ where: { id: litigeId } });
  if (!existant || existant.auteur_id !== profileId) return undefined;
  const ligne = await prisma.litiges.update({ where: { id: litigeId }, data: { preuves: { push: nomFichier } }, include: INCLUDE_RELATIONS });
  return (await versLitigesJSON([ligne]))[0];
}

/** Seul l'organisateur du tournoi (ou un adjoint accepté) peut trancher. */
export async function resoudreLitige(litigeId: string, profileId: string, statut: "resolu_faveur" | "rejete"): Promise<LitigeJSON | undefined> {
  const existant = await prisma.litiges.findUnique({ where: { id: litigeId }, include: { matches: { include: { tournois: true } } } });
  if (!existant) return undefined;
  const organisateurId = existant.matches.tournois.organisateur_id;
  const autorise = organisateurId === profileId || (await estAdjointAccepteDe(organisateurId, profileId));
  if (!autorise) return undefined;

  const ligne = await prisma.litiges.update({ where: { id: litigeId }, data: { statut }, include: INCLUDE_RELATIONS });
  return (await versLitigesJSON([ligne]))[0];
}

/** Litiges en attente d'un tournoi précis — jauge de clôture organisateur
 * (cf. cloture/page.tsx). */
export async function nbLitigesOuvertsPourTournoi(tournoiId: string): Promise<number> {
  return prisma.litiges.count({ where: { statut: "en_attente", matches: { tournoi_id: tournoiId } } });
}

/** Supervision admin (/tourney-control) : tous les litiges en attente,
 * toutes plateformes confondues. */
export async function litigesEnAttenteJSON(): Promise<LitigeJSON[]> {
  const lignes = await prisma.litiges.findMany({ where: { statut: "en_attente" }, include: INCLUDE_RELATIONS, orderBy: { created_at: "asc" } });
  return versLitigesJSON(lignes);
}
