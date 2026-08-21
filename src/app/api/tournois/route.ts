import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  utilisateurConnecte,
  nonAuthentifie,
  versTournoiJSON,
  versTypeCompetition,
  synchroniserNomOrganisateur,
  INCLUDE_TOURNOI_LISTE,
} from "@/lib/server/tournois";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organisateurMoi = searchParams.get("organisateur") === "me";
  const enDirect = searchParams.get("enDirect") === "1";

  let organisateurId: string | undefined;
  if (organisateurMoi) {
    const user = await utilisateurConnecte();
    if (!user) return nonAuthentifie();
    organisateurId = user.id;
  }

  const tournois = await prisma.tournois.findMany({
    where: {
      ...(organisateurId ? { organisateur_id: organisateurId } : {}),
      // Même définition qu'estEnDirect() (calculée à la lecture) : en_direct
      // stocké à true, OU l'heure de début est passée sans que le tournoi
      // soit terminé/annulé.
      ...(enDirect
        ? { OR: [{ en_direct: true }, { termine_le: null, annule_le: null, debut_tournoi_le: { lte: new Date() } }] }
        : {}),
    },
    include: INCLUDE_TOURNOI_LISTE,
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ success: true, data: tournois.map(versTournoiJSON) });
}

export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });
  }

  const titre = typeof body.titre === "string" ? body.titre.trim() : "";
  const jeuId = typeof body.jeuId === "string" ? body.jeuId : "";
  const type = body.type as "1v1" | "equipes" | "battle_royale";
  const modalite = body.modalite as "virtuel" | "presentiel";
  const placesTotal = Number(body.placesTotal);
  const debutTournoiTs = Number(body.debutTournoiTs);
  const checkinTs = Number(body.checkinTs);
  const reglement = typeof body.reglement === "string" ? body.reglement.trim() : "";

  if (!titre || !jeuId || !type || !modalite || !placesTotal || !debutTournoiTs || !checkinTs || !reglement) {
    return NextResponse.json({ success: false, error: "Champs obligatoires manquants." }, { status: 400 });
  }

  const jeu = await prisma.jeux.findUnique({ where: { id: jeuId } });
  if (!jeu) {
    return NextResponse.json({ success: false, error: "Jeu inconnu." }, { status: 400 });
  }

  let villeId: number | undefined;
  if (modalite === "presentiel") {
    const villeNom = typeof body.ville === "string" ? body.ville.trim() : "";
    if (!villeNom) {
      return NextResponse.json({ success: false, error: "Ville obligatoire pour un tournoi présentiel." }, { status: 400 });
    }
    const villeRow = await prisma.villes.findFirst({ where: { nom: villeNom } });
    if (!villeRow) {
      return NextResponse.json({ success: false, error: "Ville inconnue." }, { status: 400 });
    }
    villeId = villeRow.id;
  }

  const organisateurNom = typeof body.organisateurNom === "string" ? body.organisateurNom : "";
  if (organisateurNom) await synchroniserNomOrganisateur(user.id, organisateurNom);

  const tournoi = await prisma.tournois.create({
    data: {
      jeu_id: jeuId,
      organisateur_id: user.id,
      titre,
      type: versTypeCompetition(type),
      modalite,
      br_sous_type: body.brSousType ?? undefined,
      equipe_sous_type: body.equipeSousType ?? undefined,
      mode_equipe: body.modeEquipe ?? undefined,
      ville_id: villeId,
      frais_xof: Number(body.fraisXof) || 0,
      financement_cash_prize: body.financementCashPrize === "organisateur" ? "organisateur" : "inscriptions",
      cash_prize_engage_xof: Number(body.cashPrizeXof) || 0,
      commission_activee: Boolean(body.commissionActivee),
      places_total: Math.max(1, Math.round(placesTotal)),
      debut_inscriptions_le: body.debutInscriptionsTs ? new Date(Number(body.debutInscriptionsTs)) : undefined,
      fin_inscriptions_le: body.finInscriptionsTs ? new Date(Number(body.finInscriptionsTs)) : undefined,
      debut_tournoi_le: new Date(debutTournoiTs),
      checkin_le: new Date(checkinTs),
      reglement,
      informations: typeof body.informations === "string" ? body.informations.trim() || undefined : undefined,
      banniere_url: typeof body.banniereUrl === "string" ? body.banniereUrl : undefined,
      symbole_id: typeof body.symboleId === "string" ? body.symboleId : undefined,
    },
    include: INCLUDE_TOURNOI_LISTE,
  });

  return NextResponse.json({ success: true, data: versTournoiJSON(tournoi) });
}
