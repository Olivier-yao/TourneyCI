"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Match } from "@/lib/types";
import { IconTrophee } from "@/components/icons";

type Ligne = { id: string; d: string };

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demi-finale";
  if (round === totalRounds - 2) return "Quart de finale";
  return `Round ${round}`;
}

function NomParticipant({
  id,
  nomsParParticipant,
  estGagnant,
}: {
  id: string | null;
  nomsParParticipant: Record<string, string>;
  estGagnant: boolean;
}) {
  if (!id) {
    return <span className="text-slate-300/50 italic">Bye</span>;
  }
  return (
    <span
      className={
        estGagnant
          ? "font-bold text-white"
          : "text-slate-300"
      }
    >
      {nomsParParticipant[id] ?? "?"}
    </span>
  );
}

function CarteMatch({
  match,
  nomsParParticipant,
  finale,
  refCallback,
}: {
  match: Match;
  nomsParParticipant: Record<string, string>;
  finale: boolean;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const p1Gagnant = !!match.gagnant_id && match.gagnant_id === match.participant1_id;
  const p2Gagnant = !!match.gagnant_id && match.gagnant_id === match.participant2_id;

  return (
    <motion.div
      ref={refCallback}
      data-match-id={match.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={
        "relative rounded-lg border-2 bg-navy-900 shadow-[0_0_0_1px_rgba(45,212,191,0.15)] " +
        (finale
          ? "border-cyan-400 shadow-[0_0_24px_rgba(45,212,191,0.35)] w-64"
          : "border-navy-800 w-56") +
        (match.statut === "en_cours"
          ? " outline outline-2 outline-cyan-400/60"
          : "")
      }
    >
      {match.statut === "en_cours" && (
        <div className="h-1 w-full rounded-t-md bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300" />
      )}
      <div
        className={
          "flex items-center justify-between gap-2 px-3 py-2.5" +
          (p1Gagnant ? " bg-cyan-400/10" : "")
        }
      >
        <NomParticipant
          id={match.participant1_id}
          nomsParParticipant={nomsParParticipant}
          estGagnant={p1Gagnant}
        />
        {match.score1 !== null && (
          <span
            className={
              "shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold " +
              (p1Gagnant
                ? "bg-cyan-400 text-navy-950"
                : "bg-navy-800 text-slate-300")
            }
          >
            {match.score1}
          </span>
        )}
      </div>
      <div className="h-px bg-navy-800" />
      <div
        className={
          "flex items-center justify-between gap-2 px-3 py-2.5" +
          (p2Gagnant ? " bg-cyan-400/10" : "")
        }
      >
        <NomParticipant
          id={match.participant2_id}
          nomsParParticipant={nomsParParticipant}
          estGagnant={p2Gagnant}
        />
        {match.score2 !== null && (
          <span
            className={
              "shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold " +
              (p2Gagnant
                ? "bg-cyan-400 text-navy-950"
                : "bg-navy-800 text-slate-300")
            }
          >
            {match.score2}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function BracketEsport({
  matches,
  nomsParParticipant,
  totalRounds,
}: {
  matches: Match[];
  nomsParParticipant: Record<string, string>;
  totalRounds: number;
}) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const cartesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [dimensions, setDimensions] = useState({ largeur: 0, hauteur: 0 });

  const matchsParRound = new Map<number, Match[]>();
  for (const match of matches) {
    const liste = matchsParRound.get(match.round) ?? [];
    liste.push(match);
    matchsParRound.set(match.round, liste);
  }

  useEffect(() => {
    function mesurer() {
      const conteneur = conteneurRef.current;
      if (!conteneur) return;
      const rectConteneur = conteneur.getBoundingClientRect();

      const nouvellesLignes: Ligne[] = [];

      for (let round = 1; round < totalRounds; round++) {
        const matchsRound = matchsParRound.get(round) ?? [];
        for (const feeder of matchsRound) {
          const positionCible = Math.floor(feeder.position / 2);
          const cible = (matchsParRound.get(round + 1) ?? []).find(
            (m) => m.position === positionCible,
          );
          if (!cible) continue;

          const elFeeder = cartesRef.current.get(feeder.id);
          const elCible = cartesRef.current.get(cible.id);
          if (!elFeeder || !elCible) continue;

          const rFeeder = elFeeder.getBoundingClientRect();
          const rCible = elCible.getBoundingClientRect();

          const x1 = rFeeder.right - rectConteneur.left;
          const y1 = rFeeder.top + rFeeder.height / 2 - rectConteneur.top;
          const x2 = rCible.left - rectConteneur.left;
          const y2 = rCible.top + rCible.height / 2 - rectConteneur.top;
          const midX = x1 + (x2 - x1) / 2;

          nouvellesLignes.push({
            id: `${feeder.id}-${cible.id}`,
            d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
          });
        }
      }

      setLignes(nouvellesLignes);
      setDimensions({
        largeur: conteneur.scrollWidth,
        hauteur: conteneur.scrollHeight,
      });
    }

    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, totalRounds]);

  return (
    <div className="overflow-x-auto pb-4">
      <div
        ref={conteneurRef}
        className="relative flex items-stretch gap-16"
        style={{ width: "max-content" }}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={dimensions.largeur}
          height={dimensions.hauteur}
        >
          {lignes.map((ligne, i) => (
            <motion.path
              key={ligne.id}
              d={ligne.d}
              fill="none"
              stroke="var(--color-cyan-400)"
              strokeWidth={3}
              strokeLinecap="square"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.06, ease: "easeInOut" }}
            />
          ))}
        </svg>

        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
          const estFinale = round === totalRounds;
          return (
            <div
              key={round}
              className="flex flex-col justify-around gap-6 shrink-0"
            >
              <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest text-center">
                {nomRound(round, totalRounds)}
              </h2>
              {estFinale && (
                <div className="flex justify-center -mb-2">
                  <IconTrophee size={24} className="text-cyan-400" />
                </div>
              )}
              <div className="flex flex-1 flex-col justify-around gap-6">
                {(matchsParRound.get(round) ?? []).map((match) => (
                  <CarteMatch
                    key={match.id}
                    match={match}
                    nomsParParticipant={nomsParParticipant}
                    finale={estFinale}
                    refCallback={(el) => {
                      if (el) cartesRef.current.set(match.id, el);
                      else cartesRef.current.delete(match.id);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
