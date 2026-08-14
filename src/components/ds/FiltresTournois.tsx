"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { JEUX, TYPES_JEU, MODES_JEU, type GenreJeu, type ModeJeu } from "@/lib/mockTournaments";

export type FiltresValeur = {
  jeux: string[];
  genres: GenreJeu[];
  modes: ModeJeu[];
  /** Jeu saisi librement (bouton "Autre") quand il n'apparaît pas dans la
   * liste proposée — comparé au libellé du jeu, pas à son id. */
  jeuLibre?: string;
};

export const FILTRES_VIDES: FiltresValeur = { jeux: [], genres: [], modes: [], jeuLibre: undefined };

export function compterFiltresActifs(f: FiltresValeur): number {
  return f.jeux.length + f.genres.length + f.modes.length + (f.jeuLibre?.trim() ? 1 : 0);
}

function bascule<T>(liste: T[], valeur: T): T[] {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}

function Chip({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-3.5 text-xs font-medium cursor-pointer"
      style={{
        borderRadius: "var(--ds-radius-pill)",
        background: actif ? "var(--ds-accent-900)" : "var(--ds-surface)",
        color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)",
        border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
      }}
    >
      {children}
    </button>
  );
}

export function FiltresTournois({
  ouvert,
  valeur,
  resultatsCount,
  onFermer,
  onAppliquer,
}: {
  ouvert: boolean;
  valeur: FiltresValeur;
  resultatsCount: (brouillon: FiltresValeur) => number;
  onFermer: () => void;
  onAppliquer: (v: FiltresValeur) => void;
}) {
  const [brouillon, setBrouillon] = useState<FiltresValeur>(valeur);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ouvert) setBrouillon(valeur);
  }, [ouvert, valeur]);

  return (
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFermer}
          />
          <motion.div
            className="relative flex flex-col gap-4 px-5 pt-3.5 pb-6 max-h-[85vh] overflow-y-auto"
            style={{
              borderRadius: "var(--ds-radius-lg) var(--ds-radius-lg) 0 0",
              background: "var(--ds-bg)",
              boxShadow: "var(--ds-shadow-lg)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="w-11 h-1 rounded-full mx-auto" style={{ background: "var(--ds-border)" }} />

            <div className="flex items-center justify-between">
              <div
                className="text-[22px]"
                style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
              >
                Filtres
              </div>
              <button
                type="button"
                onClick={() => setBrouillon(FILTRES_VIDES)}
                className="text-sm font-medium cursor-pointer"
                style={{ color: "var(--ds-muted)" }}
              >
                Tout effacer
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Jeu
              </div>
              <div className="flex flex-wrap gap-1.5">
                {JEUX.map((j) => (
                  <Chip key={j.id} actif={brouillon.jeux.includes(j.id)} onClick={() => setBrouillon((b) => ({ ...b, jeux: bascule(b.jeux, j.id) }))}>
                    {j.label}
                  </Chip>
                ))}
                <Chip
                  actif={brouillon.jeuLibre !== undefined}
                  onClick={() => setBrouillon((b) => ({ ...b, jeuLibre: b.jeuLibre === undefined ? "" : undefined }))}
                >
                  Autre
                </Chip>
              </div>
              {brouillon.jeuLibre !== undefined && (
                <input
                  autoFocus
                  value={brouillon.jeuLibre}
                  onChange={(e) => setBrouillon((b) => ({ ...b, jeuLibre: e.target.value }))}
                  placeholder="Nom du jeu recherché"
                  className="h-10 px-3 text-sm outline-none"
                  style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Type de jeu
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TYPES_JEU.map((genre) => (
                  <Chip key={genre} actif={brouillon.genres.includes(genre)} onClick={() => setBrouillon((b) => ({ ...b, genres: bascule(b.genres, genre) }))}>
                    {genre}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Mode de jeu
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODES_JEU.map((mode) => (
                  <Chip key={mode} actif={brouillon.modes.includes(mode)} onClick={() => setBrouillon((b) => ({ ...b, modes: bascule(b.modes, mode) }))}>
                    {mode}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3" style={{ borderTop: "1px solid var(--ds-border)" }}>
              <button
                type="button"
                onClick={onFermer}
                className="flex-1 h-11 text-sm font-medium cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-btn)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onAppliquer(brouillon);
                  onFermer();
                }}
                className="flex-[2] h-11 text-sm font-medium cursor-pointer"
                style={{
                  borderRadius: "var(--ds-radius-btn)",
                  background: "var(--ds-btn-primary-bg)",
                  border: "var(--ds-btn-primary-border, 1px solid transparent)",
                  color: "var(--ds-btn-primary-text)",
                }}
              >
                Voir les résultats · {resultatsCount(brouillon)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
