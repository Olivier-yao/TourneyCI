/** Cache mémoire très court, par instance serverless (pas de Redis sur ce
 * projet) — même principe que le cache déjà en place sur GET /api/tournois
 * (liste non filtrée), généralisé pour être réutilisable par clé. Réduit le
 * nombre de connexions Postgres simultanées quand beaucoup de visiteurs
 * lisent la même ressource en même temps (ex. tous les spectateurs d'un
 * match qui devient viral) — un test de charge a montré la fiche tournoi
 * saturer le pool de connexions dès ~150 requêtes concurrentes. */
const magasin = new Map<string, { expireA: number; valeur: unknown }>();

export async function cacheCourt<T>(cle: string, dureeMs: number, fabrique: () => Promise<T>): Promise<T> {
  const entree = magasin.get(cle);
  if (entree && entree.expireA > Date.now()) return entree.valeur as T;
  const valeur = await fabrique();
  magasin.set(cle, { expireA: Date.now() + dureeMs, valeur });
  return valeur;
}
