import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/** "Soutenir l'organisateur" (point 64) — signal distinct du système
 * d'avis cœur/cœur brisé, un seul soutien par compte et par organisateur
 * (contrainte unique en base). Idempotent comme les avis : un second envoi
 * ne fait pas échouer l'action, renvoie simplement le soutien déjà posé. */
export async function monSoutien(auteurId: string, organisateurId: string) {
  return prisma.soutiens_organisateur.findUnique({
    where: { auteur_id_organisateur_id: { auteur_id: auteurId, organisateur_id: organisateurId } },
  });
}

export async function creerSoutien(auteurId: string, organisateurId: string, tournoiId?: string) {
  const existant = await monSoutien(auteurId, organisateurId);
  if (existant) return existant;
  try {
    return await prisma.soutiens_organisateur.create({
      data: { auteur_id: auteurId, organisateur_id: organisateurId, tournoi_id: tournoiId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return (await monSoutien(auteurId, organisateurId))!;
    }
    throw err;
  }
}
