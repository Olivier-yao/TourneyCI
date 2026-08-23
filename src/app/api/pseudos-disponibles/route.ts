import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Disponibilité de pseudo en temps réel (saisie du profil) — remplace
 * l'ancienne vérification contre CLASSEMENTS (données de démo statiques,
 * jamais les vrais comptes). L'unicité définitive reste imposée par la
 * contrainte Postgres sur profiles.pseudo à l'enregistrement (PUT
 * /api/profil) ; cette route ne sert que le retour immédiat côté UI. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const candidats = (searchParams.get("candidats") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 25);
  if (candidats.length === 0) return NextResponse.json({ success: true, data: { pris: [] } });

  const lignes = await prisma.profiles.findMany({
    where: { pseudo: { in: candidats, mode: "insensitive" } },
    select: { pseudo: true },
  });
  const prisEnMinuscule = new Set(lignes.map((l) => l.pseudo.toLowerCase()));
  const pris = candidats.filter((c) => prisEnMinuscule.has(c.toLowerCase()));

  return NextResponse.json({ success: true, data: { pris } });
}
