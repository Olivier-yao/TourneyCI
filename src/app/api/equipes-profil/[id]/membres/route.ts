import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estChefEquipeProfil, retirerMembreEquipeProfil } from "@/lib/server/equipesProfil";
import { profileIdDepuisPseudo } from "@/lib/server/identite";

/** action "retirer" (réservé au chef, cible un autre membre) ou "quitter"
 * (un simple membre se retire lui-même — le chef ne peut pas quitter sa
 * propre équipe, il doit la supprimer). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const estChef = await estChefEquipeProfil(id, user.id);

  if (body?.action === "quitter") {
    if (estChef) return NextResponse.json({ success: false, error: "Le chef ne peut pas quitter sa propre équipe." }, { status: 400 });
    await retirerMembreEquipeProfil(id, user.id);
    return NextResponse.json({ success: true });
  }

  if (body?.action === "retirer") {
    if (!estChef) return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
    const membrePseudo = typeof body?.membre === "string" ? body.membre : "";
    const membreId = await profileIdDepuisPseudo(membrePseudo);
    if (!membreId) return NextResponse.json({ success: false, error: "Joueur introuvable." }, { status: 404 });
    await retirerMembreEquipeProfil(id, membreId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Action inconnue." }, { status: 400 });
}
