/**
 * "Soutenir l'organisateur" (point 64) : signal distinct du système de
 * cœur/cœur brisé (mockAvis.ts) — vocabulaire et modèle de données séparés
 * à dessein, aucun lien avec la réputation "équitable/problème". Un seul
 * soutien par organisateur et par compte (contrainte unique en base).
 */

export async function monSoutienPourOrganisateur(organisateur: string): Promise<boolean> {
  const reponse = await fetch(`/api/organisateur/${encodeURIComponent(organisateur)}/soutien`);
  if (!reponse.ok) return false;
  const json = await reponse.json().catch(() => null);
  return Boolean(json?.data?.monSoutien);
}

export async function soutenirOrganisateur(organisateur: string, tournoiId: string): Promise<void> {
  await fetch(`/api/organisateur/${encodeURIComponent(organisateur)}/soutien`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tournoiId }),
  });
}
