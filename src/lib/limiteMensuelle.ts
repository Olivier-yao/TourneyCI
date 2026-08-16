/**
 * Point 155 : limite commune "une fois par mois" partagée par le pseudo de
 * profil, le nom d'organisateur, et le nom d'une équipe pré-créée — même
 * calcul de date, appliqué à trois endroits différents.
 */

const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

export function peutModifierMensuel(dernierChangementMs: number | undefined): { ok: boolean; prochainChangementLe?: number } {
  if (!dernierChangementMs) return { ok: true };
  const prochain = dernierChangementMs + TRENTE_JOURS_MS;
  if (Date.now() >= prochain) return { ok: true };
  return { ok: false, prochainChangementLe: prochain };
}
