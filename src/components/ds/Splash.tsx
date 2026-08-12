"use client";

import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const DUREE_TOTALE_S = 2.2;

export function Splash({
  onTerminer,
  pleinEcran = false,
}: {
  onTerminer?: () => void;
  pleinEcran?: boolean;
}) {
  const reduitMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const delaiMs = reduitMotion ? 900 : DUREE_TOTALE_S * 1000;
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
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.3 }}
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
          {/* grille de fond subtile */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(var(--ds-accent) 1px, transparent 1px), linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative flex flex-col items-center gap-7">
            {reduitMotion ? (
              <Marque />
            ) : (
              <>
                <motion.div
                  initial={{ scale: 2.9, opacity: 0, filter: "blur(16px)" }}
                  animate={{ scale: 1.05, opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    animate={{ x: [0, -6, 6, 0], scale: [1.05, 0.99, 1.01, 1] }}
                    transition={{ duration: 0.13, delay: 0.35, times: [0, 0.3, 0.7, 1] }}
                  >
                    <Marque />
                  </motion.div>
                </motion.div>

                {/* copie fantôme, effet glitch */}
                <motion.div
                  className="absolute inset-0 flex flex-col items-center pointer-events-none"
                  style={{ color: "var(--ds-accent-300)" }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.9, 0.6, 0.35, 0],
                    x: [0, -7, 6, -3, 0],
                  }}
                  transition={{ duration: 0.2, delay: 0.42, times: [0, 0.15, 0.4, 0.7, 1] }}
                >
                  <Marque fantome />
                </motion.div>

                {/* balayage lumineux */}
                <motion.div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    height: 140,
                    background:
                      "linear-gradient(180deg, transparent, var(--ds-accent-300), transparent)",
                    opacity: 0.5,
                  }}
                  initial={{ top: "-40%", opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 0.5, delay: 0.55, ease: "easeIn" }}
                />
              </>
            )}

            <motion.div
              initial={reduitMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: reduitMotion ? 0 : 0.6 }}
              className="text-center text-[13px] uppercase"
              style={{
                color: "var(--ds-muted)",
                letterSpacing: "0.18em",
                fontFamily: "var(--ds-font-mono)",
              }}
            >
              Le tournoi commence ici
            </motion.div>
          </div>

          <div className="absolute left-10 right-10 bottom-16">
            <div
              className="h-0.5 overflow-hidden"
              style={{ background: "var(--ds-border)", borderRadius: "var(--ds-radius-pill)" }}
            >
              <motion.div
                className="h-0.5"
                style={{
                  background: "linear-gradient(90deg, var(--ds-accent-600), var(--ds-accent-300))",
                  borderRadius: "var(--ds-radius-pill)",
                }}
                initial={{ width: reduitMotion ? "100%" : "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: reduitMotion ? 0 : 0.7, ease: "easeInOut" }}
              />
            </div>
            <div
              className="mt-3 flex justify-between text-[11px]"
              style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
            >
              <span>Abidjan · CI</span>
              <span>v1.0</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Marque({ fantome = false }: { fantome?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-[52px] h-[52px] grid place-items-center">
        {!fantome && (
          <div
            className="absolute w-11 h-11"
            style={{
              border: "2px solid var(--ds-accent)",
              borderRadius: 6,
              transform: "rotate(45deg)",
              boxShadow: "0 0 24px var(--ds-accent-300)",
            }}
          />
        )}
        {!fantome && (
          <div
            className="absolute w-3.5 h-3.5"
            style={{ background: "var(--ds-accent-300)", borderRadius: 3 }}
          />
        )}
      </div>
      <div
        className="text-4xl"
        style={{
          fontFamily: "var(--ds-font-heading)",
          fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
          letterSpacing: "-0.03em",
          color: fantome ? "var(--ds-accent-300)" : "var(--ds-text)",
        }}
      >
        Tourney
      </div>
    </div>
  );
}
