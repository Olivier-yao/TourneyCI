"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MessagesSquare, Trophy, TriangleAlert } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { Button, PRESS } from "@/components/ds/Button";
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

/** Vue participant : joueur inscrit au tournoi (pas nécessairement dans ce
 * match précis). Infos propres au déroulement du tournoi + chat réservé aux
 * inscrits, et — seulement si c'est son propre match — les actions de
 * signalement de score et de litige. Visuellement plus sobre que la vue
 * spectateur (pas de mise en scène), et sans aucun outil de gestion. */
export function VueParticipantMatch({
  match,
  tournoiId,
  tournoiTitre,
  monPseudo,
}: {
  match: MatchTournoi;
  tournoiId: string;
  tournoiTitre: string;
  monPseudo: string;
}) {
  const router = useRouter();
  const cEstMonMatch = match.joueur1 === monPseudo || match.joueur2 === monPseudo;
  const matchTermine = match.statut === "termine";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate">{tournoiTitre}</div>
          <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Quart de finale · en direct
          </div>
        </div>
      </div>

      {cEstMonMatch && !matchTermine && (
        <div className="mx-5 mt-3.5 flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}>
          <Trophy size={15} strokeWidth={2} />
          <span className="text-[13px] font-medium">C&apos;est ton match — bonne chance !</span>
        </div>
      )}

      <div className="px-5 pt-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur1 ?? "?")} taille={40} />
            <div className="text-[12px] font-medium text-center truncate w-full">{match.joueur1}</div>
          </div>
          <div className="text-2xl font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
            {match.score1 ?? "–"}<span style={{ color: "var(--ds-muted)", fontSize: 14 }}> : </span>{match.score2 ?? "–"}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur2 ?? "?")} taille={40} />
            <div className="text-[12px] font-medium text-center truncate w-full">{match.joueur2}</div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex-1 flex flex-col gap-3">
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

      <div className="px-5 py-4 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}/chat-inscrits`)}
          className={`flex items-center justify-center gap-2 h-11 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <MessagesSquare size={15} strokeWidth={2} />
          Chat des inscrits
        </button>

        {cEstMonMatch && !matchTermine && (
          <div className="flex gap-2.5">
            <Button variante="secondary" onClick={() => router.push(`/matches/${match.id}/litige`)}>
              <TriangleAlert size={14} strokeWidth={2} />
              Litige
            </Button>
            <Button variante="primary" bloc onClick={() => router.push(`/matches/${match.id}/score`)}>
              Signaler le score
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
