import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { peutCreerTournoiPayant } from "@/lib/server/moderation";

/** Statut de modération du compte connecté — jamais celui d'un autre
 * organisateur (pas d'ID en paramètre) : c'est un contrôle qui gate ses
 * propres actions, pas une donnée publique de réputation. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const peutCreerPayant = await peutCreerTournoiPayant(user.id);
  const profil = await prisma.organisateur_profils.findUnique({ where: { profile_id: user.id } });
  const statut = profil?.statut_moderation ?? "actif";

  return NextResponse.json({ success: true, data: { statut, peutCreerPayant } });
}
