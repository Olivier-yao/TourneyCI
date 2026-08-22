import { prisma } from "@/lib/prisma";

/** Check-in (validation de présence) des inscrits, juste avant le début du
 * tournoi — utilise inscriptions.present_le (colonne déjà présente en base,
 * jamais utilisée avant). Un inscrit est identifié par le même "nom" que
 * partout ailleurs dans l'app : le nom d'équipe si renseigné, sinon son
 * pseudo (cf. versTournoiJSON -> inscrits). */
export async function presentsDuTournoi(tournoiId: string): Promise<string[]> {
  const inscriptions = await prisma.inscriptions.findMany({
    where: { tournoi_id: tournoiId, present_le: { not: null } },
    include: { profiles: true },
  });
  return inscriptions.map((i) => i.equipe_nom ?? i.profiles.pseudo);
}

/** Résout un "nom" affiché (équipe ou pseudo) vers son inscription pour ce
 * tournoi. */
export async function inscriptionParNom(tournoiId: string, nom: string) {
  return prisma.inscriptions.findFirst({
    where: { tournoi_id: tournoiId, OR: [{ equipe_nom: nom }, { profiles: { pseudo: nom } }] },
    include: { profiles: true },
  });
}

export async function definirPresence(inscriptionId: string, present: boolean): Promise<void> {
  await prisma.inscriptions.update({ where: { id: inscriptionId }, data: { present_le: present ? new Date() : null } });
}
