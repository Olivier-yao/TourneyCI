import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { derniereVerificationKyc, soumettreVerificationKyc } from "@/lib/server/kyc";

// L'analyse automatique (OCR + détection de visage) peut prendre plusieurs
// secondes, surtout au premier appel (téléchargement des modèles) — la
// limite par défaut (10s) est trop courte.
export const maxDuration = 60;

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  return NextResponse.json({ success: true, data: (await derniereVerificationKyc(user.id)) ?? null });
}

export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const typePiece = typeof body?.typePiece === "string" ? body.typePiece : "";
  const rectoUrl = typeof body?.rectoUrl === "string" ? body.rectoUrl : "";
  const versoUrl = typeof body?.versoUrl === "string" ? body.versoUrl : "";
  const selfieUrl = typeof body?.selfieUrl === "string" ? body.selfieUrl : "";
  const ageConfirme = Boolean(body?.ageConfirme);

  const resultat = await soumettreVerificationKyc(user.id, { typePiece, rectoUrl, versoUrl, selfieUrl, ageConfirme });
  if (!resultat.ok) return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  return NextResponse.json({ success: true, data: resultat.data });
}
