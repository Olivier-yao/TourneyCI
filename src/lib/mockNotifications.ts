/**
 * Notifications & suivi d'un tournoi — tables `notifications` et
 * `notifs_tournoi_suivis` (Postgres), même pattern que les migrations
 * précédentes (fonctions async, mêmes noms/signatures que la version
 * localStorage quand c'est possible).
 *
 * notifierParticipants() garde exactement la même sémantique qu'avant :
 * auto-notification (le destinataire réel est toujours l'appelant connecté)
 * — diffuser une vraie notification à tous les inscrits d'un tournoi est un
 * changement de fonctionnalité, pas une migration de stockage, et reste hors
 * périmètre de cette étape.
 */

import { estInscrit } from "./mockInscriptions";

export type NotificationApp = {
  id: string;
  texte: string;
  temps: string;
  horodatage: number;
  tournoiId?: string;
  lue: boolean;
};

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function mesNotifications(): Promise<NotificationApp[]> {
  const reponse = await fetch("/api/notifications");
  const resultat = await reponseJson<NotificationApp[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

/** Point 189 : exportée pour permettre l'envoi de notifications ponctuelles
 * hors contexte tournoi (ex. décision admin sur une demande de certification). */
export async function ajouterNotification(texte: string, tournoiId?: string): Promise<void> {
  await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texte, tournoiId }),
  });
}

export async function mesNotifsTournoi(): Promise<string[]> {
  const reponse = await fetch("/api/notifs-tournoi");
  const resultat = await reponseJson<string[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function notifsActivees(tournoiId: string): Promise<boolean> {
  return (await mesNotifsTournoi()).includes(tournoiId);
}

export async function basculerNotifsTournoi(tournoiId: string): Promise<boolean> {
  const reponse = await fetch(`/api/notifs-tournoi/${tournoiId}`, { method: "POST" });
  const resultat = await reponseJson<{ estActivee: boolean }>(reponse);
  return resultat.ok ? resultat.data.estActivee : false;
}

/** Notifie l'utilisateur connecté si (a) il est inscrit au tournoi, ou (b) il
 * a activé les notifications dessus. */
export async function notifierParticipants(tournoiId: string, titre: string, message: string): Promise<void> {
  if (!(await estInscrit(tournoiId)) && !(await notifsActivees(tournoiId))) return;
  await ajouterNotification(`${titre} — ${message}`, tournoiId);
}

export async function marquerLue(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}`, { method: "PATCH" });
}

export async function toutMarquerLu(): Promise<void> {
  await fetch("/api/notifications/tout-lu", { method: "POST" });
}

/** Pure : dérive le nombre de non-lues d'une liste déjà chargée (évite un
 * second appel réseau quand on a déjà mesNotifications()). */
export function nombreNonLues(notifications: NotificationApp[]): number {
  return notifications.filter((n) => !n.lue).length;
}
