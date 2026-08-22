import { prisma } from "@/lib/prisma";

/** Suivi d'un organisateur (bouton "Suivre" du profil, design v3 · B4) —
 * table de jointure simple (follower_id, organisateur_id), pas de compteur
 * stocké : toujours dérivé à la lecture, comme le reste de l'app. */
export async function suisOrganisateur(followerId: string | undefined, organisateurId: string): Promise<boolean> {
  if (!followerId) return false;
  const ligne = await prisma.suivis_organisateur.findUnique({
    where: { follower_id_organisateur_id: { follower_id: followerId, organisateur_id: organisateurId } },
  });
  return Boolean(ligne);
}

/** Bascule et renvoie le nouvel état (suivi ou plus). */
export async function basculerSuivi(followerId: string, organisateurId: string): Promise<boolean> {
  const cle = { follower_id_organisateur_id: { follower_id: followerId, organisateur_id: organisateurId } };
  const existant = await prisma.suivis_organisateur.findUnique({ where: cle });
  if (existant) {
    await prisma.suivis_organisateur.delete({ where: cle });
    return false;
  }
  await prisma.suivis_organisateur.create({ data: { follower_id: followerId, organisateur_id: organisateurId } });
  return true;
}

export async function compteFollowers(organisateurId: string): Promise<number> {
  return prisma.suivis_organisateur.count({ where: { organisateur_id: organisateurId } });
}

/** Pseudos des comptes qui suivent cet organisateur, pour la modale de
 * détail — plus de liste de démo générée : un profil tout juste migré aura
 * simplement 0 follower réel, ce qui est honnête plutôt que de continuer à
 * afficher des noms fictifs. */
export async function listeFollowers(organisateurId: string): Promise<string[]> {
  const lignes = await prisma.suivis_organisateur.findMany({
    where: { organisateur_id: organisateurId },
    include: { profiles_suivis_organisateur_follower_idToprofiles: true },
    orderBy: { follower_id: "asc" },
  });
  return lignes.map((l) => l.profiles_suivis_organisateur_follower_idToprofiles.pseudo);
}
