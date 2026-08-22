import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versMatchJSON } from "@/lib/server/matches";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.matches.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });
  return NextResponse.json({ success: true, data: versMatchJSON(match) });
}

function interdit() {
  return NextResponse.json({ success: false, error: "Action réservée à l'organisateur ou aux joueurs de ce match." }, { status: 403 });
}

/** demarrer / score_direct : organisateur du tournoi ou l'un de ses
 * adjoints acceptés (mêmes écrans qu'aujourd'hui, GestionMatches.tsx).
 * score_final : organisateur, adjoint, OU l'un des deux joueurs du match
 * (comparaison de pseudo, insensible à la casse — même limitation de
 * conception que le mock actuel pour les noms d'équipe partagés, pas une
 * régression introduite ici). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  const match = await prisma.matches.findUnique({ where: { id }, include: { tournois: true } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

  const estOrganisateur =
    match.tournois.organisateur_id === user.id || (await estAdjointAccepteDe(match.tournois.organisateur_id, user.id));

  if (action === "demarrer") {
    if (!estOrganisateur) return interdit();
    if (!match.joueur1 || !match.joueur2 || match.statut !== "a_venir") {
      return NextResponse.json({ success: false, error: "Ce match ne peut pas démarrer." }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.matches.updateMany({ where: { tournoi_id: match.tournoi_id, statut: "en_cours" }, data: { statut: "a_venir" } }),
      prisma.matches.update({ where: { id }, data: { statut: "en_cours" } }),
    ]);
    const maj = await prisma.matches.findUnique({ where: { id } });
    return NextResponse.json({ success: true, data: versMatchJSON(maj!) });
  }

  if (action === "score_direct") {
    if (!estOrganisateur) return interdit();
    if (match.statut !== "en_cours") {
      return NextResponse.json({ success: false, error: "Le match n'est pas en cours." }, { status: 400 });
    }
    const score1 = Number(body.score1);
    const score2 = Number(body.score2);
    if (!Number.isFinite(score1) || !Number.isFinite(score2)) {
      return NextResponse.json({ success: false, error: "Score invalide." }, { status: 400 });
    }
    const maj = await prisma.matches.update({ where: { id }, data: { score1, score2 } });
    return NextResponse.json({ success: true, data: versMatchJSON(maj) });
  }

  if (action === "score_final") {
    const profil = await prisma.profiles.findUnique({ where: { id: user.id } });
    const monNom = profil?.pseudo.trim().toLowerCase();
    const estJoueur = Boolean(monNom) && [match.joueur1, match.joueur2].some((n) => n?.trim().toLowerCase() === monNom);
    if (!estOrganisateur && !estJoueur) return interdit();

    const score1 = Number(body.score1);
    const score2 = Number(body.score2);
    if (!Number.isFinite(score1) || !Number.isFinite(score2) || score1 === score2) {
      return NextResponse.json({ success: false, error: "Score invalide." }, { status: 400 });
    }

    const gagnant = score1 > score2 ? match.joueur1 : match.joueur2;

    await prisma.$transaction(async (tx) => {
      await tx.matches.update({ where: { id }, data: { score1, score2, statut: "termine" } });
      const agrege = await tx.matches.aggregate({ where: { tournoi_id: match.tournoi_id }, _max: { round: true } });
      const totalRounds = agrege._max.round ?? match.round;
      if (match.round < totalRounds) {
        const positionCible = Math.floor(match.position / 2);
        const cible = await tx.matches.findUnique({
          where: { tournoi_id_round_position: { tournoi_id: match.tournoi_id, round: match.round + 1, position: positionCible } },
        });
        if (cible) {
          await tx.matches.update({
            where: { id: cible.id },
            data: match.position % 2 === 0 ? { joueur1: gagnant } : { joueur2: gagnant },
          });
        }
      }
    });

    const maj = await prisma.matches.findUnique({ where: { id } });
    return NextResponse.json({ success: true, data: versMatchJSON(maj!) });
  }

  return NextResponse.json({ success: false, error: "Action inconnue." }, { status: 400 });
}
