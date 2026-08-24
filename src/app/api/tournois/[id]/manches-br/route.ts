import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";
import { versMancheBRJSON } from "@/lib/server/battleRoyale";
import { essaierClotureAutomatique } from "@/lib/server/cloture";

class ManchesCompletesError extends Error {}

/** Public : manches déjà closes + aperçu en direct (point 205) de la manche
 * en cours de saisie, visible des spectateurs sans attendre la clôture. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Clôture automatique (point 218) : vérifiée à chaque lecture des manches
  // plutôt que via une tâche planifiée, cf. essaierClotureAutomatique.
  await essaierClotureAutomatique(id);
  const [manches, brouillon] = await Promise.all([
    prisma.manches_br.findMany({ where: { tournoi_id: id }, include: { manches_br_resultats: true }, orderBy: { numero: "asc" } }),
    prisma.manche_br_en_cours.findUnique({ where: { tournoi_id: id } }),
  ]);
  const enCours = (brouillon?.resultats as unknown as { participantId: string; placement: number; eliminations: number }[]) ?? [];
  return NextResponse.json({ success: true, data: { manches: manches.map(versMancheBRJSON), enCours } });
}

/** Clôture la manche en cours (organisateur ou adjoint accepté) : fige les
 * résultats définitivement et efface le brouillon (point 203, irréversible). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const resultats: { participantId: string; placement: number; eliminations: number }[] = Array.isArray(body?.resultats)
    ? body.resultats.filter(
        (r: unknown): r is { participantId: string; placement: number; eliminations: number } =>
          typeof r === "object" && r !== null && typeof (r as { participantId?: unknown }).participantId === "string",
      )
    : [];
  if (resultats.length === 0) {
    return NextResponse.json({ success: false, error: "Aucun résultat à enregistrer." }, { status: 400 });
  }

  try {
    const manche = await prisma.$transaction(async (tx) => {
      // Verrou sur la ligne du tournoi le temps de la transaction : sans lui,
      // deux clôtures de manche quasi simultanées peuvent toutes les deux lire
      // le même compte avant que l'une des deux n'ait inséré la sienne, et
      // dépasser manches_prevues de plus d'une manche — même classe de course
      // que l'inscription/le financement de cash prize déjà corrigés ce soir.
      await tx.$queryRaw`SELECT manches_prevues FROM tournois WHERE id = ${id}::uuid FOR UPDATE`;
      const agrege = await tx.manches_br.aggregate({ where: { tournoi_id: id }, _max: { numero: true } });
      const numero = (agrege._max.numero ?? 0) + 1;
      // Bug rapporté : rien n'empêchait d'ajouter des manches indéfiniment
      // au-delà du nombre prévu à la création (manches_prevues) — le
      // tournoi ne se clôturait donc jamais (essaierClotureAutomatique
      // n'observe que la dernière manche, dont l'horodatage recule à
      // chaque nouvel ajout, remettant le délai de 2 min à zéro à l'infini).
      const cible = tournoi.manches_prevues ?? 1;
      if (numero > cible) throw new ManchesCompletesError();
      const creee = await tx.manches_br.create({ data: { tournoi_id: id, numero } });
      await tx.manches_br_resultats.createMany({
        data: resultats.map((r) => ({
          manche_id: creee.id,
          participant: r.participantId,
          placement: Math.max(0, Math.round(r.placement)),
          eliminations: Math.max(0, Math.round(r.eliminations)),
        })),
      });
      await tx.manche_br_en_cours.deleteMany({ where: { tournoi_id: id } });
      return tx.manches_br.findUniqueOrThrow({ where: { id: creee.id }, include: { manches_br_resultats: true } });
    });
    return NextResponse.json({ success: true, data: versMancheBRJSON(manche) });
  } catch (err) {
    // Course : deux clôtures quasi simultanées sur le même numéro de manche —
    // on retombe simplement sur l'état actuel plutôt que d'échouer bruyamment.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const manches = await prisma.manches_br.findMany({ where: { tournoi_id: id }, include: { manches_br_resultats: true }, orderBy: { numero: "asc" } });
      return NextResponse.json({ success: true, data: manches.map(versMancheBRJSON).at(-1) });
    }
    if (err instanceof ManchesCompletesError) {
      return NextResponse.json(
        { success: false, error: `Les ${tournoi.manches_prevues ?? 1} manches prévues sont déjà toutes jouées.` },
        { status: 409 },
      );
    }
    throw err;
  }
}
