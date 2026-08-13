/**
 * Référentiel géographique (point 71) : structuré Pays -> Villes plutôt
 * qu'une liste de villes à plat, pour que l'app ne soit pas figée sur la
 * Côte d'Ivoire. Purement données statiques tant qu'il n'y a pas de vrai
 * backend (phase 8) : ajouter un pays/une ville se fait ici, sans toucher à
 * la logique des écrans qui consomment ce référentiel.
 */

export type Pays = { id: string; nom: string; villes: string[] };

export const PAYS: Pays[] = [
  { id: "ci", nom: "Côte d'Ivoire", villes: ["Abidjan", "Bouaké", "Yamoussoukro", "Cocody", "Yopougon"] },
  { id: "sn", nom: "Sénégal", villes: ["Dakar", "Thiès"] },
  { id: "ml", nom: "Mali", villes: ["Bamako"] },
  { id: "bf", nom: "Burkina Faso", villes: ["Ouagadougou"] },
  { id: "gh", nom: "Ghana", villes: ["Accra", "Kumasi"] },
  { id: "tg", nom: "Togo", villes: ["Lomé"] },
  { id: "bj", nom: "Bénin", villes: ["Cotonou"] },
  { id: "ng", nom: "Nigéria", villes: ["Lagos", "Abuja"] },
  { id: "cm", nom: "Cameroun", villes: ["Douala", "Yaoundé"] },
  { id: "cd", nom: "RD Congo", villes: ["Kinshasa"] },
  { id: "ke", nom: "Kenya", villes: ["Nairobi"] },
];

export function toutesLesVilles(): string[] {
  return PAYS.flatMap((p) => p.villes);
}

export function villesDuPays(paysId: string): string[] {
  return PAYS.find((p) => p.id === paysId)?.villes ?? [];
}

export function paysDeVille(ville: string): Pays | undefined {
  return PAYS.find((p) => p.villes.includes(ville));
}
