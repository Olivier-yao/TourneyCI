/**
 * Formatage pur (aucun accès localStorage/réseau), partagé entre le client
 * (mockTournaments.ts, écran de création) et le serveur
 * (src/lib/server/tournois.ts) : `format`/`dateLabel`/`checkin` n'existent
 * pas comme colonnes dans `tournois` (schéma Postgres introspecté depuis
 * Supabase) — ce sont des libellés dérivés de colonnes réelles (`type`,
 * `equipe_sous_type`, `mode_equipe`, `places_total`, `debut_tournoi_le`,
 * `checkin_le`), calculés ici plutôt que stockés en double.
 */

export function formatDuTournoi(t: {
  type: "1v1" | "equipes" | "battle_royale";
  equipeSousType?: string;
  modeEquipe?: string;
  placesTotal: number;
  /** Best-of par match (1v1/Équipes uniquement) — ex. "BO3". Purement
   * informatif, n'affecte pas la clôture du tournoi (liée à la finale
   * jouée, pas à un compte de manches). */
  manchesParMatch?: number;
}): string {
  const bo = t.manchesParMatch ? ` · BO${t.manchesParMatch}` : "";
  if (t.type === "1v1") return `1v1${bo}`;
  if (t.type === "equipes") {
    const taille = t.equipeSousType ? t.equipeSousType.charAt(0).toUpperCase() + t.equipeSousType.slice(1) : "Équipes";
    return `Équipes · ${taille}${t.modeEquipe === "libre" ? " · libre" : ""}${bo}`;
  }
  return `Battle Royale · ${t.placesTotal} joueurs`;
}

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function heureUtc(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}h${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Abidjan est en GMT toute l'année (pas d'heure d'été) — les heures UTC
 * s'affichent donc telles quelles, sans conversion de fuseau. */
export function formaterDateLabel(ts: number): string {
  const d = new Date(ts);
  return `${JOURS[d.getUTCDay()]} ${heureUtc(ts)} GMT`;
}

export function formaterHeureCheckin(ts: number): string {
  if (Date.now() >= ts) return "Terminé";
  return heureUtc(ts);
}

const MINUTE_MS = 60_000;
const HEURE_MS = 3_600_000;
const JOUR_MS = 86_400_000;

/** Horodatage relatif à l'instant présent (notifications) — recalculé côté
 * serveur à chaque lecture plutôt que stocké, comme les autres libellés de
 * ce fichier. */
export function formaterTempsRelatif(horodatage: number): string {
  const ecoule = Date.now() - horodatage;
  if (ecoule < MINUTE_MS) return "À l'instant";
  if (ecoule < HEURE_MS) return `Il y a ${Math.floor(ecoule / MINUTE_MS)} min`;
  if (ecoule < JOUR_MS) return `Il y a ${Math.floor(ecoule / HEURE_MS)} h`;
  if (ecoule < 2 * JOUR_MS) return "Hier";
  return `Il y a ${Math.floor(ecoule / JOUR_MS)} j`;
}
