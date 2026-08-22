import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { profileIdDepuisNomOrganisateur } from "@/lib/server/adjoints";

/** Supprime la relation avec "nom", quel que soit le sens (moi propriétaire
 * qui retire son adjoint, ou moi adjoint qui quitte une relation déjà
 * acceptée) — même opération que le mock (retirerAdjoint), unifiée ici en
 * une seule route. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  const { nom } = await params;

  const autreId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!autreId) return NextResponse.json({ success: true });

  await prisma.adjoints_organisateur.deleteMany({
    where: {
      OR: [
        { proprietaire_id: user.id, adjoint_id: autreId },
        { proprietaire_id: autreId, adjoint_id: user.id },
      ],
    },
  });
  return NextResponse.json({ success: true });
}
