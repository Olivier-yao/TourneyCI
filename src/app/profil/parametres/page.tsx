"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { ThemeProvider } from "@/components/ds/ThemeProvider";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { PhotoCropper } from "@/components/ds/PhotoCropper";
import { lireProfil, sauvegarderProfil, sauvegarderPhoto } from "@/lib/mockProfil";
import { PAYS } from "@/lib/mockGeographie";
import { deconnecter } from "@/lib/mockAuth";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

const TOUS_LES_LIEUX = PAYS.flatMap((p) => p.villes.flatMap((v) => [v.nom, ...(v.communes ?? [])]));

function ParametresInterne() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [profil, setProfil] = useState(lireProfil);
  const [enregistre, setEnregistre] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    sauvegarderProfil({ pseudo: profil.pseudo, ville: profil.ville });
    setEnregistre(true);
  }

  function seDeconnecter() {
    if (!window.confirm("Te déconnecter de Tourney ?")) return;
    deconnecter();
    setDeconnexionEnCours(true);
    // Navigation complète (pas le routeur client) : décharge tout l'état JS
    // en mémoire et remplace l'entrée d'historique courante par "/", pour
    // qu'un retour arrière ne puisse jamais réafficher une page authentifiée
    // encore montée — chaque page authentifiée revérifie de toute façon la
    // session au montage (garde useExigerConnexion).
    window.location.replace("/");
  }

  if (deconnexionEnCours) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <Loader2 size={26} className="animate-spin" style={{ color: "var(--ds-accent)" }} />
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Déconnexion...</p>
      </div>
    );
  }

  if (!connecte) return null;

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <AppBar retour titre="Réglages" onRetour={() => router.back()} />

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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Ville</label>
            <select
              value={profil.ville}
              onChange={(e) => {
                setProfil({ ...profil, ville: e.target.value });
                setEnregistre(false);
              }}
              className="h-11 px-3.5 text-sm outline-none cursor-pointer"
              style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
            >
              {!TOUS_LES_LIEUX.includes(profil.ville) && <option value={profil.ville}>{profil.ville}</option>}
              {PAYS.map((pays) => (
                <optgroup key={pays.id} label={pays.nom}>
                  {pays.villes.flatMap((ville) => [
                    <option key={ville.nom} value={ville.nom}>{ville.nom}</option>,
                    ...(ville.communes ?? []).map((commune) => (
                      <option key={commune} value={commune}>{`-- ${commune}`}</option>
                    )),
                  ])}
                </optgroup>
              ))}
            </select>
          </div>
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

        <button
          type="button"
          onClick={seDeconnecter}
          className="flex items-center justify-center gap-2 h-11 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-btn)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
        >
          <LogOut size={16} strokeWidth={2} />
          Se déconnecter
        </button>
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
