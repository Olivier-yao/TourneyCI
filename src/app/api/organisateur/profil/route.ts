import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import {
  profilOrganisateurJSON,
  definirTag,
  definirBio,
  definirBanniere,
  definirPhoto,
  peutChangerPhoto,
  definirReglementStandardAccepte,
  definirReglementCertifieAccepte,
} from "@/lib/server/organisateurProfil";

/** Réservé au compte connecté : TAG, bio, bannière, photo, réseaux sociaux
 * et acceptation des règlements de son propre profil organisateur. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  return NextResponse.json({ success: true, data: await profilOrganisateurJSON(user.id) });
}

/** Met à jour un ou plusieurs champs (même convention que PUT /api/profil). */
export async function PATCH(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);

  if (typeof body?.tag === "string") await definirTag(user.id, body.tag);
  if (typeof body?.bio === "string") await definirBio(user.id, body.bio);
  if (typeof body?.banniereUrl === "string") await definirBanniere(user.id, body.banniereUrl);

  if (typeof body?.photoUrl === "string") {
    const { ok, prochainChangementLe } = await peutChangerPhoto(user.id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Photo modifiable une fois par semaine.", prochainChangementLe },
        { status: 409 },
      );
    }
    await definirPhoto(user.id, body.photoUrl);
  }

  if (body?.reglementStandardAccepte === true) await definirReglementStandardAccepte(user.id);
  if (body?.reglementCertifieAccepte === true) await definirReglementCertifieAccepte(user.id);

  return NextResponse.json({ success: true });
}
