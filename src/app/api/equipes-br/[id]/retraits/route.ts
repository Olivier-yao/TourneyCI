import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estChefEquipeBR, historiqueRetraitsJSON, retirerMembre } from "@/lib/server/equipesBR";
import { profileIdDepuisPseudo } from "@/lib/server/identite";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ success: true, data: await historiqueRetraitsJSON(id) });
}

/** Réservé au chef : retire un membre déjà intégré (motif obligatoire). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeBR(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const motif = typeof body?.motif === "string" ? body.motif.trim() : "";
  const membrePseudo = typeof body?.membre === "string" ? body.membre : "";
  if (!motif || !membrePseudo) return NextResponse.json({ success: false, error: "Motif et membre requis." }, { status: 400 });

  const membreId = await profileIdDepuisPseudo(membrePseudo);
  if (!membreId) return NextResponse.json({ success: false, error: "Joueur introuvable." }, { status: 404 });

  await retirerMembre(id, membreId, motif);
  return NextResponse.json({ success: true });
}
