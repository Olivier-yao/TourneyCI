"use client";

import type { ButtonHTMLAttributes } from "react";

type TagProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  actif?: boolean;
};

export function Tag({ actif = false, className = "", style, children, ...props }: TagProps) {
  return (
    <button
      type="button"
      {...props}
      className={`h-8 px-3.5 text-[13px] font-medium transition-colors cursor-pointer ${className}`}
      style={{
        borderRadius: "var(--ds-radius-pill)",
        background: actif ? "var(--ds-accent-900)" : "transparent",
        color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)",
        border: actif ? "1px solid transparent" : "1px solid var(--ds-border)",
        fontFamily: "var(--ds-font-body)",
        transitionDuration: "150ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
