import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { profileIdDepuisNomOrganisateur } from "@/lib/server/adjoints";

/** Répond (accepte ou décline) une invitation reçue — adjoint toujours
 * dérivé de la session, jamais du corps de la requête. */
export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const proprietaire = typeof body?.proprietaire === "string" ? body.proprietaire.trim() : "";
  const accepter = Boolean(body?.accepter);
  if (!proprietaire) return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });

  const proprietaireId = await profileIdDepuisNomOrganisateur(proprietaire);
  if (!proprietaireId) return NextResponse.json({ success: false, error: "Organisateur introuvable." }, { status: 404 });

  if (accepter) {
    await prisma.adjoints_organisateur.updateMany({
      where: { proprietaire_id: proprietaireId, adjoint_id: user.id, statut: "en_attente" },
      data: { statut: "accepte" },
    });
  } else {
    await prisma.adjoints_organisateur.deleteMany({
      where: { proprietaire_id: proprietaireId, adjoint_id: user.id },
    });
  }
  return NextResponse.json({ success: true });
}
