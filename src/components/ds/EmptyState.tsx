"use client";

import { SearchX } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  titre,
  description,
  action,
}: {
  titre: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-6">
      <div
        className="flex items-center justify-center w-14 h-14"
        style={{
          borderRadius: "var(--ds-radius-pill)",
          border: "1px solid var(--ds-border)",
          color: "var(--ds-muted)",
        }}
      >
        <SearchX size={24} strokeWidth={2} />
      </div>
      <div
        className="text-base font-medium"
        style={{ color: "var(--ds-text)", fontFamily: "var(--ds-font-body)" }}
      >
        {titre}
      </div>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
