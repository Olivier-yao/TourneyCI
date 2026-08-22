import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { profileIdDepuisTag } from "@/lib/server/identite";
import { prisma } from "@/lib/prisma";

/** Confirme l'identité (pseudo) derrière un TAG avant l'envoi d'une
 * invitation — vrai lookup cross-compte (profiles.tag), plus le registre de
 * démo mono-appareil d'avant la migration. Exclut le compte connecté. */
export async function GET(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") ?? "";
  const profileId = await profileIdDepuisTag(tag);
  if (!profileId || profileId === user.id) return NextResponse.json({ success: true, data: null });

  const profil = await prisma.profiles.findUnique({ where: { id: profileId }, select: { pseudo: true } });
  return NextResponse.json({ success: true, data: profil ? { nom: profil.pseudo } : null });
}
