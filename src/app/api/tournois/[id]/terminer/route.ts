import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";
import { verserCashPrizeCloture } from "@/lib/server/cloture";

/** Persiste termine_le ET verse le cash prize au(x) vrai(s) gagnant(s), la
 * commission organisateur, et les points de classement/matchs joués/
 * victoires — cf. verserCashPrizeCloture, qui recalcule le classement côté
 * serveur et crédite/incrémente directement les bons comptes, plutôt que
 * l'ancien système client (terminerTournoi dans mockTournaments.ts) qui ne
 * créditait jamais que l'appareil ayant déclenché la clôture et gardait les
 * points en localStorage. Le versement ne s'exécute qu'à la toute première
 * clôture (idempotent : un second appel — retry réseau, double clic — ne
 * recrédite jamais). Les notifications restent gérées côté client juste
 * après. Organisateur ou l'un de ses adjoints acceptés (gestion en direct,
 * cf. cloture/page.tsx). */
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

  // Réclame atomiquement le droit de clôturer (WHERE termine_le IS NULL) :
  // si deux requêtes arrivent en même temps (ex. organisateur + adjoint sur
  // la page de clôture au même instant), une seule gagne la course et verse
  // le cash prize — l'autre voit updatedCount = 0 et ne verse rien.
  const premiereCloture = await prisma.tournois.updateMany({
    where: { id, termine_le: null },
    data: { termine_le: new Date() },
  });
  const resultat = premiereCloture.count > 0 ? await verserCashPrizeCloture(id) : { gagnantsCredites: [], cashPrizeTotalXof: 0 };
  return NextResponse.json({ success: true, data: resultat });
}
