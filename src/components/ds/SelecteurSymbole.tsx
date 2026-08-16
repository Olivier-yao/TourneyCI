"use client";

import { Check } from "lucide-react";
import { SYMBOLES_TOURNOI } from "@/lib/mockSymboles";

export function SelecteurSymbole({
  symboleId,
  onChange,
}: {
  symboleId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SYMBOLES_TOURNOI.map((s) => {
        const actif = s.id === symboleId;
        const Icone = s.icone;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className="relative flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-md)",
              background: actif ? "var(--ds-accent-900)" : "var(--ds-surface)",
              border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
            }}
          >
            <Icone size={20} strokeWidth={2} style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)" }} />
            <span className="text-[9px] text-center leading-tight px-1" style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}>
              {s.label}
            </span>
            {actif && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center w-3.5 h-3.5"
                style={{ borderRadius: "999px", background: "var(--ds-accent)" }}
              >
                <Check size={9} strokeWidth={3} style={{ color: "var(--ds-bg)" }} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
