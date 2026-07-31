"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { MatchTournoi } from "@/lib/mockBracket";

type Ligne = { id: string; d: string };

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Round ${round}`;
}

function CarteMatch({
  match,
  refCallback,
}: {
  match: MatchTournoi;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const enCours = match.statut === "en_cours";
  const p1Gagnant =
    match.statut === "termine" &&
    (match.score1 ?? 0) > (match.score2 ?? 0);
  const p2Gagnant =
    match.statut === "termine" &&
    (match.score2 ?? 0) > (match.score1 ?? 0);

  const contenu = (
    <div
      ref={refCallback}
      data-match-id={match.id}
      className="w-56 p-2.5 flex flex-col gap-1.5"
      style={{
        borderRadius: "var(--ds-radius-md)",
        background: "var(--ds-surface)",
        border: `1px solid ${enCours ? "var(--ds-accent)" : "var(--ds-border)"}`,
        boxShadow: enCours ? "var(--ds-shadow-md)" : undefined,
      }}
    >
      <div className="flex items-center justify-between text-[13px]">
        <span
          className={p1Gagnant ? "font-semibold" : ""}
          style={{ color: p1Gagnant ? "var(--ds-accent-300)" : "var(--ds-text)" }}
        >
          {match.joueur1 ?? "À définir"}
        </span>
        <span
          className="text-xs"
          style={{ color: enCours ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          {match.score1 ?? "—"}
        </span>
      </div>
      <div className="h-px" style={{ background: "var(--ds-border)" }} />
      <div className="flex items-center justify-between text-[13px]">
        <span
          className={p2Gagnant ? "font-semibold" : ""}
          style={{ color: p2Gagnant ? "var(--ds-accent-300)" : "var(--ds-text)" }}
        >
          {match.joueur2 ?? "À définir"}
        </span>
        <span
          className="text-xs"
          style={{ color: enCours ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          {match.score2 ?? "—"}
        </span>
      </div>
      {enCours && (
        <div
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-300)" }} />
          EN COURS
        </div>
      )}
    </div>
  );

  if (enCours) {
    return <Link href={`/matches/${match.id}`}>{contenu}</Link>;
  }
  return contenu;
}

function CarteVainqueur({ nom, refCallback }: { nom: string | null; refCallback: (el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={refCallback}
      className="w-56 p-3 flex items-center justify-center text-center"
      style={{
        borderRadius: "var(--ds-radius-md)",
        background: nom ? "var(--ds-accent-900)" : "var(--ds-surface)",
        border: `1px solid ${nom ? "var(--ds-accent)" : "var(--ds-border)"}`,
      }}
    >
      <span
        className="text-[15px] font-semibold"
        style={{ color: nom ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
      >
        {nom ?? "À définir"}
      </span>
    </div>
  );
}

export function BracketV2({ matches }: { matches: MatchTournoi[] }) {
  const [filtre, setFiltre] = useState<"top8" | "tout">("top8");
  const conteneurRef = useRef<HTMLDivElement>(null);
  const cartesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const vainqueurRef = useRef<HTMLDivElement | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [dimensions, setDimensions] = useState({ largeur: 0, hauteur: 0 });

  const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const matchsParRound = new Map<number, MatchTournoi[]>();
  for (const m of matches) {
    const liste = matchsParRound.get(m.round) ?? [];
    liste.push(m);
    matchsParRound.set(m.round, liste);
  }

  const finale = (matchsParRound.get(totalRounds) ?? []).find((m) => m.position === 0);
  const nomVainqueur =
    finale && finale.statut === "termine"
      ? (finale.score1 ?? 0) > (finale.score2 ?? 0)
        ? finale.joueur1
        : finale.joueur2
      : null;

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

      if (finale && vainqueurRef.current) {
        const elFinale = cartesRef.current.get(finale.id);
        if (elFinale) {
          const rFinale = elFinale.getBoundingClientRect();
          const rVainqueur = vainqueurRef.current.getBoundingClientRect();
          const x1 = rFinale.right - rectConteneur.left;
          const y1 = rFinale.top + rFinale.height / 2 - rectConteneur.top;
          const x2 = rVainqueur.left - rectConteneur.left;
          const y2 = rVainqueur.top + rVainqueur.height / 2 - rectConteneur.top;
          const midX = x1 + (x2 - x1) / 2;
          nouvellesLignes.push({
            id: `${finale.id}-vainqueur`,
            d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
          });
        }
      }

      setLignes(nouvellesLignes);
      setDimensions({ largeur: conteneur.scrollWidth, hauteur: conteneur.scrollHeight });
    }

    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, totalRounds, filtre]);

  // Le mock ne couvre qu'un bracket à 8 joueurs : "Top 8" et "Tout" sont
  // donc identiques pour l'instant. Le filtre distinguera vraiment les
  // rounds une fois de plus gros brackets disponibles (phase 8).
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div
          className="flex p-[3px] gap-[3px] text-xs"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
        >
          {(["top8", "tout"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className="px-2.5 py-1.5 cursor-pointer transition-colors"
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: filtre === f ? "var(--ds-accent-900)" : "transparent",
                color: filtre === f ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {f === "top8" ? "Top 8" : "Tout"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div
          ref={conteneurRef}
          className="relative flex items-stretch gap-12"
          style={{ width: "max-content" }}
        >
          <svg className="absolute inset-0 pointer-events-none" width={dimensions.largeur} height={dimensions.hauteur}>
            {lignes.map((ligne, i) => (
              <motion.path
                key={ligne.id}
                d={ligne.d}
                fill="none"
                stroke="var(--ds-accent)"
                strokeWidth={2}
                strokeLinecap="square"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
              />
            ))}
          </svg>

          {rounds.map((round) => (
            <div key={round} className="flex flex-col justify-around gap-5 shrink-0">
              <h2
                className="text-xs font-bold uppercase tracking-widest text-center"
                style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-mono)" }}
              >
                {nomRound(round, totalRounds)}
              </h2>
              <div className="flex flex-1 flex-col justify-around gap-5">
                {(matchsParRound.get(round) ?? []).map((match) => (
                  <CarteMatch
                    key={match.id}
                    match={match}
                    refCallback={(el) => {
                      if (el) cartesRef.current.set(match.id, el);
                      else cartesRef.current.delete(match.id);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {finale && (
            <div className="flex flex-col justify-around gap-5 shrink-0">
              <h2
                className="text-xs font-bold uppercase tracking-widest text-center"
                style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-mono)" }}
              >
                Vainqueur
              </h2>
              <div className="flex flex-1 flex-col justify-around gap-5">
                <CarteVainqueur nom={nomVainqueur} refCallback={(el) => (vainqueurRef.current = el)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
