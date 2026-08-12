"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

const COLONNES = 5;
const LIGNES = 10;
const FENETRE_S = 2;

export function CubeTransition({ onTermine }: { onTermine?: () => void }) {
  const reduitMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  // Générés dans un effet plutôt qu'au rendu : Math.random() est impur, et un
  // tableau vide au tout premier rendu ne change rien visuellement (les
  // tuiles apparaissent dès le rendu suivant, imperceptible).
  const [delais, setDelais] = useState<number[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDelais(Array.from({ length: COLONNES * LIGNES }, () => Math.random() * FENETRE_S));
  }, []);

  useEffect(() => {
    const dureeMs = reduitMotion ? 200 : (FENETRE_S + 0.25) * 1000;
    const id = setTimeout(() => {
      setVisible(false);
      onTermine?.();
    }, dureeMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduitMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {reduitMotion ? (
            <motion.div
              className="absolute inset-0"
              style={{ background: "var(--ds-bg)" }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          ) : (
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${COLONNES}, 1fr)`, gridTemplateRows: `repeat(${LIGNES}, 1fr)` }}
            >
              {delais.map((delai, i) => (
                <motion.div
                  key={i}
                  style={{ background: "var(--ds-bg)", border: "1px solid var(--ds-accent)" }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: delai, duration: 0.18, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
