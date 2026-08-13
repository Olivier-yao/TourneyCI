/** Suivi d'un organisateur (bouton "Suivre" du profil organisateur, design v3
 * · B4) : simple liste locale, indépendante du système d'avis cœur/cœur brisé. */
const CLE_SUIVIS = "tourney-suivis-organisateurs";

function lire(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_SUIVIS);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

export function suisOrganisateur(nom: string): boolean {
  return lire().includes(nom);
}

export function basculerSuiviOrganisateur(nom: string): boolean {
  if (typeof window === "undefined") return false;
  const liste = lire();
  const index = liste.indexOf(nom);
  const nouveaux = index === -1 ? [...liste, nom] : liste.filter((n) => n !== nom);
  localStorage.setItem(CLE_SUIVIS, JSON.stringify(nouveaux));
  return index === -1;
}
