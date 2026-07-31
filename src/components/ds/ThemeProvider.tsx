"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "nocturne" | "organic" | "voltage" | "wax";
const THEMES: Theme[] = ["nocturne", "organic", "voltage", "wax"];

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Neutre au rendu serveur (même valeur que le layout racine), synchronisé
  // depuis le localStorage une fois monté côté client — évite le mismatch
  // d'hydratation qu'un lazy-initializer lisant localStorage provoquerait.
  const [theme, setThemeState] = useState<Theme>("nocturne");

  useEffect(() => {
    let stocke: string | null = null;
    try {
      stocke = localStorage.getItem("ds-theme");
    } catch {
      // localStorage indisponible : thème par défaut déjà appliqué.
    }
    if (THEMES.includes(stocke as Theme)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stocke as Theme);
    }
  }, []);

  function setTheme(prochain: Theme) {
    setThemeState(prochain);
    document.documentElement.setAttribute("data-theme", prochain);
    try {
      localStorage.setItem("ds-theme", prochain);
    } catch {
      // localStorage indisponible (navigation privée, etc.) : pas bloquant.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme doit être utilisé dans un <ThemeProvider>");
  }
  return ctx;
}
