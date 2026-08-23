/**
 * Classement joueur réel (priorité backend #4 + saisons) — remplace
 * CLASSEMENTS (seed statique) + attribuerPoints/localStorage de
 * mockProfil.ts. Les points par jeu sont écrits par
 * appliquerProgressionEtPoints (src/lib/server/cloture.ts) à la clôture
 * d'un tournoi, toujours rattachés à la saison en cours (saisons.ts) ; ce
 * module ne fait que LIRE — sommés tous jeux confondus pour le ladder global
 * (Classement.tsx n'a jamais affiché de classement par jeu séparé).
 *
 * Deux échelles de temps distinctes, volontairement :
 *  - le CLASSEMENT (ladder, rang national) est scopé à la saison en cours —
 *    repart à zéro à chaque nouvelle saison (classementGlobal/rangNationalDe).
 *  - le palier de progression (Débutant→Légende) reste basé sur le cumul à
 *    VIE, toutes saisons confondues (pointsCumulesDe) — cohérent avec
 *    matchs_joues, qui ne se réinitialise jamais : perdre son badge
 *    "Légende" tous les 30 jours contredirait l'idée de progression.
 */

import { prisma } from "@/lib/prisma";

export type ClassementJoueurEntree = {
  profileId: string;
  pseudo: string;
  initiales: string;
  ville?: string;
  photoUrl?: string;
  points: number;
  moi?: boolean;
};

function initiales(nom: string): string {
  return nom
    .split(" ")
    .map((m) => m[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Classement de la saison donnée, tous jeux confondus, points sommés par
 * profil, trié décroissant — aucune entrée pour un profil qui n'a encore
 * reçu aucun point cette saison (pas de ligne à 0 par défaut, contrairement
 * à un LEFT JOIN). */
export async function classementGlobal(saisonId: string, profileIdMoi?: string): Promise<ClassementJoueurEntree[]> {
  const totaux = await prisma.points_classement.groupBy({
    by: ["profile_id"],
    where: { saison_id: saisonId },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
  });
  if (totaux.length === 0) return [];

  const profils = await prisma.profiles.findMany({
    where: { id: { in: totaux.map((t) => t.profile_id) } },
    include: { villes: true },
  });
  const parId = new Map(profils.map((p) => [p.id, p]));

  const entrees: ClassementJoueurEntree[] = [];
  for (const t of totaux) {
    const p = parId.get(t.profile_id);
    if (!p) continue;
    entrees.push({
      profileId: p.id,
      pseudo: p.pseudo,
      initiales: initiales(p.pseudo),
      ville: p.villes?.nom,
      photoUrl: p.photo_url ?? undefined,
      points: t._sum.points ?? 0,
      moi: profileIdMoi ? p.id === profileIdMoi : undefined,
    });
  }
  return entrees;
}

/** Position dans le classement de la saison donnée — undefined si le profil
 * n'a encore aucun point CETTE saison, plutôt qu'un rang arbitraire. */
export async function rangNationalDe(profileId: string, saisonId: string): Promise<number | undefined> {
  const classement = await classementGlobal(saisonId);
  const index = classement.findIndex((e) => e.profileId === profileId);
  return index >= 0 ? index + 1 : undefined;
}

/** Total à VIE, toutes saisons confondues — sert au palier de progression
 * (calculerGrade), jamais au classement affiché (cf. classementGlobal). */
export async function pointsCumulesDe(profileId: string): Promise<number> {
  const agg = await prisma.points_classement.aggregate({ where: { profile_id: profileId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}
