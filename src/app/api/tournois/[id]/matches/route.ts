import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { versMatchesJSON } from "@/lib/server/matches";
import { essaierClotureAutomatique } from "@/lib/server/cloture";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Clôture automatique (point 218) : vérifiée à chaque lecture des matchs
  // plutôt que via une tâche planifiée, cf. essaierClotureAutomatique.
  await essaierClotureAutomatique(id);
  const matches = await prisma.matches.findMany({ where: { tournoi_id: id }, orderBy: [{ round: "asc" }, { position: "asc" }] });
  return NextResponse.json({ success: true, data: await versMatchesJSON(matches) });
}

/** Génère l'arbre complet à partir de la liste ordonnée des participants
 * (seeding, byes si l'effectif n'est pas une puissance de 2) — même
 * algorithme que l'ancien genererBracket() du mock. Idempotent : si des
 * matchs existent déjà pour ce tournoi, les renvoie tels quels sans rien
 * recréer (pas de restriction organisateur, comme aujourd'hui : le premier
 * visiteur de la page bracket dont les conditions sont réunies déclenche
 * la génération). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const participants: string[] = Array.isArray(body?.participants)
    ? body.participants.filter((n: unknown): n is string => typeof n === "string" && n.trim().length > 0)
    : [];

  const existants = await prisma.matches.findMany({ where: { tournoi_id: id }, orderBy: [{ round: "asc" }, { position: "asc" }] });
  if (existants.length > 0) {
    return NextResponse.json({ success: true, data: await versMatchesJSON(existants) });
  }

  if (participants.length < 2) {
    return NextResponse.json({ success: false, error: "Pas assez de participants." }, { status: 400 });
  }

  let taille = 2;
  while (taille < participants.length) taille *= 2;
  const grille: (string | null)[] = [...participants, ...Array(taille - participants.length).fill(null)];
  const totalRounds = Math.log2(taille);

  const donnees: Prisma.matchesCreateManyInput[] = [];
  for (let i = 0; i < taille / 2; i++) {
    donnees.push({ tournoi_id: id, round: 1, position: i, joueur1: grille[i * 2], joueur2: grille[i * 2 + 1] });
  }
  for (let round = 2; round <= totalRounds; round++) {
    const nbMatchs = taille / 2 ** round;
    for (let i = 0; i < nbMatchs; i++) {
      donnees.push({ tournoi_id: id, round, position: i, joueur1: null, joueur2: null });
    }
  }

  try {
    await prisma.matches.createMany({ data: donnees });
  } catch (err) {
    // Course : un autre visiteur vient de générer en même temps — on
    // retombe simplement sur la lecture ci-dessous.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
  }

  const matches = await prisma.matches.findMany({ where: { tournoi_id: id }, orderBy: [{ round: "asc" }, { position: "asc" }] });
  return NextResponse.json({ success: true, data: await versMatchesJSON(matches) });
}
