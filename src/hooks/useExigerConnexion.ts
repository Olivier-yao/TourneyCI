"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { estConnecte, attendreSession } from "@/lib/mockAuth";

/** Garde d'authentification pour les pages qui ne devraient pas rester
 * accessibles après déconnexion (retour navigateur, lien direct...).
 * Retourne true une fois la vérification passée ; la page appelante doit
 * afficher un état neutre (ou rien) tant que c'est false. */
export function useExigerConnexion(): boolean {
  const router = useRouter();
  const [autorise, setAutorise] = useState(false);

  useEffect(() => {
    async function verifier() {
      await attendreSession();
      if (!estConnecte()) {
        setAutorise(false);
        router.replace("/verify");
        return;
      }
      setAutorise(true);
    }
    verifier();
    // Le bouton retour du navigateur peut restaurer une page depuis son
    // cache (bfcache) sans relancer React : sans cette écoute, une page
    // consultée avant déconnexion réapparaît figée dans son état "connecté".
    function surRestauration(e: PageTransitionEvent) {
      if (e.persisted) verifier();
    }
    window.addEventListener("pageshow", surRestauration);
    return () => window.removeEventListener("pageshow", surRestauration);
  }, [router]);

  return autorise;
}
