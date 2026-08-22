import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

/** Aperçu provisoire de la manche en cours de saisie (point 205) : poussé par
 * "Valider", visible immédiatement des spectateurs sans clôturer la manche —
 * une seule ligne par tournoi, entièrement remplacée à chaque appel. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  const autorise = tournoi.organisateur_id === user.id || (await estAdjointAccepteDe(tournoi.organisateur_id, user.id));
  if (!autorise) {
    return NextResponse.json({ success: false, error: "Réservé à l'organisateur ou à ses adjoints." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const resultats = Array.isArray(body?.resultats) ? body.resultats : [];

  await prisma.manche_br_en_cours.upsert({
    where: { tournoi_id: id },
    create: { tournoi_id: id, resultats },
    update: { resultats, mis_a_jour_le: new Date() },
  });
  return NextResponse.json({ success: true });
}
