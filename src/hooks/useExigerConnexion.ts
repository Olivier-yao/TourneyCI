"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { estConnecte } from "@/lib/mockAuth";

/** Garde d'authentification pour les pages qui ne devraient pas rester
 * accessibles après déconnexion (retour navigateur, lien direct...).
 * Retourne true une fois la vérification passée ; la page appelante doit
 * afficher un état neutre (ou rien) tant que c'est false. */
export function useExigerConnexion(): boolean {
  const router = useRouter();
  const [autorise, setAutorise] = useState(false);

  useEffect(() => {
    if (!estConnecte()) {
      router.replace("/verify");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutorise(true);
  }, [router]);

  return autorise;
}
