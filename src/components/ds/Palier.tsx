"use client";

import { Shield, ShieldHalf, ShieldCheck, Star, Medal, Crown, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { DefinitionPalier } from "@/lib/mockProfil";

/** Géométrie hexagonale partagée par les badges de palier et les écussons
 * d'équipe (design v3 · systèmes transverses C1/C2) — même famille visuelle. */
export const CLIP_HEXAGONE = "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)";

const ICONES_PALIER: LucideIcon[] = [Shield, ShieldHalf, ShieldCheck, Star, Medal, Crown];

type SkinPalier = { background: string; border: string; couleur: string; lueur?: string };

/** Un seul jeu de teintes par palier : les deux premiers restent sur les
 * neutres, l'accent n'entre qu'à partir de "Confirmé" et gagne en lueur
 * jusqu'à "Légende" — aucun aplat large, conforme au reste du design system. */
export function skinPalier(id: number): SkinPalier {
  const skins: SkinPalier[] = [
    { background: "transparent", border: "var(--ds-border)", couleur: "var(--ds-muted)" },
    { background: "var(--ds-surface-2)", border: "var(--ds-border)", couleur: "var(--ds-text-muted)" },
    { background: "var(--ds-accent-900)", border: "var(--ds-accent-700)", couleur: "var(--ds-accent-300)" },
    {
      background: "var(--ds-accent-800)",
      border: "var(--ds-accent-700)",
      couleur: "var(--ds-accent-300)",
      lueur: "0 0 0 1px var(--ds-accent-900)",
    },
    {
      background: "var(--ds-accent-800)",
      border: "var(--ds-accent)",
      couleur: "var(--ds-accent-300)",
      lueur: "0 0 20px color-mix(in srgb, var(--ds-accent) 30%, transparent)",
    },
    {
      background: "linear-gradient(var(--ds-accent-700), var(--ds-accent-900))",
      border: "var(--ds-accent-400, var(--ds-accent))",
      couleur: "var(--ds-accent-100, var(--ds-accent-300))",
      lueur: "0 0 26px color-mix(in srgb, var(--ds-accent) 45%, transparent)",
    },
  ];
  return skins[id] ?? skins[0];
}

const TAILLES = {
  sm: { largeur: 15, hauteur: 17, icone: 8 },
  md: { largeur: 26, hauteur: 30, icone: 13 },
  lg: { largeur: 56, hauteur: 62, icone: 24 },
} as const;

export function BadgePalier({ palier, taille = "md" }: { palier: DefinitionPalier; taille?: keyof typeof TAILLES }) {
  const skin = skinPalier(palier.id);
  const Icone = ICONES_PALIER[palier.id] ?? Shield;
  const dims = TAILLES[taille];
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        width: dims.largeur,
        height: dims.hauteur,
        background: skin.background,
        border: `1px solid ${skin.border}`,
        clipPath: CLIP_HEXAGONE,
        boxShadow: skin.lueur,
      }}
      aria-label={palier.nom}
    >
      <Icone size={dims.icone} strokeWidth={2} style={{ color: skin.couleur }} />
    </div>
  );
}

export function EcussonEquipe({
  initiales,
  style = "accent",
  largeur = 46,
  hauteur = 52,
}: {
  initiales: string;
  style?: "accent" | "profond" | "neutre" | "contour";
  largeur?: number;
  hauteur?: number;
}) {
  const skins: Record<typeof style, { background: string; border: string; couleur: string }> = {
    accent: { background: "var(--ds-accent-800)", border: "var(--ds-accent)", couleur: "var(--ds-accent-300)" },
    profond: { background: "var(--ds-accent-900)", border: "var(--ds-accent-700)", couleur: "var(--ds-accent-300)" },
    neutre: { background: "var(--ds-surface-2)", border: "var(--ds-border)", couleur: "var(--ds-muted)" },
    contour: { background: "transparent", border: "var(--ds-border)", couleur: "var(--ds-muted)" },
  };
  const skin = skins[style];
  return (
    <div
      className="shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: largeur,
        height: hauteur,
        background: skin.background,
        border: `1px solid ${skin.border}`,
        clipPath: CLIP_HEXAGONE,
        color: skin.couleur,
        fontFamily: "var(--ds-font-mono)",
        fontSize: largeur * 0.3,
      }}
    >
      {initiales}
    </div>
  );
}

export const STYLES_ECUSSON = ["accent", "profond", "neutre", "contour"] as const;
export type StyleEcusson = (typeof STYLES_ECUSSON)[number];

export const hexagoneStyle: CSSProperties = { clipPath: CLIP_HEXAGONE };
