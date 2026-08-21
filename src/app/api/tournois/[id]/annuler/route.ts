import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Ne fait QUE persister annule_le. Le remboursement (mockWallet), les
 * notifications et le reste de la logique métier restent gérés côté client
 * juste après, exactement comme aujourd'hui (cf. annulerTournoi dans
 * mockTournaments.ts) — cette route ne fait que remplacer l'ancien flag
 * localStorage par une vraie colonne. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const existant = await prisma.tournois.findUnique({ where: { id } });
  if (!existant || existant.organisateur_id !== user.id) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }

  await prisma.tournois.update({ where: { id }, data: { annule_le: existant.annule_le ?? new Date() } });
  return NextResponse.json({ success: true });
}
