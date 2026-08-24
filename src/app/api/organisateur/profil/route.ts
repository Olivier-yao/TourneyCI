import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import {
  profilOrganisateurJSON,
  definirNomOrganisateurServeur,
  definirTag,
  definirBio,
  definirBanniere,
  definirPhoto,
  peutChangerPhoto,
  definirReglementStandardAccepte,
  definirReglementCertifieAccepte,
  definirSuiviMasque,
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

  if (typeof body?.nomOrganisateur === "string" && body.nomOrganisateur.trim()) {
    const resultat = await definirNomOrganisateurServeur(user.id, body.nomOrganisateur);
    if (!resultat.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resultat.erreur === "cooldown" ? "Renommage limité à une fois par mois." : "Ce nom est déjà pris.",
          prochainChangementLe: resultat.erreur === "cooldown" ? resultat.prochainChangementLe : undefined,
          suggestions: resultat.erreur === "deja_pris" ? resultat.suggestions : undefined,
        },
        { status: 409 },
      );
    }
  }

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
  if (typeof body?.suiviMasque === "boolean") await definirSuiviMasque(user.id, body.suiviMasque);

  return NextResponse.json({ success: true });
}
