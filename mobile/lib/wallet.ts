import { apiFetch } from "./api";

/** Solde TourneyCard (portefeuille interne, cf. src/lib/mockWallet.ts) —
 * seul moyen de paiement à l'inscription (le rechargement via Mobile Money
 * simulé reste hors scope mobile pour l'instant, cf. commentaire dans
 * app/tournoi/[id]/paiement.tsx). */
export async function soldeTourneyCard(): Promise<number> {
  const resultat = await apiFetch<{ solde: number }>("/api/wallet");
  return resultat.success ? resultat.data.solde : 0;
}
