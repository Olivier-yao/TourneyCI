"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, MessagesSquare } from "lucide-react";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { PRESS } from "@/components/ds/Button";
import { matchsDuTournoi, libelleRound, spectateursDerives, evenementsDuMatch, type MatchTournoi, type EvenementMatch } from "@/lib/mockBracket";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

function Joueur({ nom, enTete, photoUrl }: { nom: string | null; enTete: boolean; photoUrl?: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="flex items-center justify-center shrink-0 font-medium overflow-hidden"
        style={{
          width: 78,
          height: 78,
          borderRadius: "var(--ds-radius-pill)",
          background: enTete ? "var(--ds-accent-800)" : "var(--ds-surface-2)",
          border: `1px solid ${enTete ? "var(--ds-accent)" : "var(--ds-border)"}`,
          color: enTete ? "var(--ds-accent-300)" : "var(--ds-muted)",
          boxShadow: enTete ? "0 0 34px color-mix(in srgb, var(--ds-accent) 30%, transparent)" : undefined,
          fontSize: 24,
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={nom ?? ""} className="w-full h-full object-cover" />
        ) : (
          initiales(nom ?? "?")
        )}
      </div>
      <div className="text-[15px] font-medium text-center">{nom ?? "À définir"}</div>
    </div>
  );
}

/** Vue spectateur : quiconque regarde le match sans y être inscrit. Pure
 * consultation — score, fil du match, chat spectateurs — aucune action de
 * gestion, distincte de la vue participant et de la vue organisateur.
 * Fidèle au design "Tourney v5 Écrans" (écran H1). */
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
  const spectateurs = spectateursDerives(match.id);
  const [roundLabel, setRoundLabel] = useState<string>("");
  const [evenements, setEvenements] = useState<EvenementMatch[]>([]);

  useEffect(() => {
    async function charger() {
      const matchs = await matchsDuTournoi(tournoiId);
      const totalRounds = matchs.length > 0 ? Math.max(...matchs.map((m) => m.round)) : match.round;
       
      setRoundLabel(libelleRound(match.round, totalRounds));
    }
    charger();
  }, [tournoiId, match.round]);

  useEffect(() => {
    async function charger() {
      setEvenements(await evenementsDuMatch(match.id));
    }
    charger();
  }, [match.id]);

  const s1 = match.score1 ?? 0;
  const s2 = match.score2 ?? 0;
  const j1EnTete = s1 > s2;
  const j2EnTete = s2 > s1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div
        className="relative px-5 pt-[42px] pb-[26px] overflow-hidden"
        style={{ background: "radial-gradient(135% 150% at 50% 0%, var(--ds-accent-900), var(--ds-bg) 72%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)", backgroundSize: "24px 100%" }}
        />
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
            className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <LiveBadge />
          <button
            type="button"
            className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
            aria-label="Partager"
          >
            <Share2 size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="relative mt-[30px] grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <Joueur nom={match.joueur1} enTete={j1EnTete} photoUrl={match.joueur1PhotoUrl} />
          <div className="text-center px-1">
            <div className="text-[50px] leading-none" style={{ fontFamily: "var(--ds-font-mono)", color: j1EnTete || (!j1EnTete && !j2EnTete) ? "var(--ds-text)" : "var(--ds-muted)" }}>
              {match.score1 ?? "–"}
            </div>
            <div className="text-[13px] my-0.5" style={{ color: "var(--ds-border-strong)", fontFamily: "var(--ds-font-mono)" }}>—</div>
            <div className="text-[50px] leading-none" style={{ fontFamily: "var(--ds-font-mono)", color: j2EnTete || (!j1EnTete && !j2EnTete) ? "var(--ds-text)" : "var(--ds-muted)" }}>
              {match.score2 ?? "–"}
            </div>
          </div>
          <Joueur nom={match.joueur2} enTete={j2EnTete} photoUrl={match.joueur2PhotoUrl} />
        </div>

        <div className="relative mt-[22px] text-center">
          <div className="text-sm font-medium">{tournoiTitre}</div>
          <div className="mt-[3px] text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {roundLabel}
          </div>
        </div>
      </div>

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <div className="px-5 pt-4 flex-1 flex flex-col gap-0.5 min-h-0 overflow-hidden">
        <div className="text-[10px] tracking-wide uppercase mb-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Fil du match
        </div>
        {evenements.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun événement pour l&apos;instant.
          </p>
        ) : (
          evenements.map((ev, i) => (
            <div key={ev.id} className="flex gap-3">
              <div className="w-[26px] shrink-0 text-right text-[10px] pt-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {new Date(ev.creeLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="relative w-px shrink-0" style={{ background: "var(--ds-border)" }}>
                <div
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ left: -3, top: 11, background: i === 0 ? "var(--ds-accent-400)" : "var(--ds-border-strong)" }}
                />
              </div>
              <div className="flex-1 min-w-0 py-1.5 pb-2.5">
                <div className="text-[13px]" style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-text-muted)" }}>{ev.texte}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5" style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 13, paddingBottom: 22 }}>
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}/chat`)}
          className={`w-full h-12 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          <MessagesSquare size={17} strokeWidth={2} />
          {spectateurs} spectateur{spectateurs > 1 ? "s" : ""} discutent
        </button>
      </div>
    </div>
  );
}
