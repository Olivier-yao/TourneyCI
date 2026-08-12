"use client";

import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const DUREE_TOTALE_S = 1.8;

export function Splash({
  onTerminer,
  pleinEcran = false,
  destinationLabel = "",
}: {
  onTerminer?: () => void;
  pleinEcran?: boolean;
  destinationLabel?: string;
}) {
  const reduitMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const delaiMs = reduitMotion ? 700 : DUREE_TOTALE_S * 1000;
    const id = setTimeout(() => {
      setVisible(false);
      onTerminer?.();
    }, delaiMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduitMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={
            pleinEcran
              ? "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
              : "relative flex flex-col items-center justify-center overflow-hidden"
          }
          style={
            pleinEcran
              ? {
                  background:
                    "radial-gradient(120% 80% at 50% 0%, var(--ds-surface) 0%, var(--ds-bg) 62%)",
                }
              : {
                  width: 360,
                  height: 760,
                  borderRadius: 34,
                  background:
                    "radial-gradient(120% 80% at 50% 0%, var(--ds-surface) 0%, var(--ds-bg) 62%)",
                  boxShadow: "var(--ds-shadow-lg)",
                }
          }
        >
          <div className="relative flex flex-col items-center gap-6">
            {reduitMotion ? (
              <Marque />
            ) : (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Marque animee />
              </motion.div>
            )}

            <motion.div
              initial={reduitMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reduitMotion ? 0 : 0.35 }}
              className="text-center text-[12px] uppercase"
              style={{
                color: "var(--ds-muted)",
                letterSpacing: "0.2em",
                fontFamily: "var(--ds-font-mono)",
              }}
            >
              Le tournoi commence ici
            </motion.div>
          </div>

          <div className="absolute left-[38px] right-[38px] bottom-[58px]">
            <div
              className="h-1 overflow-hidden"
              style={{ background: "var(--ds-border)", borderRadius: "var(--ds-radius-pill)" }}
            >
              <motion.div
                className="h-1"
                style={{ background: "var(--ds-accent)", borderRadius: "var(--ds-radius-pill)" }}
                initial={{ width: reduitMotion ? "100%" : "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: reduitMotion ? 0 : DUREE_TOTALE_S, ease: "easeInOut" }}
              />
            </div>
            <div
              className="mt-[11px] flex justify-between text-[11px]"
              style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
            >
              <span>1,8 s</span>
              {destinationLabel && <span>{destinationLabel}</span>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Marque({ animee = false }: { animee?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className="relative w-[74px] h-[74px] grid place-items-center"
        style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-accent-900)" }}
        animate={
          animee
            ? { boxShadow: ["0 0 0px var(--ds-accent-300)", "0 0 28px var(--ds-accent-300)", "0 0 14px var(--ds-accent-300)"] }
            : undefined
        }
        transition={animee ? { duration: 0.7, delay: 0.15, ease: "easeOut" } : undefined}
      >
        <div
          className="w-[34px] h-[34px]"
          style={{
            transform: "rotate(45deg)",
            borderRadius: 6,
            background: "var(--ds-accent-300)",
          }}
        />
      </motion.div>
      <div
        className="flex items-baseline text-[42px]"
        style={{
          fontFamily: "var(--ds-font-heading)",
          fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
          letterSpacing: "-0.02em",
          color: "var(--ds-text)",
        }}
      >
        <span>Tourn</span>
        <span style={{ color: "var(--ds-accent)" }}>ey</span>
      </div>
    </div>
  );
}
