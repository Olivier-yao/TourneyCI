import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { definirReseauSocial, retirerReseauSocial, type PlateformeSociale } from "@/lib/server/organisateurProfil";

const PLATEFORMES_VALIDES: PlateformeSociale[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "x",
  "whatsapp",
  "twitch",
  "discord",
  "snapchat",
  "site",
];

function plateformeValide(v: unknown): v is PlateformeSociale {
  return typeof v === "string" && (PLATEFORMES_VALIDES as string[]).includes(v);
}

/** Réservé au compte connecté : ajoute ou remplace le lien d'une plateforme
 * (un seul lien par plateforme). */
export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  if (!plateformeValide(body?.plateforme) || typeof body?.url !== "string" || !body.url.trim()) {
    return NextResponse.json({ success: false, error: "Plateforme ou URL invalide." }, { status: 400 });
  }

  await definirReseauSocial(user.id, body.plateforme, body.url);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  if (!plateformeValide(body?.plateforme)) {
    return NextResponse.json({ success: false, error: "Plateforme invalide." }, { status: 400 });
  }

  await retirerReseauSocial(user.id, body.plateforme);
  return NextResponse.json({ success: true });
}
