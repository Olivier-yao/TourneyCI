"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, ChevronRight } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { tousLesTournois, type Tournoi } from "@/lib/mockTournaments";
import { statistiquesReputation } from "@/lib/mockOrganisateur";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type LigneOrganisateur = { nom: string; coeurs: number; coeursBrises: number; tournois: Tournoi[] };

export default function CoupDeCoeurPage() {
  const connecte = useExigerConnexion();
  const [organisateurs, setOrganisateurs] = useState<LigneOrganisateur[]>([]);

  useEffect(() => {
    const tournois = tousLesTournois();
    const parOrganisateur = new Map<string, Tournoi[]>();
    for (const t of tournois) {
      const liste = parOrganisateur.get(t.organisateur) ?? [];
      liste.push(t);
      parOrganisateur.set(t.organisateur, liste);
    }
    const lignes = Array.from(parOrganisateur.entries())
      .map(([nom, tournoisOrg]) => {
        const stats = statistiquesReputation(nom);
        return { nom, coeurs: stats.coeurs, coeursBrises: stats.coeursBrises, tournois: tournoisOrg };
      })
      .filter((l) => l.coeurs > 0)
      .sort((a, b) => b.coeurs - a.coeurs);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateurs(lignes);
  }, []);

  if (!connecte) return null;

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <Link href="/accueil" style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </Link>
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Réputation</div>
          <div className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Coup de cœur
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          Les organisateurs les mieux notés par les participants, à la fin de leurs tournois.
        </p>

        {organisateurs.length === 0 ? (
          <EmptyState titre="Pas encore de coup de cœur" description="Reviens après la fin de quelques tournois notés." />
        ) : (
          organisateurs.map((org) => (
            <div key={org.nom} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{org.nom}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                    <Heart size={12} strokeWidth={2} fill="currentColor" />
                    {org.coeurs}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {org.tournois.slice(0, 3).map((t) => (
                  <Link key={t.id} href={`/tournois/${t.id}`}>
                    <div className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.titre}</div>
                        <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{t.jeuLabel} · {t.dateLabel}</div>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <TabBar />
    </div>
  );
}
