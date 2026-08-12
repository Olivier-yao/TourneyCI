"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Users, Radio } from "lucide-react";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi } from "@/lib/mockBracket";
import { manchesBR } from "@/lib/mockBattleRoyale";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type Tri = "cashprize" | "participants" | "recent";

const TRIS: { id: Tri; label: string }[] = [
  { id: "cashprize", label: "Cash prize" },
  { id: "participants", label: "Participants" },
  { id: "recent", label: "Récent" },
];

function nomRonde(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Tour ${round}`;
}

/** Nombre de spectateurs simulé, déterministe (pas de vrai suivi d'audience
 * dans ce mock) — stable entre le rendu serveur et client. */
function spectateurs(tournoi: Tournoi): number {
  let h = 0;
  for (let i = 0; i < tournoi.id.length; i++) h = (h * 31 + tournoi.id.charCodeAt(i)) >>> 0;
  return 80 + (h % 400) + tournoi.placesInscrites * 6;
}

function infosDirect(tournoi: Tournoi): { score: string; phase: string } {
  if (tournoi.type === "battle_royale") {
    const nb = manchesBR(tournoi.id).length;
    return { score: nb > 0 ? `Manche ${nb}` : "—", phase: "Battle Royale" };
  }
  const matches = matchsDuTournoi(tournoi.id);
  const enCours = matches.find((m) => m.statut === "en_cours");
  if (enCours) {
    const totalRounds = Math.max(...matches.map((m) => m.round), enCours.round);
    return { score: `${enCours.score1 ?? 0} - ${enCours.score2 ?? 0}`, phase: nomRonde(enCours.round, totalRounds) };
  }
  return { score: "—", phase: tournoi.format };
}

export default function EnDirectPage() {
  const connecte = useExigerConnexion();
  const [tri, setTri] = useState<Tri>("cashprize");

  const enDirect = useMemo(() => {
    const liste = tousLesTournois().filter((t) => t.enDirect);
    if (tri === "cashprize") return [...liste].sort((a, b) => b.cashPrizeXof - a.cashPrizeXof);
    if (tri === "participants") return [...liste].sort((a, b) => b.placesInscrites - a.placesInscrites);
    return [...liste].reverse();
  }, [tri]);

  if (!connecte) return null;

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <Link href="/accueil" style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </Link>
        <div className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          En direct
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
          {TRIS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTri(t.id)}
              className="flex-1 h-8 text-[12px] font-semibold cursor-pointer"
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: tri === t.id ? "var(--ds-accent-900)" : "transparent",
                color: tri === t.id ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {enDirect.length === 0 ? (
          <EmptyState titre="Aucun tournoi en direct" description="Reviens plus tard pour suivre les tournois en cours." />
        ) : (
          <div className="flex flex-col gap-2">
            {enDirect.map((t) => {
              const { score, phase } = infosDirect(t);
              return (
                <Link key={t.id} href={`/tournois/${t.id}`}>
                  <div
                    className="flex items-center gap-3 p-3"
                    style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                  >
                    <LiveBadge />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.titre}</div>
                      <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        <span>{t.jeuLabel}</span>
                        <span>·</span>
                        <span>{phase}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users size={11} strokeWidth={2} />
                          {spectateurs(t)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                        <Radio size={11} strokeWidth={2} />
                        {score}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        {formatXof(t.cashPrizeXof)}
                      </span>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
