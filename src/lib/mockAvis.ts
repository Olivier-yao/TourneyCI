/**
 * Avis "cœur / cœur brisé" — tables `avis_tournoi` et `avis_organisateur`
 * (Postgres), même pattern que les migrations précédentes (fonctions async,
 * mêmes noms/signatures quand c'est possible). "Mon avis" désigne
 * désormais vraiment le compte connecté (contrainte unique en base sur
 * tournoi/auteur et organisateur/auteur) — l'ancienne limitation "mock
 * mono-appareil" (pas de champ auteur du tout) disparaît avec la migration.
 */

export type TypeAvis = "coeur" | "coeur_brise";

export type AvisTournoi = {
  id: string;
  tournoiId: string;
  type: TypeAvis;
  message?: string;
  horodatage: number;
};

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

type AvisTournoiApiJSON = { coeurs: number; coeursBrises: number; mon: AvisTournoi | null };

/** Un seul appel réseau pour les cœurs/cœurs brisés ET l'avis du compte
 * connecté sur ce tournoi — évite d'appeler deux fois le même endpoint
 * (pattern en cascade repéré sur la fiche tournoi, cf. compterAvisPlusieurs
 * ci-dessus pour l'équivalent multi-tournois). */
export async function chargerAvisTournoi(tournoiId: string): Promise<AvisTournoiApiJSON> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/avis`);
  const resultat = await reponseJson<AvisTournoiApiJSON>(reponse);
  return resultat.ok ? resultat.data : { coeurs: 0, coeursBrises: 0, mon: null };
}

export async function compterAvis(tournoiId: string): Promise<{ coeurs: number; coeursBrises: number }> {
  const { coeurs, coeursBrises } = await chargerAvisTournoi(tournoiId);
  return { coeurs, coeursBrises };
}

/** Version groupée de compterAvis() : un seul appel réseau pour plusieurs
 * tournois au lieu d'un par tournoi (pattern en cascade repéré sur
 * /en-direct et les profils organisateur). */
export async function compterAvisPlusieurs(
  tournoiIds: string[],
): Promise<Record<string, { coeurs: number; coeursBrises: number }>> {
  if (tournoiIds.length === 0) return {};
  const reponse = await fetch(`/api/tournois/avis-comptes?ids=${tournoiIds.join(",")}`);
  const resultat = await reponseJson<Record<string, { coeurs: number; coeursBrises: number }>>(reponse);
  return resultat.ok ? resultat.data : {};
}

/** Avis du compte connecté pour ce tournoi, s'il en a laissé un. */
export async function monAvisPourTournoi(tournoiId: string): Promise<AvisTournoi | undefined> {
  return (await chargerAvisTournoi(tournoiId)).mon ?? undefined;
}

export async function laisserAvis(tournoiId: string, type: TypeAvis, message?: string): Promise<void> {
  await fetch(`/api/tournois/${tournoiId}/avis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, message }),
  });
}

/**
 * Avis global laissé directement à un organisateur, indépendamment de tout
 * tournoi précis (point 51 — un seul avis par organisateur et par
 * utilisateur, distinct des avis par tournoi ci-dessus).
 */
type ReputationApiJSON = { coeurs: number; coeursBrises: number; mon: TypeAvis | null };

async function chargerReputationOrganisateur(nom: string): Promise<ReputationApiJSON> {
  const reponse = await fetch(`/api/organisateur/${encodeURIComponent(nom)}/avis`);
  const resultat = await reponseJson<ReputationApiJSON>(reponse);
  return resultat.ok ? resultat.data : { coeurs: 0, coeursBrises: 0, mon: null };
}

/** Réputation combinée (avis sur les tournois + avis direct sur le profil)
 * de cet organisateur — cf. statistiquesReputation() dans mockOrganisateur.ts. */
export async function reputationOrganisateur(nom: string): Promise<{ coeurs: number; coeursBrises: number }> {
  const { coeurs, coeursBrises } = await chargerReputationOrganisateur(nom);
  return { coeurs, coeursBrises };
}

export async function monAvisPourOrganisateur(nom: string): Promise<TypeAvis | null> {
  return (await chargerReputationOrganisateur(nom)).mon;
}

/** Pose l'avis direct sur ce profil, en remplaçant l'avis précédent s'il en
 * existait un (point 112/113 : toggle direct sur l'icône, avec bascule d'un
 * type à l'autre) — l'unicité du point 51 reste garantie (un seul avis actif
 * à la fois par utilisateur et par organisateur). */
export async function laisserAvisOrganisateur(nom: string, type: TypeAvis): Promise<void> {
  await fetch(`/api/organisateur/${encodeURIComponent(nom)}/avis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
}

/** Retire l'avis (cœur ou cœur brisé) laissé sur cet organisateur. */
export async function retirerAvisOrganisateur(nom: string): Promise<void> {
  await fetch(`/api/organisateur/${encodeURIComponent(nom)}/avis`, { method: "DELETE" });
}
