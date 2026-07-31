"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AppBar({
  titre,
  retour = false,
  onRetour,
  actions,
}: {
  titre: string;
  retour?: boolean;
  onRetour?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 h-14 px-1">
      {retour && (
        <button
          type="button"
          onClick={onRetour}
          disabled={!onRetour}
          className="flex items-center justify-center w-9 h-9 shrink-0 cursor-pointer disabled:cursor-default"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
      )}
      <div
        className="flex-1 text-base font-medium truncate"
        style={{ color: "var(--ds-text)", fontFamily: "var(--ds-font-body)" }}
      >
        {titre}
      </div>
      {actions}
    </div>
  );
}
