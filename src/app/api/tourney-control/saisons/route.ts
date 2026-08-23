import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { saisonActuelle, definirNomSaisonSuivante } from "@/lib/server/saisons";

/** Saison en cours + nom déjà saisi pour la suivante (vide si pas encore
 * renseigné) — l'admin voit toujours l'état réel avant de le modifier. */
export async function GET() {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ success: true, data: await saisonActuelle() });
}

/** Enregistre le nom de la PROCHAINE saison — n'affecte jamais la saison en
 * cours, seulement celle qui sera créée à la bascule (cf. saisons.ts). */
export async function POST(request: Request) {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom : "";
  if (!nom.trim()) return NextResponse.json({ success: false, error: "Nom requis." }, { status: 400 });

  await definirNomSaisonSuivante(nom);
  return NextResponse.json({ success: true, data: await saisonActuelle() });
}
