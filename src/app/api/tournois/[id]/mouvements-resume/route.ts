import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

/** Résumé financier d'un tournoi pour l'écran Régie de l'organisateur (cash
 * prize réellement versé, total réellement remboursé) — agrégé directement
 * depuis les vrais mouvements wallet (`gain`/`remboursement` liés à ce
 * tournoi), jamais depuis une valeur mise en cache côté client qui ne
 * survivrait pas à un rechargement de page. Réservé à l'organisateur ou un
 * de ses adjoints acceptés (donnée financière). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  const autorise = tournoi.organisateur_id === user.id || (await estAdjointAccepteDe(tournoi.organisateur_id, user.id));
  if (!autorise) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  const mouvements = await prisma.mouvements.findMany({
    where: { tournoi_id: id, type: { in: ["gain", "remboursement"] } },
    select: { type: true, montant_xof: true },
  });

  const gains = mouvements.filter((m) => m.type === "gain");
  const remboursements = mouvements.filter((m) => m.type === "remboursement");

  return NextResponse.json({
    success: true,
    data: {
      gainsXof: gains.reduce((s, m) => s + m.montant_xof, 0),
      gainsCount: gains.length,
      remboursementsXof: remboursements.reduce((s, m) => s + m.montant_xof, 0),
      remboursementsCount: remboursements.length,
    },
  });
}
