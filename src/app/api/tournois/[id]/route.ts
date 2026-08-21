import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie, versTournoiJSON, INCLUDE_TOURNOI_DETAIL } from "@/lib/server/tournois";

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** L'écran de détail accède aussi bien par id (navigation interne) que par
 * code court à 6 caractères (recherche/partage, cf. tournoiParCode). */
async function trouverTournoi(id: string) {
  if (REGEX_UUID.test(id)) {
    return prisma.tournois.findUnique({ where: { id }, include: INCLUDE_TOURNOI_DETAIL });
  }
  return prisma.tournois.findUnique({ where: { code: id.toUpperCase() }, include: INCLUDE_TOURNOI_DETAIL });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournoi = await trouverTournoi(id);
  if (!tournoi) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: versTournoiJSON(tournoi) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });
  }

  const existant = await prisma.tournois.findUnique({ where: { id } });
  if (!existant || existant.organisateur_id !== user.id) {
    return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });
  }

  let villeId: number | undefined;
  if (typeof body.ville === "string" && body.ville.trim()) {
    const villeRow = await prisma.villes.findFirst({ where: { nom: body.ville.trim() } });
    if (!villeRow) {
      return NextResponse.json({ success: false, error: "Ville inconnue." }, { status: 400 });
    }
    villeId = villeRow.id;
  }

  const tournoi = await prisma.tournois.update({
    where: { id },
    data: {
      ...(typeof body.titre === "string" ? { titre: body.titre.trim() } : {}),
      ...(villeId !== undefined ? { ville_id: villeId } : {}),
      ...(body.checkinTs ? { checkin_le: new Date(Number(body.checkinTs)) } : {}),
      ...(typeof body.reglement === "string" ? { reglement: body.reglement.trim() } : {}),
      ...(typeof body.informations === "string" ? { informations: body.informations.trim() || null } : {}),
      ...(typeof body.streamActif === "boolean" ? { stream_actif: body.streamActif } : {}),
      ...(typeof body.symboleId === "string" ? { symbole_id: body.symboleId } : {}),
    },
    include: { jeux: true, villes: true, profiles: true, _count: { select: { inscriptions: true } } },
  });

  return NextResponse.json({ success: true, data: versTournoiJSON(tournoi) });
}
