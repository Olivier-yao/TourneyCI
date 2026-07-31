"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Variante = "primary" | "secondary" | "ghost" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  bloc?: boolean;
};

const stylesParVariante: Record<Variante, CSSProperties> = {
  primary: {
    background: "var(--ds-btn-primary-bg)",
    border: "var(--ds-btn-primary-border, 1px solid transparent)",
    color: "var(--ds-btn-primary-text)",
  },
  secondary: {
    background: "transparent",
    border: "1px solid var(--ds-border)",
    color: "var(--ds-muted)",
  },
  ghost: {
    background: "transparent",
    border: "1px solid transparent",
    color: "var(--ds-accent)",
  },
  icon: {
    background: "transparent",
    border: "1px solid var(--ds-border)",
    color: "var(--ds-muted)",
  },
};

export function Button({
  variante = "primary",
  bloc = false,
  className = "",
  style,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const estIcone = variante === "icon";

  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer active:scale-[.98] disabled:opacity-45 disabled:cursor-not-allowed ${
        estIcone ? "h-9 w-9" : "h-[46px] px-5 text-[15px]"
      } ${bloc ? "w-full" : ""} ${className}`}
      style={{
        ...stylesParVariante[variante],
        borderRadius: estIcone ? "var(--ds-radius-md)" : "var(--ds-radius-btn)",
        fontFamily: "var(--ds-font-body)",
        transitionDuration: "120ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
