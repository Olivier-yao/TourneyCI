import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { peutModifierMensuel } from "@/lib/limiteMensuelle";

/**
 * Première route API réelle du projet (cf. ROADMAP-backend-et-mobile.md,
 * section 2.2) : Prisma se connecte avec la chaîne "postgres" du pooler, qui
 * CONTOURNE le RLS déjà en place en base — donc chaque contrôle d'accès
 * (ici : ne jamais lire/écrire une autre ligne que la sienne) doit être
 * refait explicitement ici, jamais supposé être couvert par la base.
 */

async function utilisateurConnecte() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) {
    return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  const profil = await prisma.profiles.findUnique({
    where: { id: user.id },
    include: { villes: true },
  });

  return NextResponse.json({ success: true, data: profil });
}

export async function PUT(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) {
    return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pseudo = typeof body?.pseudo === "string" ? body.pseudo.trim() : undefined;
  const ville = typeof body?.ville === "string" ? body.ville.trim() : undefined;
  const photoUrl = typeof body?.photoUrl === "string" ? body.photoUrl : undefined;

  if (pseudo !== undefined && !pseudo) {
    return NextResponse.json({ success: false, error: "Pseudo invalide." }, { status: 400 });
  }

  const existant = await prisma.profiles.findUnique({ where: { id: user.id } });

  // Point 155 : un pseudo déjà choisi ne peut être changé qu'une fois par
  // mois — ne s'applique pas à la toute première saisie (existant === null
  // ou pseudo_modifie_le jamais renseigné).
  if (pseudo !== undefined && existant && existant.pseudo !== pseudo) {
    const { ok, prochainChangementLe } = peutModifierMensuel(existant.pseudo_modifie_le?.getTime());
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Pseudo modifiable une fois par mois.", prochainChangementLe },
        { status: 409 },
      );
    }
  }

  let villeId: number | undefined;
  if (ville) {
    const villeRow = await prisma.villes.findFirst({ where: { nom: ville } });
    if (!villeRow) {
      return NextResponse.json({ success: false, error: "Ville inconnue." }, { status: 400 });
    }
    villeId = villeRow.id;
  }

  const pseudoChange = pseudo !== undefined && existant?.pseudo !== pseudo;

  try {
    const profil = await prisma.profiles.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        pseudo: pseudo ?? user.email?.split("@")[0] ?? `joueur-${user.id.slice(0, 8)}`,
        ville_id: villeId,
        photo_url: photoUrl,
      },
      update: {
        ...(pseudo !== undefined ? { pseudo } : {}),
        ...(pseudoChange ? { pseudo_modifie_le: new Date() } : {}),
        ...(villeId !== undefined ? { ville_id: villeId } : {}),
        ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
      },
      include: { villes: true },
    });
    return NextResponse.json({ success: true, data: profil });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ success: false, error: "Ce pseudo est déjà pris." }, { status: 409 });
    }
    throw err;
  }
}
