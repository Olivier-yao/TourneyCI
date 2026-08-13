"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Variante = "primary" | "secondary" | "ghost" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  bloc?: boolean;
};

/** Micro-interaction de clic réutilisable (léger effet d'échelle au press,
 * cohérent avec la direction Nocturne) : à appliquer aux boutons bruts qui ne
 * passent pas par ce composant (icônes, contrôles segmentés...). */
export const PRESS = "cursor-pointer transition-transform duration-150 ease-out active:scale-[.96]";

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
      className={`inline-flex items-center justify-center gap-2 font-medium transition-[background-color,color,transform] ${PRESS} disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${
        estIcone ? "h-9 w-9" : "h-[46px] px-5 text-[15px]"
      } ${bloc ? "w-full" : ""} ${className}`}
      style={{
        ...stylesParVariante[variante],
        borderRadius: estIcone ? "var(--ds-radius-md)" : "var(--ds-radius-btn)",
        fontFamily: "var(--ds-font-body)",
        transitionDuration: "150ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
