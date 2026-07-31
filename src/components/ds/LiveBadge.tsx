"use client";

export function LiveBadge({ texte = "EN DIRECT" }: { texte?: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-medium"
      style={{
        borderRadius: "var(--ds-radius-pill)",
        border: "1px solid var(--ds-accent)",
        color: "var(--ds-accent-300)",
        fontFamily: "var(--ds-font-mono)",
      }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full animate-pulse"
        style={{ background: "var(--ds-accent-300)" }}
      />
      {texte}
    </div>
  );
}
