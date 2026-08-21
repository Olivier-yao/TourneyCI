"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, CreditCard, ArrowLeft, LockKeyhole } from "lucide-react";
import { Button, PRESS } from "@/components/ds/Button";
import { formatXof } from "@/lib/formatXof";
import { enregistrerInscription } from "@/lib/mockInscriptions";
import { lireSolde, debiter } from "@/lib/mockWallet";
import { marquerPaiementCouvert } from "@/lib/mockEquipesBR";
import type { Tournoi } from "@/lib/mockTournaments";

/** Paiement d'inscription — uniquement via TourneyCard (retrait du Mobile
 * Money direct à l'inscription) : recharger sa carte se fait séparément
 * depuis /profil/solde/recharger, où le numéro Mobile Money est demandé. */
export function FluxPaiement({
  tournoi,
  equipe,
  tag,
  montant,
  equipeId,
}: {
  tournoi: Tournoi;
  equipe?: string;
  tag?: string;
  /** Montant réellement dû pour cette inscription (peut différer des frais
   * unitaires du tournoi quand le chef paie pour toute son équipe). */
  montant?: number;
  /** Présent uniquement quand ce paiement couvre toute une équipe BR (point
   * 56) : marque l'équipe comme "frais déjà payés" une fois le paiement confirmé. */
  equipeId?: string;
}) {
  const router = useRouter();
  const montantDu = montant ?? tournoi.fraisXof;
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [soldeCarte, setSoldeCarte] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoldeCarte(lireSolde());
  }, []);

  const soldeInsuffisant = soldeCarte < montantDu;

  async function inscriptionReussie(): Promise<boolean> {
    const resultat = await enregistrerInscription(tournoi.id, tag, equipe);
    if (!resultat.ok) {
      // De l'argent a déjà été débité (payer() a validé le débit avant
      // d'appeler cette fonction) : on ne peut pas rester silencieux si
      // l'inscription échoue côté serveur (ex. tournoi complet entre-temps).
      setErreur(resultat.erreur ?? "L'inscription a échoué après le paiement. Contacte le service client.");
      return false;
    }
    if (equipeId) marquerPaiementCouvert(equipeId);
    return true;
  }

  async function payer(e: React.FormEvent) {
    e.preventDefault();
    const ok = montantDu === 0 || debiter(montantDu, `Inscription · ${tournoi.titre}`, "inscription", tournoi.id);
    if (!ok) {
      setErreur("Solde TourneyCard insuffisant. Recharge ta carte pour continuer.");
      return;
    }
    setErreur(null);
    if (await inscriptionReussie()) setSucces(true);
  }

  if (succes) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        <CheckCircle2 size={40} style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-lg font-medium">Paiement confirmé</p>
        <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          Ton inscription à {tournoi.titre} est validée. À bientôt sur le terrain !
        </p>
        <Link href="/accueil">
          <Button variante="primary">Retour à l&apos;accueil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.push(`/tournois/${tournoi.id}`)}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div>
          <div className="text-[15px] font-medium">Paiement</div>
          <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Étape 2 sur 3 · sécurisé
          </div>
        </div>
      </div>

      <form onSubmit={payer} className="flex flex-col gap-5 mt-4 max-w-sm">
        <div
          className="p-4"
          style={{
            borderRadius: "var(--ds-radius-lg)",
            background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))",
            boxShadow: "0 0 0 1px var(--ds-accent-700)",
          }}
        >
          <div
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--ds-accent-400)", fontFamily: "var(--ds-font-mono)" }}
          >
            Total à payer
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold" style={{ fontFamily: "var(--ds-font-mono)" }}>
              {montantDu.toLocaleString("fr-FR")}
            </span>
            <span className="text-sm" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>FCFA</span>
          </div>
          <div className="mt-2.5 pt-2.5 flex items-center justify-between text-[12px]" style={{ borderTop: "1px solid var(--ds-border)" }}>
            <span style={{ color: "var(--ds-muted)" }}>{tournoi.titre} · frais inclus</span>
            <span style={{ fontFamily: "var(--ds-font-mono)" }}>{formatXof(montantDu)}</span>
          </div>
          {equipe && (
            <div className="mt-1.5 text-[13px]" style={{ color: "var(--ds-accent-300)" }}>
              Équipe : {equipe}
              {equipeId ? " (paiement pour toute l'équipe)" : ""}
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-3 p-3.5"
          style={{
            borderRadius: "var(--ds-radius-md)",
            background: "var(--ds-surface)",
            border: `1px solid ${soldeInsuffisant ? "var(--ds-danger)" : "var(--ds-accent)"}`,
          }}
        >
          <CreditCard size={18} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          <span className="flex-1 text-sm font-medium">TourneyCard</span>
          <span className="text-xs" style={{ color: soldeInsuffisant ? "var(--ds-danger)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {soldeCarte.toLocaleString("fr-FR")} CFA
          </span>
        </div>

        {soldeInsuffisant ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "var(--ds-danger)" }}>Solde TourneyCard insuffisant pour cette inscription.</p>
            <Link
              href="/profil/solde/recharger"
              className={`h-11 flex items-center justify-center text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-btn)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              Recharger ma TourneyCard
            </Link>
          </div>
        ) : (
          erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>
        )}

        <div
          className="flex items-start gap-2 text-xs"
          style={{ color: "var(--ds-muted)" }}
        >
          <ShieldCheck size={15} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
          <span>Paiement instantané depuis ton solde.</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button variante="primary" bloc type="submit" disabled={soldeInsuffisant}>
            Payer {formatXof(montantDu)}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <LockKeyhole size={11} strokeWidth={2} />
            REMBOURSÉ SI LE TOURNOI EST ANNULÉ
          </p>
        </div>
      </form>
    </div>
  );
}
