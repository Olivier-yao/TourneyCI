import { estInscrit } from "./mockInscriptions";

export type NotificationApp = {
  id: string;
  texte: string;
  temps: string;
  horodatage: number;
  tournoiId?: string;
};

const CLE_NOTIFICATIONS = "tourneyci-notifications";
const CLE_SUIVIS = "tourneyci-notifs-suivies";

const NOTIFICATIONS_INITIALES: NotificationApp[] = [
  { id: "n1", texte: "Ton match commence dans 10 minutes", temps: "Il y a 2 min", horodatage: 3 },
  { id: "n2", texte: "Nouveau tournoi Free Fire disponible", temps: "Il y a 1 h", horodatage: 2 },
  { id: "n3", texte: "Ton inscription à Abidjan Cup #12 est confirmée", temps: "Hier", horodatage: 1 },
];

function lireBrut<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

export function mesNotifications(): NotificationApp[] {
  return lireBrut(CLE_NOTIFICATIONS, NOTIFICATIONS_INITIALES);
}

function ajouterNotification(texte: string, tournoiId?: string) {
  if (typeof window === "undefined") return;
  const existantes = mesNotifications();
  const nouvelle: NotificationApp = {
    id: `notif-${Date.now().toString(36)}`,
    texte,
    temps: "À l'instant",
    horodatage: Date.now(),
    tournoiId,
  };
  localStorage.setItem(CLE_NOTIFICATIONS, JSON.stringify([nouvelle, ...existantes]));
}

function lireSuivis(): string[] {
  return lireBrut(CLE_SUIVIS, []);
}

export function notifsActivees(tournoiId: string): boolean {
  return lireSuivis().includes(tournoiId);
}

export function basculerNotifsTournoi(tournoiId: string): boolean {
  if (typeof window === "undefined") return false;
  const suivis = lireSuivis();
  const index = suivis.indexOf(tournoiId);
  const nouveaux = index === -1 ? [...suivis, tournoiId] : suivis.filter((id) => id !== tournoiId);
  localStorage.setItem(CLE_SUIVIS, JSON.stringify(nouveaux));
  return index === -1;
}

/** Notifie l'utilisateur local si (a) il est inscrit au tournoi, ou (b) il a
 * activé les notifications dessus — mock mono-compte : "notifier les
 * participants" se traduit par pousser la notif dans notre propre liste
 * quand l'une de ces deux conditions est vraie. */
export function notifierParticipants(tournoiId: string, titre: string, message: string) {
  if (!estInscrit(tournoiId) && !notifsActivees(tournoiId)) return;
  ajouterNotification(`${titre} — ${message}`, tournoiId);
}
