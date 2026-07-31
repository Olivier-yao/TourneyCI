"use client";

import { motion } from "motion/react";

export function ProgressBar({ pourcentage }: { pourcentage: number }) {
  const valeur = Math.min(100, Math.max(0, pourcentage));

  return (
    <div
      className="h-1 overflow-hidden"
      style={{ background: "var(--ds-surface-2)", borderRadius: "var(--ds-radius-pill)" }}
    >
      <motion.div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, var(--ds-accent-600), var(--ds-accent-300))`,
          borderRadius: "var(--ds-radius-pill)",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${valeur}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
