import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { demandesEnAttenteJSON, demanderRejoindre, aUneDemandeEnAttente } from "@/lib/server/equipesBR";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("moi") === "1") {
    const user = await utilisateurConnecte();
    if (!user) return nonAuthentifie();
    return NextResponse.json({ success: true, data: { enAttente: await aUneDemandeEnAttente(id, user.id) } });
  }
  return NextResponse.json({ success: true, data: await demandesEnAttenteJSON(id) });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const demande = await demanderRejoindre(id, user.id);
  return NextResponse.json({ success: true, data: demande });
}
