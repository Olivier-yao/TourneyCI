"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Splash } from "@/components/ds/Splash";
import { aVuSplash, estOnboarde, marquerSplashVu } from "@/lib/mockAuth";

type Etape = "verification" | "splash";

export function LanceurApp() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("verification");

  useEffect(() => {
    // Lecture volontaire dans un effet : le flag vit en localStorage
    // (indisponible côté serveur), donc l'état initial doit rester neutre
    // pour le rendu serveur et se synchroniser une fois monté côté client,
    // sous peine de mismatch d'hydratation sur le contenu affiché.
    if (aVuSplash()) {
      router.replace("/accueil");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEtape("splash");
    }
  }, [router]);

  function surSplashTermine() {
    marquerSplashVu();
    router.push(estOnboarde() ? "/accueil" : "/onboarding");
  }

  if (etape === "splash") {
    return <Splash pleinEcran onTerminer={surSplashTermine} />;
  }

  return <div style={{ background: "var(--ds-bg)" }} className="min-h-screen" />;
}
