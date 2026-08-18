/**
 * Référentiel géographique (point 71) : structuré Pays -> Villes plutôt
 * qu'une liste de villes à plat, pour que l'app ne soit pas figée sur la
 * Côte d'Ivoire. Purement données statiques tant qu'il n'y a pas de vrai
 * backend (phase 8) : ajouter un pays/une ville se fait ici, sans toucher à
 * la logique des écrans qui consomment ce référentiel.
 *
 * Pas de niveau "commune" sous une ville (retiré) : Abidjan, comme toute
 * autre ville, est une entrée simple — les tournois qui s'y déroulent sont
 * tous rattachés directement à "Abidjan", jamais à un quartier.
 */

export type VilleEntree = { nom: string };
export type Pays = { id: string; nom: string; villes: VilleEntree[] };

/** Point 195 : bibliothèque enrichie (davantage de villes réelles par pays)
 * — chaque liste de villes (et de communes) est déjà triée alphabétiquement
 * ici à la source, pour que tous les sélecteurs qui la consomment (via
 * villesDuPays() ou directement pays.villes) l'affichent triée sans avoir à
 * re-trier à chaque endroit. */
export const PAYS: Pays[] = [
  {
    id: "ci",
    nom: "Côte d'Ivoire",
    villes: [
      { nom: "Abengourou" },
      { nom: "Abidjan" },
      { nom: "Bouaké" },
      { nom: "Daloa" },
      { nom: "Divo" },
      { nom: "Gagnoa" },
      { nom: "Korhogo" },
      { nom: "Man" },
      { nom: "San-Pédro" },
      { nom: "Yamoussoukro" },
    ],
  },
  {
    id: "sn",
    nom: "Sénégal",
    villes: [
      { nom: "Dakar" },
      { nom: "Kaolack" },
      { nom: "Mbour" },
      { nom: "Saint-Louis" },
      { nom: "Thiès" },
      { nom: "Touba" },
      { nom: "Ziguinchor" },
    ],
  },
  {
    id: "ml",
    nom: "Mali",
    villes: [
      { nom: "Bamako" },
      { nom: "Kayes" },
      { nom: "Mopti" },
      { nom: "Ségou" },
      { nom: "Sikasso" },
    ],
  },
  {
    id: "bf",
    nom: "Burkina Faso",
    villes: [
      { nom: "Bobo-Dioulasso" },
      { nom: "Koudougou" },
      { nom: "Ouagadougou" },
    ],
  },
  {
    id: "gh",
    nom: "Ghana",
    villes: [
      { nom: "Accra" },
      { nom: "Cape Coast" },
      { nom: "Kumasi" },
      { nom: "Takoradi" },
      { nom: "Tamale" },
    ],
  },
  {
    id: "tg",
    nom: "Togo",
    villes: [
      { nom: "Kara" },
      { nom: "Lomé" },
      { nom: "Sokodé" },
    ],
  },
  {
    id: "bj",
    nom: "Bénin",
    villes: [
      { nom: "Cotonou" },
      { nom: "Parakou" },
      { nom: "Porto-Novo" },
    ],
  },
  {
    id: "ng",
    nom: "Nigéria",
    villes: [
      { nom: "Abuja" },
      { nom: "Benin City" },
      { nom: "Ibadan" },
      { nom: "Kano" },
      { nom: "Lagos" },
      { nom: "Port Harcourt" },
    ],
  },
  {
    id: "cm",
    nom: "Cameroun",
    villes: [
      { nom: "Bafoussam" },
      { nom: "Douala" },
      { nom: "Garoua" },
      { nom: "Yaoundé" },
    ],
  },
  {
    id: "cd",
    nom: "RD Congo",
    villes: [
      { nom: "Goma" },
      { nom: "Kinshasa" },
      { nom: "Lubumbashi" },
      { nom: "Mbuji-Mayi" },
    ],
  },
  {
    id: "ke",
    nom: "Kenya",
    villes: [
      { nom: "Kisumu" },
      { nom: "Mombasa" },
      { nom: "Nairobi" },
      { nom: "Nakuru" },
    ],
  },
];

export function toutesLesVilles(): string[] {
  return PAYS.flatMap((p) => p.villes.map((v) => v.nom));
}

export function villesDuPays(paysId: string): string[] {
  return (PAYS.find((p) => p.id === paysId)?.villes ?? []).map((v) => v.nom);
}

/** Compare un lieu à une ville de référence — utilisé pour les filtres par
 * ville (classement, etc.). */
export function lieuDansVille(lieu: string, ville: string): boolean {
  return lieu === ville;
}

export function paysDeVille(ville: string): Pays | undefined {
  return PAYS.find((p) => p.villes.some((v) => v.nom === ville));
}
