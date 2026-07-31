"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  aide?: string;
  erreur?: string;
};

export function Field({ label, aide, erreur, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium"
          style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-body)" }}
        >
          {label}
        </label>
      )}
      <Input id={id} erreur={erreur} {...props} />
      {erreur ? (
        <p className="text-xs" style={{ color: "var(--ds-danger)" }}>
          {erreur}
        </p>
      ) : (
        aide && (
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            {aide}
          </p>
        )
      )}
    </div>
  );
}

export function Input({ erreur, className = "", style, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`h-11 px-3.5 text-sm outline-none transition-colors ${className}`}
      style={{
        background: "var(--ds-surface-2)",
        border: `1px solid ${erreur ? "var(--ds-danger)" : "var(--ds-border)"}`,
        borderRadius: "var(--ds-radius-input)",
        color: "var(--ds-text)",
        fontFamily: "var(--ds-font-mono)",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--ds-accent)";
        e.currentTarget.style.outline = "2px solid var(--ds-accent)";
        e.currentTarget.style.outlineOffset = "2px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = erreur
          ? "var(--ds-danger)"
          : "var(--ds-border)";
        e.currentTarget.style.outline = "none";
      }}
    />
  );
}
