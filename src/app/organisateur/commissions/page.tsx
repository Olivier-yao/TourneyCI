"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { formatXof } from "@/lib/formatXof";
import { mesMouvements, type Mouvement } from "@/lib/mockWallet";

/** Détail des commissions de l'organisateur connecté (point 200, drill-down
 * depuis la tuile "Commission" du hub /organisateur) — filtre côté client
 * mesMouvements() (déjà tous les mouvements du compte connecté, pas besoin
 * d'un endpoint dédié : la commission est un mouvement comme un autre,
 * cf. crediterCommissionCloture dans cloture.ts). */
export default function CommissionsOrganisateurPage() {
  const router = useRouter();
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    mesMouvements().then((lus) => {
      setMouvements(lus.filter((m) => m.type === "commission"));
      setPret(true);
    });
  }, []);

  if (!pret) return null;

  const total = mouvements.reduce((somme, m) => somme + m.montantXof, 0);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Historique des commissions" onRetour={() => router.back()} />

      <div className="p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Total cumulé
        </div>
        <div className="mt-1 text-xl" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{formatXof(total)}</div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {mouvements.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucune commission pour l&apos;instant. Elle est créditée à la clôture d&apos;un tournoi payant avec commission activée.
          </p>
        ) : (
          mouvements.map((m) => {
            const ligne = (
              <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                <div className="w-8 h-8 shrink-0 flex items-center justify-center" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}>
                  <Wallet size={15} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{m.libelle}</div>
                  <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{m.dateLabel}</div>
                </div>
                <div className="text-sm shrink-0" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>
                  +{m.montantXof.toLocaleString("fr-FR")}
                </div>
              </div>
            );
            return m.tournoiId ? (
              <Link key={m.id} href={`/tournois/${m.tournoiId}`} className={PRESS}>
                {ligne}
              </Link>
            ) : (
              <div key={m.id}>{ligne}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
