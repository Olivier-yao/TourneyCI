/** Format monétaire du chantier V2 : "2 000 CFA" (espace fine, devise CFA). */
export function formatXof(montant: number): string {
  if (montant === 0) return "Gratuit";
  return `${montant.toLocaleString("fr-FR")} CFA`;
}
