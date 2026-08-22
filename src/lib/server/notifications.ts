import type { Prisma } from "@/generated/prisma/client";
import { formaterTempsRelatif } from "@/lib/tournoiFormat";

/** Adapte une ligne Prisma `notifications` (snake_case) vers le type
 * `NotificationApp` (camelCase) déjà utilisé côté UI — cf.
 * src/lib/mockNotifications.ts. */
export function versNotificationJSON(row: Prisma.notificationsGetPayload<object>) {
  return {
    id: row.id,
    texte: row.texte,
    temps: formaterTempsRelatif(row.created_at.getTime()),
    horodatage: row.created_at.getTime(),
    tournoiId: row.tournoi_id ?? undefined,
    lue: !!row.lue_le,
  };
}
