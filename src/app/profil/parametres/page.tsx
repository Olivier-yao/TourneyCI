"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { ThemeProvider } from "@/components/ds/ThemeProvider";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { PhotoCropper } from "@/components/ds/PhotoCropper";
import { lireProfil, sauvegarderProfil, sauvegarderPhoto } from "@/lib/mockProfil";

function ParametresInterne() {
  const router = useRouter();
  const [profil, setProfil] = useState(lireProfil);
  const [enregistre, setEnregistre] = useState(false);

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    sauvegarderProfil({ pseudo: profil.pseudo, ville: profil.ville });
    setEnregistre(true);
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <AppBar retour titre="Réglages" onRetour={() => router.push("/profil")} />

      <div className="flex flex-col gap-8 mt-4 max-w-sm">
        <div className="flex flex-col gap-3">
          <div
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Photo de profil
          </div>
          <PhotoCropper
            photoActuelle={profil.photoUrl}
            onValider={(dataUrl) => {
              sauvegarderPhoto(dataUrl);
              setProfil((p) => ({ ...p, photoUrl: dataUrl }));
            }}
          />
        </div>

        <form onSubmit={enregistrer} className="flex flex-col gap-4">
          <div
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Profil
          </div>
          <Field
            label="Pseudo"
            value={profil.pseudo}
            onChange={(e) => {
              setProfil({ ...profil, pseudo: e.target.value });
              setEnregistre(false);
            }}
          />
          <Field
            label="Ville"
            value={profil.ville}
            onChange={(e) => {
              setProfil({ ...profil, ville: e.target.value });
              setEnregistre(false);
            }}
          />
          <Button variante="primary" type="submit">
            {enregistre ? "Enregistré ✓" : "Enregistrer"}
          </Button>
        </form>

        <div className="flex flex-col gap-3">
          <div
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Apparence
          </div>
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Choisis l&apos;ambiance visuelle de l&apos;app, à tout moment.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export default function ParametresPage() {
  return (
    <ThemeProvider>
      <ParametresInterne />
    </ThemeProvider>
  );
}
