import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { traiterPlainte } from "@/lib/server/plaintes";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const messageAdmin = typeof body?.messageAdmin === "string" ? body.messageAdmin : "";

  const resultat = await traiterPlainte(id, messageAdmin);
  if (!resultat) return NextResponse.json({ success: false, error: "Plainte introuvable." }, { status: 404 });
  return NextResponse.json({ success: true, data: resultat });
}
