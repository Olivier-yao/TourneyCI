/**
 * Adjoints organisateur — table `adjoints_organisateur` (Postgres via
 * /api/adjoints), même pattern que les migrations précédentes (fonctions
 * async, mêmes noms/signatures quand c'est possible). Les paramètres
 * "moi" (proprietaire/adjoint identifiant l'appelant) disparaissent des
 * signatures : ils étaient nécessaires au mock mono-appareil pour
 * distinguer les deux comptes, mais le serveur dérive désormais toujours
 * l'identité de l'appelant depuis la session, jamais du client.
 *
 * Un organisateur peut inviter un autre organisateur existant à l'aider à
 * superviser TOUS ses tournois (accès aux écrans de gestion en direct —
 * qualifications, room, stream). Un adjoint vient "en soutien" : il n'a
 * jamais accès aux réglages du tournoi (titre, règlement...) ni à la
 * demande d'annulation, qui restent réservés au propriétaire — ce
 * périmètre est désormais vérifié côté serveur (cf. /api/matches/[id],
 * /api/tournois/[id], /api/tournois/[id]/terminer), plus seulement
 * affiché côté client.
 */

export type StatutAdjoint = "en_attente" | "accepte";
export type Adjoint = { proprietaire: string; adjoint: string; statut: StatutAdjoint; horodatage: number };

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

type AdjointsJSON = { adjoints: Adjoint[]; invitationsRecues: Adjoint[]; proprietairesSupervises: string[] };

async function chargerAdjoints(): Promise<AdjointsJSON> {
  const reponse = await fetch("/api/adjoints");
  const resultat = await reponseJson<AdjointsJSON>(reponse);
  return resultat.ok ? resultat.data : { adjoints: [], invitationsRecues: [], proprietairesSupervises: [] };
}

/** Envoie une invitation — renvoie un message d'erreur, ou null si OK. */
export async function inviterAdjoint(nomAdjoint: string): Promise<string | null> {
  const reponse = await fetch("/api/adjoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomAdjoint }),
  });
  const resultat = await reponseJson<null>(reponse);
  return resultat.ok ? null : (resultat.erreur ?? "Erreur lors de l'invitation.");
}

/** Adjoints (invités + acceptés) du compte connecté, pour son écran de gestion. */
export async function adjointsDe(): Promise<Adjoint[]> {
  return (await chargerAdjoints()).adjoints;
}

/** Organisateurs dont le compte connecté est un adjoint accepté — sens
 * inverse d'adjointsDe(), pour l'onglet "Tournois à superviser". */
export async function proprietairesSupervises(): Promise<string[]> {
  return (await chargerAdjoints()).proprietairesSupervises;
}

/** Invitations en attente reçues par le compte connecté (à accepter/refuser). */
export async function invitationsRecues(): Promise<Adjoint[]> {
  return (await chargerAdjoints()).invitationsRecues;
}

export async function accepterInvitation(proprietaire: string): Promise<void> {
  await fetch("/api/adjoints/repondre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proprietaire, accepter: true }),
  });
}

/** Refuse une invitation en attente, ou retire/quitte une relation déjà
 * acceptée — même opération : supprime la relation, dans un sens comme
 * dans l'autre. */
export async function retirerAdjoint(nomAutrePartie: string): Promise<void> {
  await fetch(`/api/adjoints/${encodeURIComponent(nomAutrePartie)}`, { method: "DELETE" });
}

/** Le propriétaire ou l'un de ses adjoints acceptés peut superviser ce
 * tournoi (qualifications, room, stream) — jamais les réglages ni
 * l'annulation, réservés au seul propriétaire. Ce contrôle ne fait plus
 * qu'afficher/masquer les écrans : les actions réelles (démarrer un match,
 * saisir un score, activer le stream, clôturer) sont désormais aussi
 * vérifiées côté serveur (cf. /api/matches/[id], /api/tournois/[id],
 * /api/tournois/[id]/terminer), qui seul fait foi. */
export async function peutSuperviser(proprietaireDuTournoi: string, nomOrganisateurActuel: string): Promise<boolean> {
  if (proprietaireDuTournoi === nomOrganisateurActuel) return true;
  const supervises = await proprietairesSupervises();
  return supervises.includes(proprietaireDuTournoi);
}
