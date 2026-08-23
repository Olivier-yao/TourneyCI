"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { ThemeProvider } from "@/components/ds/ThemeProvider";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { PhotoCropper } from "@/components/ds/PhotoCropper";
import { useLangue } from "@/lib/i18n/useLangue";
import { lireProfil, sauvegarderProfil, sauvegarderPhoto, pseudoDisponible, suggererPseudosDisponibles, attendreProfil } from "@/lib/mockProfil";
import { PAYS, paysDeVille } from "@/lib/mockGeographie";
import { deconnecter } from "@/lib/mockAuth";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

function ParametresInterne() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [profil, setProfil] = useState(lireProfil);
  const [pseudoOriginal, setPseudoOriginal] = useState(() => lireProfil().pseudo);
  const [paysId, setPaysId] = useState(() => paysDeVille(lireProfil().ville)?.id ?? PAYS[0].id);
  const [enregistre, setEnregistre] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurPseudo, setErreurPseudo] = useState<string | null>(null);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const { t } = useLangue();

  useEffect(() => {
    // lireProfil() est synchrone (cache), mais la réponse de /api/profil peut
    // arriver après ce premier rendu — on resynchronise une fois garantie.
    attendreProfil().then(() => {
      const frais = lireProfil();
      setProfil(frais);
      setPseudoOriginal(frais.pseudo);
      setPaysId(paysDeVille(frais.ville)?.id ?? PAYS[0].id);
    });
  }, []);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    const pseudoSaisi = profil.pseudo.trim();
    const pseudoChange = pseudoSaisi !== pseudoOriginal;

    if (pseudoChange && !(await pseudoDisponible(pseudoSaisi))) {
      setErreurPseudo("Ce pseudo est déjà pris.");
      setSuggestions(await suggererPseudosDisponibles(pseudoSaisi));
      return;
    }

    setErreurPseudo(null);
    setSuggestions([]);
    setEnregistrement(true);
    const resultat = await sauvegarderProfil({ pseudo: pseudoSaisi, ville: profil.ville });
    setEnregistrement(false);
    if (!resultat.ok) {
      if (resultat.prochainChangementLe) {
        setErreurPseudo(`Tu pourras changer de pseudo à nouveau le ${new Date(resultat.prochainChangementLe).toLocaleDateString("fr-FR")}.`);
      } else {
        setErreurPseudo(resultat.erreur ?? "Ce pseudo est déjà pris.");
        setSuggestions(await suggererPseudosDisponibles(pseudoSaisi));
      }
      return;
    }
    setPseudoOriginal(pseudoSaisi);
    setEnregistre(true);
  }

  async function seDeconnecter() {
    if (!window.confirm("Te déconnecter de Tourney ?")) return;
    setDeconnexionEnCours(true);
    await deconnecter();
    // Navigation complète (pas le routeur client) : décharge tout l'état JS
    // en mémoire et remplace l'entrée d'historique courante, pour qu'un
    // retour arrière ne puisse jamais réafficher une page authentifiée
    // encore montée — chaque page authentifiée revérifie de toute façon la
    // session au montage (garde useExigerConnexion). On renvoie vers le tout
    // premier écran (carrousel + connexion/inscription), pas directement
    // vers /verify : estOnboarde() reste vrai après déconnexion (persistant),
    // donc / redirigerait sinon tout droit sur /verify en sautant l'accueil.
    window.location.replace("/onboarding");
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
      <AppBar retour titre={t("parametres.titre")} onRetour={() => router.back()} />

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
            onValider={async (dataUrl) => {
              setErreurPhoto(null);
              const resultat = await sauvegarderPhoto(dataUrl);
              if (!resultat.ok) {
                setErreurPhoto(resultat.erreur ?? "Erreur lors de l'enregistrement de la photo.");
                return;
              }
              setProfil((p) => ({ ...p, photoUrl: dataUrl }));
            }}
          />
          {erreurPhoto && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreurPhoto}</p>}
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
              setErreurPseudo(null);
              setSuggestions([]);
            }}
            erreur={erreurPseudo ?? undefined}
          />
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-1.5 -mt-2">
              <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Disponibles :</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setProfil({ ...profil, pseudo: s });
                      setSuggestions([]);
                      setErreurPseudo(null);
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
          <p className="text-xs -mt-2" style={{ color: "var(--ds-muted)" }}>
            Modifiable une fois par mois.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Pays</label>
            <select
              value={paysId}
              onChange={(e) => {
                const nouveauPaysId = e.target.value;
                const nouveauPays = PAYS.find((p) => p.id === nouveauPaysId);
                setPaysId(nouveauPaysId);
                setProfil({ ...profil, ville: nouveauPays?.villes[0]?.nom ?? "" });
                setEnregistre(false);
              }}
              className="h-11 px-3.5 text-sm outline-none cursor-pointer"
              style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
            >
              {PAYS.map((pays) => (
                <option key={pays.id} value={pays.id}>{pays.nom}</option>
              ))}
            </select>
          </div>
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
              {(() => {
                const villesDuPaysActuel = PAYS.find((p) => p.id === paysId)?.villes ?? [];
                const lieuConnu = villesDuPaysActuel.some((v) => v.nom === profil.ville);
                return (
                  <>
                    {!lieuConnu && <option value={profil.ville}>{profil.ville}</option>}
                    {villesDuPaysActuel.map((ville) => (
                      <option key={ville.nom} value={ville.nom}>{ville.nom}</option>
                    ))}
                  </>
                );
              })()}
            </select>
          </div>
          <Button variante="primary" type="submit" disabled={enregistrement}>
            {enregistrement ? "Enregistrement..." : enregistre ? "Enregistré ✓" : "Enregistrer"}
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
