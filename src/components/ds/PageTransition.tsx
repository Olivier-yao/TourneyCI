"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Theme } from "./ThemeProvider";

type Variante = { initial: Record<string, number>; animate: Record<string, number>; transition: Record<string, unknown> };

const VARIANTE_REDUITE: Variante = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.01 },
};

/** Transitions par thème (spec consolidée) :
 * Nocturne = fondu + 8px, Organic = glissement latéral + scale(.98),
 * Voltage = coupe nette sans fondu, Wax = fondu-enchaîné + bandeau 24px.
 * `arriere` inverse le sens pour une navigation retour. */
function creerVariantes(theme: Theme, arriere: boolean): Variante {
  const signe = arriere ? -1 : 1;
  switch (theme) {
    case "organic":
      return {
        initial: { opacity: 0, x: 16 * signe, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
      };
    case "voltage":
      return {
        initial: { opacity: 1, x: 24 * signe },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.12, ease: "linear" },
      };
    case "wax":
      return {
        initial: { opacity: 0, y: -24 * signe },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      };
    case "nocturne":
    default:
      return {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
      };
  }
}

function themeActuel(): Theme {
  if (typeof document === "undefined") return "nocturne";
  const valeur = document.documentElement.getAttribute("data-theme");
  return valeur === "organic" || valeur === "voltage" || valeur === "wax" ? valeur : "nocturne";
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [reduit, setReduit] = useState(false);
  const [arriere, setArriere] = useState(false);
  const naviguationArriere = useRef(false);

  useEffect(() => {
    function surRetour() {
      naviguationArriere.current = true;
    }
    window.addEventListener("popstate", surRetour);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduit(mq.matches);
    const surChangement = (e: MediaQueryListEvent) => setReduit(e.matches);
    mq.addEventListener("change", surChangement);
    return () => {
      window.removeEventListener("popstate", surRetour);
      mq.removeEventListener("change", surChangement);
    };
  }, []);

  useEffect(() => {
    setArriere(naviguationArriere.current);
    naviguationArriere.current = false;
  }, [pathname]);

  const v = reduit ? VARIANTE_REDUITE : creerVariantes(themeActuel(), arriere);

  return (
    <motion.div key={pathname} initial={v.initial} animate={v.animate} transition={v.transition}>
      {children}
    </motion.div>
  );
}
