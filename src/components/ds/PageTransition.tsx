"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Theme } from "./ThemeProvider";

type Variante = { initial: Record<string, number>; animate: Record<string, number>; transition: Record<string, unknown> };

/** Transitions cosmétiques par thème : angles vifs et coupe nette pour
 * Voltage, glisse chaleureuse pour Wax, mouvements plus posés pour
 * Nocturne/Organic — cohérent avec la personnalité de chaque direction. */
const VARIANTES: Record<Theme, Variante> = {
  nocturne: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
  organic: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  voltage: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.15, ease: "linear" },
  },
  wax: {
    initial: { opacity: 0, x: 18 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
};

function themeActuel(): Theme {
  if (typeof document === "undefined") return "nocturne";
  const valeur = document.documentElement.getAttribute("data-theme");
  return valeur === "organic" || valeur === "voltage" || valeur === "wax" ? valeur : "nocturne";
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const v = VARIANTES[themeActuel()];

  return (
    <motion.div key={pathname} initial={v.initial} animate={v.animate} transition={v.transition}>
      {children}
    </motion.div>
  );
}
