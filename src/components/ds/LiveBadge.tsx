"use client";

export function LiveBadge({ texte = "EN DIRECT", pulse = true }: { texte?: string; pulse?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-medium"
      style={{
        borderRadius: "var(--ds-radius-pill)",
        border: `1px solid ${pulse ? "var(--ds-accent)" : "var(--ds-border)"}`,
        color: pulse ? "var(--ds-accent-300)" : "var(--ds-muted)",
        fontFamily: "var(--ds-font-mono)",
      }}
    >
      <span
        className={`w-[5px] h-[5px] rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ background: pulse ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
      />
      {texte}
    </div>
  );
}
