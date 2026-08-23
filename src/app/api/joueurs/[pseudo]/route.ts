import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pointsCumulesDe, rangNationalDe } from "@/lib/server/classement";
import { saisonActuelle } from "@/lib/server/saisons";

/** Profil public d'un joueur par pseudo (fiche /joueur/[nom]) — matchs
 * joués/victoires/points/rang réels, que ce soit "moi" ou un autre joueur ;
 * avant cette route, les stats d'un autre joueur étaient entièrement
 * dérivées d'un hash déterministe (aucune donnée réelle, cf. joueur/[nom]). */
export async function GET(_request: Request, { params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = await params;
  const profil = await prisma.profiles.findFirst({
    where: { pseudo: { equals: decodeURIComponent(pseudo), mode: "insensitive" } },
    include: { villes: true },
  });
  if (!profil) {
    return NextResponse.json({ success: false, error: "Joueur introuvable." }, { status: 404 });
  }

  const saison = await saisonActuelle();
  const [pointsCumules, rangNational] = await Promise.all([pointsCumulesDe(profil.id), rangNationalDe(profil.id, saison.id)]);

  return NextResponse.json({
    success: true,
    data: {
      pseudo: profil.pseudo,
      ville: profil.villes?.nom ?? "",
      photoUrl: profil.photo_url ?? undefined,
      matchsJoues: profil.matchs_joues,
      victoires: profil.victoires,
      points: pointsCumules,
      rangNational,
    },
  });
}
