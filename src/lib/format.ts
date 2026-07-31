export function formatFcfa(montant: number): string {
  return `${montant.toLocaleString("fr-FR")} FCFA`;
}

export function formatDateFr(date: string): string {
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}
