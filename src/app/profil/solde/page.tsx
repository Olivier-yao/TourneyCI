"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Ticket, ArrowDownLeft, Gift, RotateCcw } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button } from "@/components/ds/Button";
import { TourneyCard } from "@/components/ds/TourneyCard";
import { lireProfil, type Profil } from "@/lib/mockProfil";
import { lireSolde, mesMouvements, gainsTotal, retraitEnVerification, type Mouvement } from "@/lib/mockWallet";

const ICONE_MOUVEMENT: Record<Mouvement["type"], typeof Trophy> = {
  gain: Trophy,
  commission: Trophy,
  inscription: Ticket,
  recharge: ArrowDownLeft,
  retrait: ArrowDownLeft,
  financement: Gift,
  remboursement: RotateCcw,
};

export default function SoldePage() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [solde, setSolde] = useState(0);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [gains, setGains] = useState(0);
  const [gainsRecents, setGainsRecents] = useState(0);

  useEffect(() => {
    const lus = mesMouvements();
    const seuil = Date.now() - 1000 * 60 * 60 * 24 * 2;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfil(lireProfil());
    setSolde(lireSolde());
    setMouvements(lus);
    setGains(gainsTotal());
    setGainsRecents(
      lus.filter((m) => m.type === "gain" && m.horodatage > seuil).reduce((s, m) => s + m.montantXof, 0),
    );
  }, []);

  if (!profil) return null;

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Solde & TourneyCard" onRetour={() => router.back()} />

      <TourneyCard profil={profil} solde={solde} />

      <div className="flex gap-2.5">
        <Button variante="secondary" bloc onClick={() => router.push("/profil/solde/recharger")}>
          Recharger
        </Button>
        <Button variante="secondary" bloc onClick={() => router.push("/profil/solde/retirer")}>
          Retirer
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Gains totaux
          </div>
          <div className="text-base font-medium" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
            {gains.toLocaleString("fr-FR")} F
          </div>
        </div>
        <div className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Gains récents
          </div>
          <div className="text-base font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
            {gainsRecents.toLocaleString("fr-FR")} F
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Mouvements
        </div>
        {mouvements.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun mouvement pour l&apos;instant.
          </p>
        ) : (
          mouvements.map((m) => {
            const Icone = ICONE_MOUVEMENT[m.type];
            const positif = m.montantXof > 0;
            return (
              <div key={m.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                <div
                  className="w-8 h-8 shrink-0 flex items-center justify-center"
                  style={{ borderRadius: "var(--ds-radius-sm)", background: positif ? "var(--ds-accent-900)" : "var(--ds-surface-2)", color: positif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                >
                  <Icone size={15} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate flex items-center gap-1.5">
                    {m.libelle}
                    {retraitEnVerification(m) && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 shrink-0"
                        style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                      >
                        En vérification
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {m.dateLabel}
                  </div>
                </div>
                <div
                  className="text-sm shrink-0"
                  style={{ fontFamily: "var(--ds-font-mono)", color: positif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                >
                  {positif ? "+" : ""}
                  {m.montantXof.toLocaleString("fr-FR")}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
