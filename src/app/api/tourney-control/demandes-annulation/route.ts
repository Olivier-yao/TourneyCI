import { NextResponse } from "next/server";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { demandesEnAttente } from "@/lib/server/demandesAnnulation";

export async function GET() {
  if (!(await sessionAdminValide())) return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ success: true, data: await demandesEnAttente() });
}
