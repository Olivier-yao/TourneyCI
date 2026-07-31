/** Format monétaire du chantier V2 : "2 000 F" (espace fine, symbole F). */
export function formatXof(montant: number): string {
  if (montant === 0) return "Gratuit";
  return `${montant.toLocaleString("fr-FR")} F`;
}
