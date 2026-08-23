import { NextResponse } from "next/server";
import { saisonActuelle } from "@/lib/server/saisons";

/** Saison de classement en cours — public, jamais bloquant. */
export async function GET() {
  return NextResponse.json({ success: true, data: await saisonActuelle() });
}
