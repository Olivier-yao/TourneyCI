"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: "nocturne", label: "Nocturne", description: "Sombre · blurple" },
  { value: "organic", label: "Organic", description: "Clair · terracotta" },
  { value: "voltage", label: "Voltage", description: "Noir · lime électrique" },
  { value: "wax", label: "Wax", description: "Indigo · or & brique" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
      {OPTIONS.map((option) => {
        const actif = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className="flex flex-col items-start gap-0.5 p-3 text-left transition-colors cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-md)",
              border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
              background: actif ? "var(--ds-accent-900)" : "var(--ds-surface)",
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-text)", fontFamily: "var(--ds-font-body)" }}
            >
              {option.label}
            </span>
            <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
