"use client";

import { Flame } from "lucide-react";

export function BadgeActif() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
      style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
      title="Membre actif : participe régulièrement aux tournois"
    >
      <Flame size={11} strokeWidth={2} />
      Actif
    </span>
  );
}
