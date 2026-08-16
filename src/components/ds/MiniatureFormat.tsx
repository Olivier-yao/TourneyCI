"use client";

import type { TypeCompetition } from "@/lib/mockTournaments";
import { LABEL_UNITE_BR, type SousTypeBR } from "@/lib/mockBattleRoyale";

type EquipeSousType = "duo" | "trio" | "squad";

/** Petites boîtes + traits de connexion représentant un bracket à
 * élimination directe (1v1 ou Équipes) — deux quarts, une demi, une finale. */
function BracketSvg() {
  const boite = (x: number, y: number) => (
    <rect x={x} y={y} width={34} height={12} rx={3} style={{ fill: "var(--ds-surface-2)", stroke: "var(--ds-border)" }} />
  );
  const ligne = (x1: number, y1: number, x2: number, y2: number) => (
    <path d={`M${x1} ${y1} H${x2} V${y2}`} style={{ fill: "none", stroke: "var(--ds-border-strong)" }} strokeWidth={1.5} />
  );
  return (
    <svg viewBox="0 0 160 70" className="w-full h-[70px]">
      {boite(2, 6)}
      {boite(2, 24)}
      {boite(2, 42)}
      {boite(2, 60)}
      {ligne(36, 12, 46, 33)}
      {ligne(36, 30, 46, 33)}
      {ligne(36, 48, 46, 51)}
      {ligne(36, 66, 46, 51)}
      {boite(46, 27)}
      {boite(46, 45)}
      {ligne(80, 33, 92, 42)}
      {ligne(80, 51, 92, 42)}
      <rect x={92} y={36} width={40} height={13} rx={3} style={{ fill: "var(--ds-accent-900)", stroke: "var(--ds-accent)" }} />
      <circle cx={148} cy={42.5} r={7} style={{ fill: "var(--ds-accent-900)", stroke: "var(--ds-accent)" }} />
      <path d="M145 42.5 l2 2.5 l4.5 -5" style={{ fill: "none", stroke: "var(--ds-accent-300)" }} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Petit classement vertical (podium en tête, opacité dégressive) —
 * représentatif d'un classement Battle Royale plutôt qu'un bracket. */
function ClassementSvg() {
  const lignes = [
    { y: 4, w: 132, accent: true },
    { y: 20, w: 116, accent: false },
    { y: 36, w: 100, accent: false },
    { y: 52, w: 84, accent: false },
  ];
  return (
    <svg viewBox="0 0 160 70" className="w-full h-[70px]">
      {lignes.map((l, i) => (
        <g key={i}>
          <rect
            x={2}
            y={l.y}
            width={l.w}
            height={12}
            rx={3}
            style={{
              fill: l.accent ? "var(--ds-accent-900)" : "var(--ds-surface-2)",
              stroke: l.accent ? "var(--ds-accent)" : "var(--ds-border)",
            }}
          />
          <circle cx={11} cy={l.y + 6} r={5} style={{ fill: l.accent ? "var(--ds-accent)" : "var(--ds-border-strong)" }} />
        </g>
      ))}
    </svg>
  );
}

function legendePour(type: TypeCompetition, brSousType?: SousTypeBR, equipeSousType?: EquipeSousType): string {
  if (type === "1v1") {
    return "Élimination directe : chaque duel qualifie un joueur pour le tour suivant, jusqu'à la finale.";
  }
  if (type === "equipes") {
    const taille = equipeSousType ? ` en ${LABEL_UNITE_BR[equipeSousType].nom.toLowerCase()}` : "";
    return `Élimination directe entre équipes${taille} : chaque duel qualifie une équipe pour le tour suivant, jusqu'à la finale.`;
  }
  const nom = LABEL_UNITE_BR[brSousType ?? "solo"].nom.toLowerCase();
  return brSousType && brSousType !== "solo"
    ? `Classement final par ${nom}, du dernier ${brSousType === "squad" ? "groupe" : nom} survivant au premier éliminé.`
    : "Classement final individuel, du dernier survivant au premier éliminé.";
}

export function MiniatureFormat({
  type,
  brSousType,
  equipeSousType,
}: {
  type: TypeCompetition;
  brSousType?: SousTypeBR;
  equipeSousType?: EquipeSousType;
}) {
  const legende = legendePour(type, brSousType, equipeSousType);
  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
    >
      {type === "battle_royale" ? <ClassementSvg /> : <BracketSvg />}
      <p className="text-xs" style={{ color: "var(--ds-muted)" }}>{legende}</p>
    </div>
  );
}
