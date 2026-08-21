"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { PhotoCropper } from "@/components/ds/PhotoCropper";
import { lireProfil, sauvegarderProfil, sauvegarderPhoto, pseudoDisponible, suggererPseudosDisponibles, attendreProfil, profilExiste, reglementAccepte } from "@/lib/mockProfil";
import { estConnecte, attendreSession } from "@/lib/mockAuth";
import { PAYS, villesDuPays, paysDeVille } from "@/lib/mockGeographie";

/** Étape obligatoire après la création de compte (points 142, 154) : pseudo
 * (unique), pays, ville et photo de profil, sans possibilité de passer —
 * condition d'accès à l'accueil, jusqu'à ce qu'une ligne existe côté serveur
 * (cf. profilExiste() dans mockProfil.ts) — pas un flag par appareil. */
export default function BienvenueProfilPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [paysId, setPaysId] = useState(PAYS[0].id);
  const [ville, setVille] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    async function verifier() {
      await attendreSession();
      if (!estConnecte()) {
        router.replace("/verify");
        return;
      }
      await attendreProfil();
      if (profilExiste()) {
        router.replace(reglementAccepte() ? "/accueil" : "/reglement-interieur");
        return;
      }
      const profil = lireProfil();
      const paysActuel = paysDeVille(profil.ville);
      setPseudo(profil.pseudo);
      setPaysId(paysActuel?.id ?? PAYS[0].id);
      setVille(profil.ville || villesDuPays(paysActuel?.id ?? PAYS[0].id)[0]);
      setPret(true);
    }
    verifier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const villesDisponibles = villesDuPays(paysId);

  async function continuer() {
    const pseudoSaisi = pseudo.trim();
    if (!pseudoSaisi) {
      setErreur("Choisis un pseudo.");
      setSuggestions([]);
      return;
    }
    if (!pseudoDisponible(pseudoSaisi)) {
      setErreur("Ce pseudo est déjà pris.");
      setSuggestions(suggererPseudosDisponibles(pseudoSaisi));
      return;
    }
    if (!ville) {
      setErreur("Choisis ta ville.");
      setSuggestions([]);
      return;
    }
    if (!photoUrl) {
      setErreur("Ajoute une photo de profil.");
      setSuggestions([]);
      return;
    }
    setErreur(null);
    setSuggestions([]);
    setEnregistrement(true);
    try {
      const resultatProfil = await sauvegarderProfil({ pseudo: pseudoSaisi, ville });
      if (!resultatProfil.ok) {
        setEnregistrement(false);
        setErreur(resultatProfil.erreur ?? "Ce pseudo est déjà pris.");
        setSuggestions(suggererPseudosDisponibles(pseudoSaisi));
        return;
      }
      const resultatPhoto = await sauvegarderPhoto(photoUrl);
      if (!resultatPhoto.ok) {
        setEnregistrement(false);
        setErreur(resultatPhoto.erreur ?? "Erreur lors de l'enregistrement de la photo.");
        return;
      }
    } catch {
      setEnregistrement(false);
      setErreur("Erreur de connexion. Réessaie.");
      return;
    }
    // Point 190 : replace (pas push) — sinon la sortie d'un écran de
    // passage obligatoire ajoute une entrée d'historique orpheline, et le
    // bouton retour finit par boucler entre deux écrans au lieu de remonter
    // jusqu'à l'écran réellement précédent.
    router.replace(reglementAccepte() ? "/accueil" : "/reglement-interieur");
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
            Dernière étape avant d&apos;entrer sur Tourney — c&apos;est ce que les autres joueurs verront.
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

        <Field
          label="Pseudo"
          value={pseudo}
          onChange={(e) => {
            setPseudo(e.target.value);
            setSuggestions([]);
          }}
          erreur={erreur ?? undefined}
        />

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-1.5 -mt-3">
            <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Disponibles :</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPseudo(s);
                    setSuggestions([]);
                    setErreur(null);
                  }}
                  className="px-3 py-1.5 text-sm cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Pays</label>
          <select
            value={paysId}
            onChange={(e) => {
              setPaysId(e.target.value);
              setVille(villesDuPays(e.target.value)[0] ?? "");
            }}
            className="h-11 px-3.5 text-sm outline-none cursor-pointer"
            style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
          >
            {PAYS.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Ville</label>
          <select
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="h-11 px-3.5 text-sm outline-none cursor-pointer"
            style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
          >
            {villesDisponibles.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <Button variante="primary" bloc onClick={continuer} disabled={enregistrement}>
          {enregistrement ? "Enregistrement..." : "Entrer sur Tourney"}
        </Button>
      </div>
    </div>
  );
}
