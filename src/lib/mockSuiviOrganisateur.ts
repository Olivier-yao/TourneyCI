import { cleCompte } from "./mockAuth";

/** Suivi d'un organisateur (bouton "Suivre" du profil organisateur, design v3
 * · B4) : simple liste locale, indépendante du système d'avis cœur/cœur brisé. */
const CLE_SUIVIS = "tourney-suivis-organisateurs";

function lire(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(cleCompte(CLE_SUIVIS));
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
  localStorage.setItem(cleCompte(CLE_SUIVIS), JSON.stringify(nouveaux));
  return index === -1;
}

/**
 * Followers (point 78) : mock mono-appareil — seul le suivi de CET appareil
 * est un vrai signal ; le reste de la liste est généré de façon déterministe
 * à partir du nom de l'organisateur (même principe que les statistiques d'un
 * autre joueur ailleurs dans l'app), pour donner un compteur crédible en
 * l'absence de vrais comptes multi-utilisateurs.
 */
const NOMS_DEMO = [
  "Aya K.", "Sory D.", "Ismaël T.", "Malik K.", "Fatou T.", "Gohou", "Halima", "Nour",
  "Zeka", "Petit", "Delta", "Yao M.", "Traoré", "Bamba", "Kouassi", "Adjoua",
];

function hashSeed(valeur: string): number {
  let h = 0;
  for (let i = 0; i < valeur.length; i++) h = (h * 31 + valeur.charCodeAt(i)) >>> 0;
  return h;
}

function followersDemo(organisateur: string): string[] {
  const h = hashSeed(organisateur);
  const total = 3 + (h % 9);
  const noms = new Set<string>();
  for (let i = 0; noms.size < total && i < NOMS_DEMO.length * 2; i++) {
    noms.add(NOMS_DEMO[(h + i * 7) % NOMS_DEMO.length]);
  }
  return Array.from(noms);
}

export function compteurFollowers(organisateur: string): number {
  return followersDemo(organisateur).length + (suisOrganisateur(organisateur) ? 1 : 0);
}

export function listeFollowers(organisateur: string): string[] {
  const demo = followersDemo(organisateur);
  return suisOrganisateur(organisateur) ? [...demo, "Toi"] : demo;
}

const CLE_MASQUE_SUIVI = "tourney-masque-suivi-organisateur";

// Pas de cleCompte() ici : ce masquage est un réglage PUBLIC de l'organisateur
// consulté par n'importe quel visiteur de son profil (organisateur/profil/[nom]),
// pas un état propre au compte qui consulte — il doit rester partagé.
function lireMasques(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_MASQUE_SUIVI);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

/** L'organisateur peut masquer publiquement SON PROPRE compteur de followers
 * (le nombre reste calculé en interne, juste pas affiché aux visiteurs). */
export function suiviMasque(organisateur: string): boolean {
  return lireMasques().includes(organisateur);
}

export function definirMasquageSuivi(organisateur: string, masque: boolean) {
  if (typeof window === "undefined") return;
  const tout = lireMasques();
  const nouveaux = masque ? Array.from(new Set([...tout, organisateur])) : tout.filter((o) => o !== organisateur);
  localStorage.setItem(CLE_MASQUE_SUIVI, JSON.stringify(nouveaux));
}
