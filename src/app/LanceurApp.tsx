"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Splash } from "@/components/ds/Splash";
import { estConnecte, estOnboarde, profilInitialComplet, reglementAccepte, attendreSession } from "@/lib/mockAuth";

export function LanceurApp() {
  const router = useRouter();
  const [destination, setDestination] = useState("");

  useEffect(() => {
    // Écran de lancement natif : s'affiche à chaque ouverture (pas seulement
    // la première fois), d'où la lecture volontaire dans un effet — le flag
    // vit en localStorage, indisponible côté serveur.
    attendreSession().then(() => {
      setDestination(estConnecte() ? "vers l'accueil" : "vers la connexion");
    });
  }, []);

  async function surSplashTermine() {
    await attendreSession();
    if (estConnecte()) {
      if (!profilInitialComplet()) {
        router.push("/bienvenue-profil");
      } else if (!reglementAccepte()) {
        router.push("/reglement-interieur");
      } else {
        router.push("/accueil");
      }
    } else {
      router.push(estOnboarde() ? "/verify" : "/onboarding");
    }
  }

  return <Splash pleinEcran onTerminer={surSplashTermine} destinationLabel={destination} />;
}
