"use client";

import { useEffect } from "react";

/**
 * next/script "beforeInteractive" ne produit pas de balise <script> exploitable
 * avec Next 16 + Turbopack ici (le script reste piégé dans le flux RSC et ne
 * s'exécute qu'après l'hydratation, trop tard). On applique donc le thème via
 * un effet client classique au montage du layout racine — léger flash possible
 * au tout premier rendu, mais fiable sur chaque rechargement complet.
 */
export function AppliquerTheme() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("ds-theme") || "nocturne";
      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      // localStorage indisponible (navigation privée, etc.) : thème par défaut.
    }
  }, []);

  return null;
}
