"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardTitle, CardKicker } from "@/components/ds/Card";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois } from "@/lib/mockTournaments";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type Tri = "cashprize" | "participants" | "recent";

const TRIS: { id: Tri; label: string }[] = [
  { id: "cashprize", label: "Cash prize" },
  { id: "participants", label: "Participants" },
  { id: "recent", label: "Récent" },
];

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

  const vedettes = enDirect.slice(0, 5);
  const reste = enDirect.slice(5);

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
          <>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-5 px-5">
              {vedettes.map((t) => (
                <Link key={t.id} href={`/tournois/${t.id}`} className="shrink-0" style={{ width: 258 }}>
                  <Card>
                    <div className="relative">
                      {t.banniereUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.banniereUrl} alt={t.titre} className="w-full object-cover" style={{ height: 100 }} />
                      ) : (
                        <ImagePlaceholder label="visuel tournoi" hauteur={100} />
                      )}
                      <div className="absolute top-2.5 left-2.5">
                        <LiveBadge />
                      </div>
                      <div
                        className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-1"
                        style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
                      >
                        {tri === "cashprize" ? formatXof(t.cashPrizeXof) : tri === "participants" ? `${t.placesInscrites} joueurs` : "Nouveau"}
                      </div>
                    </div>
                    <div className="p-3.5 flex flex-col gap-1">
                      <CardTitle>{t.titre}</CardTitle>
                      <CardKicker>{t.jeuLabel} · {t.format}</CardKicker>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {reste.length > 0 && (
              <div className="flex flex-col gap-2">
                {reste.map((t) => (
                  <Link key={t.id} href={`/tournois/${t.id}`}>
                    <div className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                      <LiveBadge />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.titre}</div>
                        <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {t.jeuLabel} · {formatXof(t.cashPrizeXof)}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TabBar />
    </div>
  );
}
