import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { rejoindreEquipeAleatoire } from "@/lib/server/equipesBR";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const sousType = body?.sousType;
  if (sousType !== "duo" && sousType !== "trio" && sousType !== "squad") {
    return NextResponse.json({ success: false, error: "Sous-type invalide." }, { status: 400 });
  }

  const equipe = await rejoindreEquipeAleatoire(id, user.id, sousType);
  return NextResponse.json({ success: true, data: equipe });
}
