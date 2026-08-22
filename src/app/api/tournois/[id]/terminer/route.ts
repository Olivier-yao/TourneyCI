import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

/** Ne fait QUE persister termine_le. Le calcul du classement final, les
 * points, le cash prize (séquestre), la commission et les notifications
 * restent gérés côté client juste après (cf. terminerTournoi dans
 * mockTournaments.ts), inchangés — cette route remplace seulement l'ancien
 * flag localStorage par une vraie colonne. Organisateur ou l'un de ses
 * adjoints acceptés (gestion en direct, cf. cloture/page.tsx). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const existant = await prisma.tournois.findUnique({ where: { id } });
  if (!existant) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }
  const autorise = existant.organisateur_id === user.id || (await estAdjointAccepteDe(existant.organisateur_id, user.id));
  if (!autorise) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }

  await prisma.tournois.update({ where: { id }, data: { termine_le: existant.termine_le ?? new Date() } });
  return NextResponse.json({ success: true });
}
