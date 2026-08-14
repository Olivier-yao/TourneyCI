"use client";

export function Switch({
  actif,
  onChange,
  disabled = false,
  label,
}: {
  actif: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className="relative shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        width: 44,
        height: 26,
        borderRadius: "var(--ds-radius-pill)",
        background: actif ? "var(--ds-accent)" : "var(--ds-surface-2)",
        border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
      }}
    >
      <span
        className="absolute top-1/2 block transition-transform duration-150 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{
          width: 18,
          height: 18,
          borderRadius: "var(--ds-radius-pill)",
          background: "var(--ds-bg)",
          transform: `translate(${actif ? 21 : 3}px, -50%)`,
        }}
      />
    </button>
  );
}
