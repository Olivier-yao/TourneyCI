"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TreePine, Trophy, TriangleAlert } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId } from "@/lib/mockTournaments";
import { matchsDuTournoi, libelleRound, evenementsDuMatch, type MatchTournoi, type EvenementMatch } from "@/lib/mockBracket";

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
 * spectateur (pas de mise en scène), et sans aucun outil de gestion.
 * Fidèle au design "Tourney v5 Écrans" (écran H2). */
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
  const [roundLabel, setRoundLabel] = useState("");
  const [inscrits, setInscrits] = useState(0);
  const [evenements, setEvenements] = useState<EvenementMatch[]>([]);

  useEffect(() => {
    async function charger() {
      const matchs = await matchsDuTournoi(tournoiId);
      const totalRounds = matchs.length > 0 ? Math.max(...matchs.map((m) => m.round)) : match.round;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoundLabel(libelleRound(match.round, totalRounds));
      const tournoi = await tournoiParId(tournoiId);
      setInscrits(tournoi?.placesInscrites ?? 0);
    }
    charger();
  }, [tournoiId, match.round]);

  useEffect(() => {
    async function charger() {
      setEvenements(await evenementsDuMatch(match.id));
    }
    charger();
  }, [match.id]);

  const jeSuisJoueur1 = match.joueur1 === monPseudo;
  const jeSuisJoueur2 = match.joueur2 === monPseudo;
  const adversaire = jeSuisJoueur1 ? match.joueur2 : match.joueur1;
  const s1 = match.score1 ?? 0;
  const s2 = match.score2 ?? 0;
  const j1EnTete = s1 > s2;
  const j2EnTete = s2 > s1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] pb-3.5 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
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
            {roundLabel} · en direct
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          aria-label="Voir le bracket"
        >
          <TreePine size={15} strokeWidth={2} />
        </button>
      </div>

      {cEstMonMatch && !matchTermine && (
        <div className="mx-5 mt-3.5 flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
          <Trophy size={19} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium">C&apos;est ton match — bonne chance !</div>
            <div className="mt-0.5 text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              TU JOUES CONTRE {(adversaire ?? "?").toUpperCase()}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-3">
        <div className="flex items-center gap-3 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm, 0 1px 2px rgba(0,0,0,.3))" }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="flex items-center justify-center shrink-0 font-medium text-[11px] overflow-hidden"
              style={{ width: 34, height: 34, borderRadius: "var(--ds-radius-pill)", background: jeSuisJoueur1 ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: jeSuisJoueur1 ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
            >
              {match.joueur1PhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.joueur1PhotoUrl} alt={match.joueur1 ?? ""} className="w-full h-full object-cover" />
              ) : (
                initiales(match.joueur1 ?? "?")
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate">{match.joueur1 ?? "À définir"}</div>
              {jeSuisJoueur1 && (
                <div className="text-[9px]" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>TOI</div>
              )}
            </div>
          </div>
          <div className="text-[22px] shrink-0" style={{ fontFamily: "var(--ds-font-mono)" }}>
            <span style={{ color: j1EnTete || (!j1EnTete && !j2EnTete) ? "var(--ds-text)" : "var(--ds-muted)" }}>{match.score1 ?? "–"}</span>
            <span className="mx-1.5" style={{ color: "var(--ds-border-strong)" }}>—</span>
            <span style={{ color: j2EnTete || (!j1EnTete && !j2EnTete) ? "var(--ds-text)" : "var(--ds-muted)" }}>{match.score2 ?? "–"}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <div className="text-[13px] font-medium truncate">{match.joueur2 ?? "À définir"}</div>
              {jeSuisJoueur2 && (
                <div className="text-[9px]" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>TOI</div>
              )}
            </div>
            <div
              className="flex items-center justify-center shrink-0 font-medium text-[11px] overflow-hidden"
              style={{ width: 34, height: 34, borderRadius: "var(--ds-radius-pill)", background: jeSuisJoueur2 ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: jeSuisJoueur2 ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
            >
              {match.joueur2PhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.joueur2PhotoUrl} alt={match.joueur2 ?? ""} className="w-full h-full object-cover" />
              ) : (
                initiales(match.joueur2 ?? "?")
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex-1 flex flex-col gap-0.5 min-h-0 overflow-hidden">
        <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
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
                <div className="absolute w-1.5 h-1.5 rounded-full" style={{ left: -3, top: 11, background: i === 0 ? "var(--ds-accent-400)" : "var(--ds-border-strong)" }} />
              </div>
              <div className="flex-1 min-w-0 py-1.5 pb-2.5">
                <div className="text-[13px]" style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-text-muted)" }}>{ev.texte}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, paddingBottom: 22 }}>
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}/chat-inscrits`)}
          className={`h-[42px] flex items-center justify-center gap-2 text-[13px] font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Chat des inscrits{inscrits > 0 ? ` · ${inscrits}` : ""}
        </button>

        {cEstMonMatch && !matchTermine && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => router.push(`/matches/${match.id}/litige`)}
              className={`w-[92px] h-[46px] shrink-0 flex items-center justify-center gap-1.5 text-[13px] font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            >
              <TriangleAlert size={13} strokeWidth={2} />
              Litige
            </button>
            <button
              type="button"
              onClick={() => router.push(`/matches/${match.id}/score`)}
              className={`flex-1 h-[46px] text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              Signaler le score
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
