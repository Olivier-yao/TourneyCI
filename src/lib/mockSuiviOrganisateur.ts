/** Suivi d'un organisateur (bouton "Suivre" du profil organisateur, design v3
 * · B4) : compteur, liste des followers et masquage volontaire sont tous
 * dérivés de la table suivis_organisateur (jointure) — plus de liste de
 * démo générée, un profil peut simplement avoir 0 follower réel. */

export type InfosSuivi = { suivi: boolean; compte: number; followers: string[]; masque: boolean };

const VIDE: InfosSuivi = { suivi: false, compte: 0, followers: [], masque: false };

export async function infosSuiviOrganisateur(nom: string): Promise<InfosSuivi> {
  const reponse = await fetch(`/api/organisateur/${encodeURIComponent(nom)}/suivi`);
  if (!reponse.ok) return VIDE;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : VIDE;
}

export async function basculerSuiviOrganisateur(nom: string): Promise<{ suivi: boolean; compte: number }> {
  const reponse = await fetch(`/api/organisateur/${encodeURIComponent(nom)}/suivi`, { method: "POST" });
  if (!reponse.ok) return { suivi: false, compte: 0 };
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : { suivi: false, compte: 0 };
}

/** Masque uniquement SON PROPRE compteur (dérivé de la session côté
 * serveur) — jamais celui d'un autre organisateur. */
export async function definirMasquageSuivi(masque: boolean): Promise<void> {
  await fetch("/api/organisateur/profil", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suiviMasque: masque }),
  });
}
