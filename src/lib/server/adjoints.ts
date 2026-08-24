import { prisma } from "@/lib/prisma";
import type { statut_adjoint } from "@/generated/prisma/client";

export type AdjointJSON = { proprietaire: string; adjoint: string; statut: statut_adjoint; horodatage: number };

/** Résout un nom d'organisateur (organisateur_profils.nom_organisateur,
 * unique en base, insensible à la casse) vers son profile_id. */
export async function profileIdDepuisNomOrganisateur(nom: string): Promise<string | undefined> {
  const ligne = await prisma.organisateur_profils.findFirst({
    where: { nom_organisateur: { equals: nom.trim(), mode: "insensitive" } },
  });
  return ligne?.profile_id;
}

/** Version groupée : résout plusieurs noms d'organisateur vers leur
 * profile_id en un seul aller-retour base (pattern en cascade repéré sur
 * /coup-de-coeur). Insensible à la casse comme la version unitaire —
 * comparaison faite côté application, la liste d'organisateurs distincts
 * reste petite (jamais un N proportionnel au trafic). */
export async function profileIdsDepuisNomsOrganisateur(noms: string[]): Promise<Map<string, string>> {
  const resultat = new Map<string, string>();
  if (noms.length === 0) return resultat;
  const lignes = await prisma.organisateur_profils.findMany({ select: { nom_organisateur: true, profile_id: true } });
  const parNomMinuscule = new Map(
    lignes.filter((l) => l.nom_organisateur).map((l) => [l.nom_organisateur!.trim().toLowerCase(), l.profile_id]),
  );
  for (const nom of noms) {
    const profileId = parNomMinuscule.get(nom.trim().toLowerCase());
    if (profileId) resultat.set(nom, profileId);
  }
  return resultat;
}

/** Traduit un lot de lignes adjoints_organisateur (profile_id) vers le
 * format nom (AdjointJSON) attendu côté UI — une seule requête de
 * résolution des noms plutôt qu'une par ligne. */
export async function versAdjointsJSON(
  lignes: { proprietaire_id: string; adjoint_id: string; statut: statut_adjoint; created_at: Date }[],
): Promise<AdjointJSON[]> {
  const ids = Array.from(new Set(lignes.flatMap((l) => [l.proprietaire_id, l.adjoint_id])));
  const profils = ids.length > 0 ? await prisma.organisateur_profils.findMany({ where: { profile_id: { in: ids } } }) : [];
  const noms = new Map(profils.map((p) => [p.profile_id, p.nom_organisateur]));
  return lignes.map((l) => ({
    proprietaire: noms.get(l.proprietaire_id) ?? "?",
    adjoint: noms.get(l.adjoint_id) ?? "?",
    statut: l.statut,
    horodatage: l.created_at.getTime(),
  }));
}

/** Vrai si adjointId est un adjoint accepté de proprietaireId — utilisé par
 * les routes de gestion en direct (matches, stream) pour étendre l'accès
 * organisateur aux adjoints, sans jamais l'étendre aux réglages/annulation
 * (cf. mockAdjointsOrganisateur.ts). */
export async function estAdjointAccepteDe(proprietaireId: string, adjointId: string): Promise<boolean> {
  if (proprietaireId === adjointId) return false;
  const ligne = await prisma.adjoints_organisateur.findUnique({
    where: { proprietaire_id_adjoint_id: { proprietaire_id: proprietaireId, adjoint_id: adjointId } },
  });
  return ligne?.statut === "accepte";
}
