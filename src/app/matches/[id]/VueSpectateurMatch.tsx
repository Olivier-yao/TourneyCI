"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessagesSquare, ChevronRight } from "lucide-react";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { Avatar } from "@/components/ds/Avatar";
import { PRESS } from "@/components/ds/Button";
import type { MatchTournoi } from "@/lib/mockBracket";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

/** Nombre de spectateurs affiché, dérivé de façon déterministe de l'id du
 * match (pas de vrai compteur temps réel côté mock). */
function spectateursDerives(matchId: string): number {
  let h = 0;
  for (let i = 0; i < matchId.length; i++) h = (h * 31 + matchId.charCodeAt(i)) >>> 0;
  return 40 + (h % 260);
}

/** Vue spectateur : quiconque regarde le match sans y être inscrit. Pure
 * consultation — score, fil du match, chat spectateurs — aucune action de
 * gestion, distincte de la vue participant et de la vue organisateur. */
export function VueSpectateurMatch({
  match,
  tournoiId,
  tournoiTitre,
}: {
  match: MatchTournoi;
  tournoiId: string;
  tournoiTitre: string;
}) {
  const router = useRouter();
  const [minute, setMinute] = useState(match.minute ?? 0);
  const spectateurs = spectateursDerives(match.id);

  useEffect(() => {
    const id = setInterval(() => setMinute((m) => Math.min(m + 1, 90)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div
        className="p-5 flex flex-col gap-4"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, var(--ds-surface), var(--ds-bg))" }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
            className={`flex items-center justify-center w-9 h-9 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            <ArrowLeft size={17} strokeWidth={2} />
          </button>
          <LiveBadge texte={`EN DIRECT · ${minute}'`} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur1 ?? "?")} taille={52} />
            <div className="text-[13px] font-medium text-center">{match.joueur1}</div>
          </div>
          <div className="flex items-baseline gap-2 text-[34px] font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
            <span>{match.score1 ?? "–"}</span>
            <span style={{ color: "var(--ds-muted)", fontSize: 20 }}>:</span>
            <span style={{ color: "var(--ds-accent-300)" }}>{match.score2 ?? "–"}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur2 ?? "?")} taille={52} />
            <div className="text-[13px] font-medium text-center">{match.joueur2}</div>
          </div>
        </div>

        <div className="text-center text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {tournoiTitre} · Quart de finale
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Fil du match
        </div>
        {(match.evenements ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun événement pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {(match.evenements ?? []).map((ev, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-8 text-xs" style={{ color: i === 0 ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {ev.minute}&apos;
                </div>
                <div className="flex-1 text-sm" style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-text-muted)" }}>
                  {ev.texte}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}/chat`)}
          className={`w-full flex items-center gap-3 p-3.5 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          <MessagesSquare size={17} strokeWidth={2} />
          <span className="flex-1 text-[13px] text-left font-medium">
            {spectateurs} spectateur{spectateurs > 1 ? "s" : ""} discutent
          </span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
