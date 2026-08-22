import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { equipeProfilParIdJSON, estMembreEquipeProfil, estChefEquipeProfil, renommerEquipeProfil, supprimerEquipeProfil } from "@/lib/server/equipesProfil";
import { peutModifierMensuel } from "@/lib/limiteMensuelle";

/** Réservé aux membres (chef ou simple membre) de l'équipe. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estMembreEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Équipe introuvable." }, { status: 404 });
  }
  const equipe = await equipeProfilParIdJSON(id);
  return NextResponse.json({ success: true, data: equipe });
}

/** Réservé au chef : renommage limité à 1×/mois (point 155). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  if (!nom) return NextResponse.json({ success: false, error: "Saisis un nom." }, { status: 400 });

  const equipeActuelle = await equipeProfilParIdJSON(id);
  if (equipeActuelle?.nom === nom) return NextResponse.json({ success: true, data: equipeActuelle });

  const { ok, prochainChangementLe } = peutModifierMensuel(equipeActuelle?.nomModifieLe);
  if (!ok) {
    return NextResponse.json(
      { success: false, error: `Renommable à nouveau le ${new Date(prochainChangementLe!).toLocaleDateString("fr-FR")}.`, prochainChangementLe },
      { status: 400 },
    );
  }

  const resultat = await renommerEquipeProfil(id, nom);
  if (!resultat.ok) return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  return NextResponse.json({ success: true, data: await equipeProfilParIdJSON(id) });
}

/** Réservé au chef : suppression définitive. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }
  await supprimerEquipeProfil(id);
  return NextResponse.json({ success: true });
}
