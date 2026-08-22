import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estChefEquipeProfil, inviterParTagEquipeProfil } from "@/lib/server/equipesProfil";
import { profileIdDepuisTag } from "@/lib/server/identite";

/** Réservé au chef : invite un profil existant par son TAG. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estChefEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Réservé au chef de l'équipe." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const tag = typeof body?.tag === "string" ? body.tag : "";
  if (!tag.trim()) return NextResponse.json({ success: false, error: "Saisis le TAG du joueur à inviter." }, { status: 400 });

  const destinataireId = await profileIdDepuisTag(tag);
  if (!destinataireId) return NextResponse.json({ success: false, error: "Aucun profil ne correspond à ce TAG." }, { status: 404 });

  const resultat = await inviterParTagEquipeProfil(id, destinataireId);
  if (!resultat.ok) return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  return NextResponse.json({ success: true });
}
