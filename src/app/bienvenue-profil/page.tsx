"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { PhotoCropper } from "@/components/ds/PhotoCropper";
import { lireProfil, sauvegarderProfil, sauvegarderPhoto } from "@/lib/mockProfil";
import { estConnecte, profilInitialComplet, marquerProfilInitialComplet } from "@/lib/mockAuth";

/** Étape obligatoire après la création de compte (point 142) : pseudo et
 * photo de profil, sans possibilité de passer — condition d'accès à
 * l'accueil, une seule fois par appareil (cf. profilInitialComplet). */
export default function BienvenueProfilPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!estConnecte()) {
      router.replace("/verify");
      return;
    }
    if (profilInitialComplet()) {
      router.replace("/accueil");
      return;
    }
    const profil = lireProfil();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPseudo(profil.pseudo);
    setPret(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function continuer() {
    if (!pseudo.trim()) {
      setErreur("Choisis un pseudo.");
      return;
    }
    if (!photoUrl) {
      setErreur("Ajoute une photo de profil.");
      return;
    }
    setErreur(null);
    sauvegarderProfil({ pseudo: pseudo.trim(), ville: lireProfil().ville });
    sauvegarderPhoto(photoUrl);
    marquerProfilInitialComplet();
    router.push("/accueil");
  }

  if (!pret) return null;

  return (
    <div className="min-h-screen flex flex-col px-6 py-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex flex-col gap-6 mt-8 max-w-sm mx-auto w-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex items-center justify-center w-14 h-14"
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <UserRound size={24} strokeWidth={2} />
          </div>
          <h1
            className="text-2xl leading-tight"
            style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
          >
            Complète ton profil
          </h1>
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Dernière étape avant d&apos;entrer sur Tourney — choisis ton pseudo et ta photo, c&apos;est ce que les
            autres joueurs verront.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <PhotoCropper photoActuelle={photoUrl} onValider={setPhotoUrl} />
          {!photoUrl && (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Photo obligatoire
            </p>
          )}
        </div>

        <Field label="Pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} erreur={erreur ?? undefined} />

        <Button variante="primary" bloc onClick={continuer}>
          Entrer sur Tourney
        </Button>
      </div>
    </div>
  );
}
