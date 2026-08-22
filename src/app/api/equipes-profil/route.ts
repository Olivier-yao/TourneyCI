import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { equipesProfilDontChefJSON, equipesProfilDontMembreNonChefJSON, creerEquipeProfil } from "@/lib/server/equipesProfil";

/** ?role=chef (par défaut) ou ?role=membre — toujours pour le compte
 * connecté (pas de pseudo pris depuis le client). */
export async function GET(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") === "membre" ? "membre" : "chef";
  const data = role === "membre" ? await equipesProfilDontMembreNonChefJSON(user.id) : await equipesProfilDontChefJSON(user.id);
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  if (!nom) return NextResponse.json({ success: false, error: "Nom d'équipe requis." }, { status: 400 });

  const resultat = await creerEquipeProfil(nom, user.id);
  if (!resultat.ok) return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  return NextResponse.json({ success: true, data: resultat.equipe });
}
