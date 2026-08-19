/**
 * Avis "cœur / cœur brisé" laissés par les participants à la fin d'un
 * tournoi, associés au tournoi et à l'organisateur concerné. Sert de base à
 * la réputation organisateur et aux mécanismes de séquestre du cash prize.
 *
 * Pas de cleCompte() ici : compterAvis()/avisDeOrganisateur() alimentent un
 * compteur PUBLIC affiché à tous les visiteurs (fiche tournoi, /en-direct,
 * profil organisateur) — namespacer par compte le rendrait invisible aux
 * autres comptes du même appareil. Les entrées n'ont d'ailleurs pas de champ
 * auteur : "mon avis" désigne déjà l'avis de CET APPAREIL, pas d'un compte
 * précis (limite du mock assumée, cf. commentaires plus bas).
 */

export type TypeAvis = "coeur" | "coeur_brise";

export type AvisTournoi = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  organisateur: string;
  type: TypeAvis;
  message?: string;
  horodatage: number;
};

const CLE_AVIS = "tourney-avis";

function lireTout(): AvisTournoi[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_AVIS);
    return brut ? (JSON.parse(brut) as AvisTournoi[]) : [];
  } catch {
    return [];
  }
}

export function avisDuTournoi(tournoiId: string): AvisTournoi[] {
  return lireTout().filter((a) => a.tournoiId === tournoiId);
}

export function avisDeOrganisateur(organisateur: string): AvisTournoi[] {
  return lireTout().filter((a) => a.organisateur === organisateur);
}

/** Un seul avis par tournoi côté appareil courant (mock mono-utilisateur). */
export function monAvisPourTournoi(tournoiId: string): AvisTournoi | undefined {
  return lireTout().find((a) => a.tournoiId === tournoiId);
}

export function laisserAvis(
  tournoiId: string,
  tournoiTitre: string,
  organisateur: string,
  type: TypeAvis,
  message?: string,
) {
  if (typeof window === "undefined") return;
  if (monAvisPourTournoi(tournoiId)) return;
  const avis: AvisTournoi = {
    id: `avis-${Date.now().toString(36)}`,
    tournoiId,
    tournoiTitre,
    organisateur,
    type,
    message: message?.trim() || undefined,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_AVIS, JSON.stringify([...lireTout(), avis]));
}

export function compterAvis(tournoiId: string): { coeurs: number; coeursBrises: number } {
  const avis = avisDuTournoi(tournoiId);
  return {
    coeurs: avis.filter((a) => a.type === "coeur").length,
    coeursBrises: avis.filter((a) => a.type === "coeur_brise").length,
  };
}

/**
 * Avis global laissé directement à un organisateur, indépendamment de tout
 * tournoi précis (cf. point 51 — un seul avis par organisateur et par
 * utilisateur, distinct des avis par tournoi ci-dessus).
 */
export type AvisOrganisateur = {
  id: string;
  organisateur: string;
  type: TypeAvis;
  horodatage: number;
};

const CLE_AVIS_ORGANISATEUR = "tourney-avis-organisateur";

function lireToutOrganisateur(): AvisOrganisateur[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_AVIS_ORGANISATEUR);
    return brut ? (JSON.parse(brut) as AvisOrganisateur[]) : [];
  } catch {
    return [];
  }
}

export function avisGlobalDeOrganisateur(organisateur: string): AvisOrganisateur[] {
  return lireToutOrganisateur().filter((a) => a.organisateur === organisateur);
}

export function monAvisPourOrganisateur(organisateur: string): AvisOrganisateur | undefined {
  return lireToutOrganisateur().find((a) => a.organisateur === organisateur);
}

/** Pose un avis sur l'organisateur, en remplaçant l'avis précédent s'il en
 * existait un (point 112/113 : toggle direct sur l'icône, avec bascule d'un
 * type à l'autre) — l'unicité du point 51 reste garantie (un seul avis actif
 * à la fois par utilisateur et par organisateur). */
export function laisserAvisOrganisateur(organisateur: string, type: TypeAvis) {
  if (typeof window === "undefined") return;
  const sansAncien = lireToutOrganisateur().filter((a) => a.organisateur !== organisateur);
  const avis: AvisOrganisateur = {
    id: `avisorg-${Date.now().toString(36)}`,
    organisateur,
    type,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_AVIS_ORGANISATEUR, JSON.stringify([...sansAncien, avis]));
}

/** Retire l'avis (cœur ou cœur brisé) laissé sur cet organisateur — l'unicité
 * du point 51 reste respectée (un seul avis actif à la fois), mais rien
 * n'empêche d'en redonner un différent ensuite (point 77). */
export function retirerAvisOrganisateur(organisateur: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CLE_AVIS_ORGANISATEUR,
    JSON.stringify(lireToutOrganisateur().filter((a) => a.organisateur !== organisateur)),
  );
}
