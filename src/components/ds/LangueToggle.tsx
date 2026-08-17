"use client";

import { LANGUES } from "@/lib/i18n/dictionnaires";
import { useLangue } from "@/lib/i18n/useLangue";

/** Point 204 : sélecteur de langue de l'écran Paramètres — même gabarit que
 * ThemeToggle (grille de boutons), branché sur le dictionnaire i18n plutôt
 * que sur du texte en dur. */
export function LangueToggle() {
  const { langue, definirLangue } = useLangue();

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
      {LANGUES.map((option) => {
        const actif = langue === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => definirLangue(option.id)}
            className="flex items-center justify-center p-3 text-sm font-medium transition-colors cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-md)",
              border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
              background: actif ? "var(--ds-accent-900)" : "var(--ds-surface)",
              color: actif ? "var(--ds-accent-300)" : "var(--ds-text)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
