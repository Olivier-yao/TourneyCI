import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Marge par défaut avant le début du tournoi quand "Fin des inscriptions"
 * n'est pas renseignée — miroir de MARGE_CLOTURE_PAR_DEFAUT_MS dans
 * mockTournaments.ts (dupliqué volontairement : ce fichier ne doit dépendre
 * d'aucun module client, cf. src/lib/mockAuth.ts et ses imports navigateur). */
const MARGE_CLOTURE_PAR_DEFAUT_MS = 12 * 60 * 1000;

class TournoiIntrouvableError extends Error {}
class InscriptionsFermeesError extends Error {}
class SoldeInsuffisantError extends Error {}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inscriptions = await prisma.inscriptions.findMany({
    where: { tournoi_id: id },
    include: { profiles: true },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json({
    success: true,
    data: inscriptions.map((i) => ({ tournoiId: i.tournoi_id, tag: i.tag ?? undefined, equipe: i.equipe_nom ?? undefined, pseudo: i.profiles.pseudo })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const tag = typeof body?.tag === "string" ? body.tag.trim() || undefined : undefined;
  const equipe = typeof body?.equipe === "string" ? body.equipe.trim() || undefined : undefined;
  // Montant réellement débité au paiement (cf. FluxPaiement.tsx) — peut
  // différer de tournoi.frais_xof quand le chef d'équipe paie pour tout le
  // squad. Enregistré ici pour permettre un remboursement exact en cas
  // d'annulation (cf. DELETE ci-dessous), plutôt que de deviner ce montant
  // a posteriori sur des frais unitaires qui ne correspondent pas toujours
  // à ce qui a été payé.
  const montant = typeof body?.montant === "number" && body.montant >= 0 ? Math.round(body.montant) : undefined;

  try {
    const inscription = await prisma.$transaction(async (tx) => {
      // Verrou sur la ligne du tournoi (SELECT ... FOR UPDATE) : sans lui,
      // deux inscriptions concurrentes pour la toute dernière place peuvent
      // toutes les deux lire "encore une place dispo" avant que l'une des
      // deux n'ait inséré la sienne, et sur-inscrire un tournoi complet
      // (paiement compris) — même classe de bug que la course déjà corrigée
      // sur la clôture automatique (cf. essaierClotureAutomatique), ici sur
      // l'inscription plutôt que la fermeture. La 2e requête concurrente
      // attend simplement que la 1re commit avant de relire un compte à jour.
      const lignes = await tx.$queryRaw<
        {
          places_total: number;
          en_direct: boolean;
          termine_le: Date | null;
          annule_le: Date | null;
          fin_inscriptions_le: Date | null;
          debut_tournoi_le: Date;
        }[]
      >`SELECT places_total, en_direct, termine_le, annule_le, fin_inscriptions_le, debut_tournoi_le
        FROM tournois WHERE id = ${id}::uuid FOR UPDATE`;
      const tournoi = lignes[0];
      if (!tournoi) throw new TournoiIntrouvableError();

      const count = await tx.inscriptions.count({ where: { tournoi_id: id } });
      const complet = tournoi.places_total > 0 && count >= tournoi.places_total;
      const clotureEffective = tournoi.fin_inscriptions_le ?? new Date(tournoi.debut_tournoi_le.getTime() - MARGE_CLOTURE_PAR_DEFAUT_MS);
      const fermees = tournoi.en_direct || !!tournoi.termine_le || !!tournoi.annule_le || complet || Date.now() >= clotureEffective.getTime();
      if (fermees) throw new InscriptionsFermeesError();

      // "montant" n'était jusqu'ici qu'une déclaration du client (cf.
      // FluxPaiement.tsx), jamais réellement débitée par cette route — un
      // appel direct à l'API pouvait se déclarer "payé" sans rien payer, et
      // en cas d'annulation du tournoi se faire créditer un vrai
      // remboursement (rembourserInscritsAnnulation) sur ce montant fictif.
      // Débit atomique dans la même transaction que l'inscription : soit les
      // deux réussissent ensemble, soit aucune des deux n'a lieu. Même
      // verrou (FOR UPDATE sur la ligne du profil) que le financement de
      // cash prize ci-dessus, pour la même raison de concurrence.
      if (montant !== undefined && montant > 0) {
        await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${user.id}::uuid FOR UPDATE`;
        const soldeAgg = await tx.mouvements.aggregate({ where: { profile_id: user.id }, _sum: { montant_xof: true } });
        const soldeActuel = soldeAgg._sum.montant_xof ?? 0;
        if (soldeActuel < montant) throw new SoldeInsuffisantError();
        await tx.mouvements.create({
          data: { profile_id: user.id, type: "inscription", libelle: `Inscription · ${tag ?? equipe ?? "tournoi"}`, montant_xof: -montant, tournoi_id: id },
        });
      }

      return tx.inscriptions.create({
        data: {
          tournoi_id: id,
          profile_id: user.id,
          tag,
          equipe_nom: equipe,
          montant_paye_xof: montant,
          paye_le: montant !== undefined ? new Date() : undefined,
        },
      });
    });
    return NextResponse.json({ success: true, data: { tournoiId: inscription.tournoi_id, tag: inscription.tag ?? undefined, equipe: inscription.equipe_nom ?? undefined } });
  } catch (err) {
    if (err instanceof TournoiIntrouvableError) {
      return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
    }
    if (err instanceof InscriptionsFermeesError) {
      return NextResponse.json({ success: false, error: "Les inscriptions sont closes pour ce tournoi." }, { status: 409 });
    }
    if (err instanceof SoldeInsuffisantError) {
      return NextResponse.json({ success: false, error: "Solde insuffisant pour ce paiement." }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ success: false, error: "Déjà inscrit à ce tournoi." }, { status: 409 });
    }
    throw err;
  }
}

/** Renomme l'équipe de MON inscription (capitaine uniquement, avant le début
 * du tournoi — cf. renommerEquipe dans mockInscriptions.ts). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const equipe = typeof body?.equipe === "string" ? body.equipe.trim() : "";
  if (!equipe) {
    return NextResponse.json({ success: false, error: "Nom d'équipe invalide." }, { status: 400 });
  }

  const inscription = await prisma.inscriptions.findUnique({ where: { tournoi_id_profile_id: { tournoi_id: id, profile_id: user.id } } });
  if (!inscription) {
    return NextResponse.json({ success: false, error: "Inscription introuvable." }, { status: 404 });
  }

  const maj = await prisma.inscriptions.update({ where: { id: inscription.id }, data: { equipe_nom: equipe } });
  return NextResponse.json({ success: true, data: { tournoiId: maj.tournoi_id, tag: maj.tag ?? undefined, equipe: maj.equipe_nom ?? undefined } });
}
