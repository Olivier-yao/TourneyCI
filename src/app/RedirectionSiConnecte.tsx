"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { estConnecte, attendreSession } from "@/lib/mockAuth";
import { profilExiste, reglementAccepte, attendreProfil } from "@/lib/mockProfil";

/** Redirige silencieusement un visiteur déjà connecté vers l'app (sans
 * afficher la page d'accueil publique, qui n'a de sens que pour un nouveau
 * visiteur/un visiteur déconnecté) — le contenu statique reste néanmoins le
 * premier rendu de "/", visible sans JS et sans session, contrairement à
 * l'ancien LanceurApp qui redirigeait tout le monde sans exception (Google
 * refusait de valider l'écran de consentement OAuth pour cette raison : une
 * page d'accueil publique doit rester consultable sans connexion). */
export function RedirectionSiConnecte() {
  const router = useRouter();

  useEffect(() => {
    async function verifier() {
      await attendreSession();
      if (!estConnecte()) return;
      await attendreProfil();
      if (!profilExiste()) router.replace("/bienvenue-profil");
      else if (!reglementAccepte()) router.replace("/reglement-interieur");
      else router.replace("/accueil");
    }
    verifier();
  }, [router]);

  return null;
}
