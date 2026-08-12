"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  ouvert,
  titre,
  onFermer,
  children,
}: {
  ouvert: boolean;
  titre: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFermer}
          />
          <motion.div
            className="relative flex flex-col gap-3 w-full sm:max-w-md max-h-[80vh] px-5 pt-4 pb-6"
            style={{
              borderRadius: "var(--ds-radius-lg) var(--ds-radius-lg) 0 0",
              background: "var(--ds-bg)",
              border: "1px solid var(--ds-border)",
              boxShadow: "var(--ds-shadow-lg)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="flex items-center justify-between">
              <div
                className="text-lg"
                style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
              >
                {titre}
              </div>
              <button
                type="button"
                onClick={onFermer}
                className="flex items-center justify-center w-8 h-8 cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                aria-label="Fermer"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)", whiteSpace: "pre-wrap" }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
