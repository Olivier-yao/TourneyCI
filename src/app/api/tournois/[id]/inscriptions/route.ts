import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";

/** Marge par défaut avant le début du tournoi quand "Fin des inscriptions"
 * n'est pas renseignée — miroir de MARGE_CLOTURE_PAR_DEFAUT_MS dans
 * mockTournaments.ts (dupliqué volontairement : ce fichier ne doit dépendre
 * d'aucun module client, cf. src/lib/mockAuth.ts et ses imports navigateur). */
const MARGE_CLOTURE_PAR_DEFAUT_MS = 12 * 60 * 1000;

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

  const tournoi = await prisma.tournois.findUnique({ where: { id }, include: { _count: { select: { inscriptions: true } } } });
  if (!tournoi) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }

  const complet = tournoi.places_total > 0 && tournoi._count.inscriptions >= tournoi.places_total;
  const clotureEffective = tournoi.fin_inscriptions_le ?? new Date(tournoi.debut_tournoi_le.getTime() - MARGE_CLOTURE_PAR_DEFAUT_MS);
  const fermees = tournoi.en_direct || !!tournoi.termine_le || !!tournoi.annule_le || complet || Date.now() >= clotureEffective.getTime();
  if (fermees) {
    return NextResponse.json({ success: false, error: "Les inscriptions sont closes pour ce tournoi." }, { status: 409 });
  }

  try {
    const inscription = await prisma.inscriptions.create({
      data: {
        tournoi_id: id,
        profile_id: user.id,
        tag,
        equipe_nom: equipe,
        montant_paye_xof: montant,
        paye_le: montant !== undefined ? new Date() : undefined,
      },
    });
    return NextResponse.json({ success: true, data: { tournoiId: inscription.tournoi_id, tag: inscription.tag ?? undefined, equipe: inscription.equipe_nom ?? undefined } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ success: false, error: "Déjà inscrit à ce tournoi." }, { status: 409 });
    }
    throw err;
  }
}

/** Annule MA propre inscription (le participant, pas l'organisateur) — point
 * demandé explicitement réservé à avant l'ouverture du check-in (au-delà,
 * l'organisateur a déjà commencé à préparer le bracket sur cette base :
 * cf. MaFicheInscrit.tsx, qui ne montre ce bouton que dans cet état). Rembourse
 * le montant réellement payé à l'inscription (montant_paye_xof) — ou, pour une
 * inscription antérieure à l'ajout de ce champ, les frais unitaires actuels du
 * tournoi en repli, seule approximation disponible dans ce cas. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }
  if (tournoi.en_direct || tournoi.termine_le || tournoi.annule_le || Date.now() >= tournoi.checkin_le.getTime()) {
    return NextResponse.json({ success: false, error: "Le check-in a déjà ouvert, il n'est plus possible d'annuler ton inscription." }, { status: 409 });
  }

  const inscription = await prisma.inscriptions.findUnique({ where: { tournoi_id_profile_id: { tournoi_id: id, profile_id: user.id } } });
  if (!inscription) {
    return NextResponse.json({ success: false, error: "Inscription introuvable." }, { status: 404 });
  }

  await prisma.inscriptions.delete({ where: { id: inscription.id } });
  const remboursementXof = inscription.montant_paye_xof ?? tournoi.frais_xof;
  return NextResponse.json({ success: true, data: { remboursementXof } });
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
