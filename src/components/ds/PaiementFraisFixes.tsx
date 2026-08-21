"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "./Button";
import { formatXof } from "@/lib/formatXof";
import { lireSolde, debiter } from "@/lib/mockWallet";

/** Paiement bloquant d'un montant fixe (ex: frais de création de tournoi
 * payant, cf. point 34), avant de continuer un flux en cours. Uniquement
 * via TourneyCard — le Mobile Money direct a été retiré des paiements
 * d'inscription, cf. src/app/paiement/[id]/FluxPaiement.tsx. */
export function PaiementFraisFixes({
  montantXof,
  libelle,
  onValide,
  onAnnuler,
}: {
  montantXof: number;
  libelle: string;
  onValide: () => void;
  onAnnuler: () => void;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [soldeCarte, setSoldeCarte] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoldeCarte(lireSolde());
  }, []);

  const soldeInsuffisant = soldeCarte < montantXof;

  function payer(e: React.FormEvent) {
    e.preventDefault();
    const ok = debiter(montantXof, libelle, "inscription");
    if (!ok) {
      setErreur("Solde TourneyCard insuffisant.");
      return;
    }
    setErreur(null);
    onValide();
  }

  return (
    <form onSubmit={payer} className="flex flex-col gap-4">
      <div className="p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)" }}>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
          Montant à payer
        </div>
        <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--ds-font-mono)" }}>
          {formatXof(montantXof)}
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--ds-muted)" }}>{libelle}</div>
      </div>

      <div
        className="flex items-center gap-3 p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: `1px solid ${soldeInsuffisant ? "var(--ds-danger)" : "var(--ds-accent)"}` }}
      >
        <CreditCard size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        <span className="flex-1 text-sm font-medium">TourneyCard</span>
        <span className="text-xs" style={{ color: soldeInsuffisant ? "var(--ds-danger)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {soldeCarte.toLocaleString("fr-FR")} CFA
        </span>
      </div>

      {(erreur || soldeInsuffisant) && (
        <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur ?? "Solde TourneyCard insuffisant."}</p>
      )}

      <div className="flex items-start gap-2 text-xs" style={{ color: "var(--ds-muted)" }}>
        <ShieldCheck size={14} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
        <span>Paiement requis avant la publication du tournoi.</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="flex-1 h-11 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-btn)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Annuler
        </button>
        <div className="flex-[2]">
          <Button variante="primary" bloc type="submit" disabled={soldeInsuffisant}>
            Payer {formatXof(montantXof)}
          </Button>
        </div>
      </div>
    </form>
  );
}
