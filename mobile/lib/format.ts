/** Même convention que formatXof côté web (src/lib/formatXof.ts). */
export function formatXof(montant: number): string {
  if (montant === 0) return "Gratuit";
  return `${montant.toLocaleString("fr-FR")} CFA`;
}
