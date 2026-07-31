"use client";

import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevation?: "md" | "lg";
};

export function Card({
  elevation = "md",
  className = "",
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`overflow-hidden ${className}`}
      style={{
        background: "var(--ds-surface)",
        borderRadius: "var(--ds-radius-lg)",
        boxShadow: elevation === "lg" ? "var(--ds-shadow-lg)" : "var(--ds-shadow-md)",
        color: "var(--ds-text)",
        fontFamily: "var(--ds-font-body)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] uppercase tracking-wider"
      style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-xl leading-tight"
      style={{
        fontFamily: "var(--ds-font-heading)",
        fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
      }}
    >
      {children}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
      {children}
    </div>
  );
}

export function CardMeta({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-xs"
      style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
    >
      {children}
    </div>
  );
}
