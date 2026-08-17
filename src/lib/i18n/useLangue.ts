"use client";

import { useCallback, useEffect, useState } from "react";
import { dictionnaires, LANGUE_DEFAUT, type Langue } from "./dictionnaires";

const CLE_LANGUE = "tourney-langue";
const EVENEMENT_LANGUE = "tourney-langue-changee";

export function langueActuelle(): Langue {
  if (typeof window === "undefined") return LANGUE_DEFAUT;
  return localStorage.getItem(CLE_LANGUE) === "en" ? "en" : LANGUE_DEFAUT;
}

/** Persiste la langue et prévient les autres composants montés (TabBar,
 * etc.) via un évènement custom — pas de Context React ici : la langue doit
 * être lisible depuis n'importe quel composant, y compris ceux qui ne sont
 * jamais enveloppés dans un Provider (ex. TabBar, présente sur presque
 * toutes les pages sans wrapper commun). */
export function definirLangue(langue: Langue) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_LANGUE, langue);
  window.dispatchEvent(new CustomEvent(EVENEMENT_LANGUE));
}

export function useLangue() {
  // Neutre au rendu serveur, synchronisé depuis le localStorage une fois
  // monté côté client — évite un mismatch d'hydratation.
  const [langue, setLangue] = useState<Langue>(LANGUE_DEFAUT);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangue(langueActuelle());
    function surChangement() {
      setLangue(langueActuelle());
    }
    window.addEventListener(EVENEMENT_LANGUE, surChangement);
    return () => window.removeEventListener(EVENEMENT_LANGUE, surChangement);
  }, []);

  const t = useCallback(
    (cle: string) => dictionnaires[langue]?.[cle] ?? dictionnaires[LANGUE_DEFAUT][cle] ?? cle,
    [langue],
  );

  const changerLangue = useCallback((prochaine: Langue) => {
    definirLangue(prochaine);
    setLangue(prochaine);
  }, []);

  return { langue, definirLangue: changerLangue, t };
}
