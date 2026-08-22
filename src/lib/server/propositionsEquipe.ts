import { prisma } from "@/lib/prisma";
import type { statut_invitation } from "@/generated/prisma/client";
import { pseudosDepuisIds } from "./identite";

export type PropositionEquipeJSON = {
  id: string;
  equipeProfilId: string;
  equipeNom: string;
  tournoiId: string;
  proposeur: string;
  chef: string;
  statut: statut_invitation;
  horodatage: number;
};

export async function proposerInscriptionEquipe(equipeId: string, tournoiId: string, proposeurId: string): Promise<PropositionEquipeJSON> {
  const existante = await prisma.propositions_equipe.findFirst({
    where: { equipe_id: equipeId, tournoi_id: tournoiId, statut: "en_attente" },
    include: { equipes_profil: true },
  });
  const ligne =
    existante ??
    (await prisma.propositions_equipe.create({
      data: { equipe_id: equipeId, tournoi_id: tournoiId, proposeur_id: proposeurId },
      include: { equipes_profil: true },
    }));
  const pseudos = await pseudosDepuisIds([proposeurId, ligne.equipes_profil.chef_id]);
  return {
    id: ligne.id,
    equipeProfilId: ligne.equipe_id,
    equipeNom: ligne.equipes_profil.nom,
    tournoiId: ligne.tournoi_id,
    proposeur: pseudos.get(proposeurId) ?? "?",
    chef: pseudos.get(ligne.equipes_profil.chef_id) ?? "?",
    statut: ligne.statut,
    horodatage: ligne.created_at.getTime(),
  };
}

export async function propositionsEnAttentePourEquipeJSON(equipeId: string): Promise<PropositionEquipeJSON[]> {
  const lignes = await prisma.propositions_equipe.findMany({
    where: { equipe_id: equipeId, statut: "en_attente" },
    include: { equipes_profil: true },
    orderBy: { created_at: "desc" },
  });
  const pseudos = await pseudosDepuisIds(lignes.flatMap((l) => [l.proposeur_id, l.equipes_profil.chef_id]));
  return lignes.map((l) => ({
    id: l.id,
    equipeProfilId: l.equipe_id,
    equipeNom: l.equipes_profil.nom,
    tournoiId: l.tournoi_id,
    proposeur: pseudos.get(l.proposeur_id) ?? "?",
    chef: pseudos.get(l.equipes_profil.chef_id) ?? "?",
    statut: l.statut,
    horodatage: l.created_at.getTime(),
  }));
}

export async function propositionParId(id: string) {
  return prisma.propositions_equipe.findUnique({ where: { id }, include: { equipes_profil: true } });
}

export async function traiterPropositionEquipe(id: string, statut: "acceptee" | "refusee"): Promise<void> {
  await prisma.propositions_equipe.updateMany({ where: { id }, data: { statut } });
}
