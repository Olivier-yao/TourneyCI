import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { traiterVerificationKyc } from "@/lib/server/kyc";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const statut = body?.statut;
  if (statut !== "validee" && statut !== "refusee") {
    return NextResponse.json({ success: false, error: "Statut invalide." }, { status: 400 });
  }

  const resultat = await traiterVerificationKyc(id, statut);
  if (!resultat) return NextResponse.json({ success: false, error: "Vérification introuvable." }, { status: 404 });
  return NextResponse.json({ success: true, data: resultat });
}
