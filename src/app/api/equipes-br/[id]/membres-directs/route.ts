import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estChefEquipeBR, ajouterMembresDirect } from "@/lib/server/equipesBR";

/** Réservé au chef : intègre directement des membres déjà vetted (équipe
 * pré-créée du profil), sans passer par la file de demandes. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeBR(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const pseudos: string[] = Array.isArray(body?.membres) ? body.membres.filter((m: unknown) => typeof m === "string") : [];
  const profils = await prisma.profiles.findMany({ where: { pseudo: { in: pseudos, mode: "insensitive" } } });

  await ajouterMembresDirect(id, profils.map((p) => p.id));
  return NextResponse.json({ success: true });
}
