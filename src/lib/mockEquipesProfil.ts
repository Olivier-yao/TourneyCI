/**
 * Équipes pré-créées, gérées depuis le profil, indépendamment de tout
 * tournoi (point 140) — tables `equipes_profil`/`equipes_profil_membres`/
 * `invitations_equipe_profil` (Postgres), même pattern que les migrations
 * précédentes (fonctions async, mêmes noms/signatures quand c'est
 * possible). Max 5 équipes par joueur (en tant que chef), max 4 membres par
 * équipe — désormais appliqué côté serveur (vraie limite cross-appareil).
 *
 * L'invitation par TAG devient un vrai lookup cross-compte
 * (profiles.tag, cf. src/lib/server/identite.ts) au lieu du registre de
 * démo mono-appareil d'avant la migration — c'est la raison d'être de ce
 * module : une invitation envoyée depuis un appareil doit être visible
 * depuis celui du destinataire.
 *
 * Notification "il y a une invitation/proposition en attente" volontairement
 * pas envoyée au destinataire réel : notifierParticipants()/
 * ajouterNotification() ne notifient que le compte connecté (même
 * limitation assumée que la migration précédente des notifications) —
 * diffuser une vraie alerte à un autre compte serait un changement de
 * fonctionnalité, pas une migration de stockage. L'invitation/proposition
 * reste bien réelle et visible dès que l'autre compte consulte "Mes
 * équipes" ; seul le petit "ping" immédiat ne se déclenche pas.
 */

export type EquipeProfil = {
  id: string;
  nom: string;
  chef: string;
  membres: string[];
  creeLe: number;
  /** Point 155 : horodatage du dernier renommage, pour la limite mensuelle. */
  nomModifieLe?: number;
};

export const MAX_EQUIPES_PROFIL = 5;
export const MAX_MEMBRES_EQUIPE_PROFIL = 4;

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

/** Équipes dont le compte connecté est chef (gérables) — utilisé pour la limite de 5. */
export async function equipesProfilDontChef(): Promise<EquipeProfil[]> {
  const reponse = await fetch("/api/equipes-profil?role=chef");
  const resultat = await reponseJson<EquipeProfil[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

/** Équipes dont le compte connecté est simple membre (pas chef) — point 192. */
export async function equipesProfilDontMembreNonChef(): Promise<EquipeProfil[]> {
  const reponse = await fetch("/api/equipes-profil?role=membre");
  const resultat = await reponseJson<EquipeProfil[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function equipeProfilParId(id: string): Promise<EquipeProfil | undefined> {
  const reponse = await fetch(`/api/equipes-profil/${id}`);
  const resultat = await reponseJson<EquipeProfil>(reponse);
  return resultat.ok ? resultat.data : undefined;
}

export async function creerEquipeProfil(nom: string): Promise<EquipeProfil | null> {
  const reponse = await fetch("/api/equipes-profil", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom }),
  });
  const resultat = await reponseJson<EquipeProfil>(reponse);
  return resultat.ok ? resultat.data : null;
}

export async function renommerEquipeProfil(id: string, nom: string): Promise<string | null> {
  const reponse = await fetch(`/api/equipes-profil/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom }),
  });
  const resultat = await reponseJson<EquipeProfil>(reponse);
  return resultat.ok ? null : (resultat.erreur ?? "Renommage impossible.");
}

/** Réservé au chef : retire un autre membre de l'équipe. */
export async function retirerMembreEquipeProfil(id: string, membre: string): Promise<void> {
  await fetch(`/api/equipes-profil/${id}/membres`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "retirer", membre }),
  });
}

/** Le compte connecté quitte une équipe dont il est simple membre. */
export async function quitterEquipeProfil(id: string): Promise<void> {
  await fetch(`/api/equipes-profil/${id}/membres`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "quitter" }),
  });
}

export async function supprimerEquipeProfil(id: string): Promise<void> {
  await fetch(`/api/equipes-profil/${id}`, { method: "DELETE" });
}

/**
 * Invitations par TAG (point 192) : le chef invite un profil existant par
 * son TAG plutôt que de l'ajouter directement — le joueur invité doit
 * accepter depuis l'onglet "Invitations" de son propre "Mes équipes" avant
 * d'intégrer l'équipe.
 */
export type InvitationEquipeProfil = {
  id: string;
  equipeId: string;
  equipeNom: string;
  chef: string;
  destinataire: string;
  statut: "en_attente" | "acceptee" | "refusee";
  horodatage: number;
};

export async function invitationsRecues(): Promise<InvitationEquipeProfil[]> {
  const reponse = await fetch("/api/invitations-equipe-profil");
  const resultat = await reponseJson<InvitationEquipeProfil[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

/** Recherche par TAG (point 192) puis envoie l'invitation — renvoie un
 * message d'erreur explicite, ou null si l'invitation a bien été envoyée. */
export async function inviterParTagEquipeProfil(equipeId: string, tag: string): Promise<string | null> {
  const reponse = await fetch(`/api/equipes-profil/${equipeId}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  });
  const resultat = await reponseJson<void>(reponse);
  return resultat.ok ? null : (resultat.erreur ?? "Invitation impossible.");
}

/** Confirme l'identité (pseudo) avant l'envoi — utilisé par l'écran de
 * confirmation "Inviter" (point 192), séparé de l'envoi effectif. */
export async function apercuJoueurParTag(equipeId: string, tag: string): Promise<{ nom: string } | undefined> {
  const reponse = await fetch(`/api/equipes-profil/${equipeId}/apercu?tag=${encodeURIComponent(tag)}`);
  const resultat = await reponseJson<{ nom: string } | null>(reponse);
  return resultat.ok && resultat.data ? resultat.data : undefined;
}

export async function repondreInvitationEquipeProfil(id: string, accepter: boolean): Promise<string | null> {
  const reponse = await fetch(`/api/invitations-equipe-profil/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accepter }),
  });
  const resultat = await reponseJson<void>(reponse);
  return resultat.ok ? null : (resultat.erreur ?? "Réponse impossible.");
}
