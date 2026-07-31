"use client";

export function ImagePlaceholder({
  label,
  hauteur = 380,
}: {
  label: string;
  hauteur?: number;
}) {
  return (
    <div
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        height: hauteur,
        backgroundImage:
          "repeating-linear-gradient(135deg, var(--ds-surface) 0 12px, var(--ds-surface-2) 12px 24px)",
      }}
    >
      <span
        className="text-[11px] text-center leading-relaxed px-6"
        style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
      >
        {label}
      </span>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(transparent 40%, var(--ds-bg))" }}
      />
    </div>
  );
}
