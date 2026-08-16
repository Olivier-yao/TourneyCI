"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Check } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { BoutonGoogle } from "@/components/ds/BoutonGoogle";
import {
  marquerConnecte,
  marquerOnboarde,
  definirMotDePasse,
  verifierMotDePasse,
  aUnMotDePasse,
  armerTransitionEntree,
  profilInitialComplet,
} from "@/lib/mockAuth";

/** Point 142 : la première étape après une connexion réussie mène toujours
 * au profil obligatoire tant qu'il n'a pas été complété une fois sur cet
 * appareil, avant d'atteindre l'accueil. */
function destinationApresConnexion(): string {
  return profilInitialComplet() ? "/accueil" : "/bienvenue-profil";
}

const CODE_DEMO = "4821";
const EMAIL_GOOGLE_DEMO = "demo@gmail.com";

function evaluerMotDePasse(mdp: string) {
  return {
    longueur: mdp.length >= 10,
    majuscule: /[A-Z]/.test(mdp),
    chiffre: /[0-9]/.test(mdp),
    special: /[^A-Za-z0-9]/.test(mdp),
  };
}

function IndicateurForce({ mdp }: { mdp: string }) {
  const c = evaluerMotDePasse(mdp);
  const segments = [c.longueur, c.majuscule, c.chiffre, c.special];
  return (
    <div className="flex gap-1.5">
      {segments.map((ok, i) => (
        <div
          key={i}
          className="flex-1 h-1"
          style={{
            borderRadius: "var(--ds-radius-pill)",
            background: ok ? "var(--ds-accent)" : "var(--ds-border)",
          }}
        />
      ))}
    </div>
  );
}

function ChampMotDePasse({
  label,
  valeur,
  onChange,
  erreur,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  erreur?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
        {label}
      </label>
      <div
        className="h-12 px-3.5 flex items-center gap-2"
        style={{
          borderRadius: "var(--ds-radius-input)",
          background: "var(--ds-surface-2)",
          border: `1px solid ${erreur ? "var(--ds-danger)" : "var(--ds-border)"}`,
        }}
      >
        <input
          type={visible ? "text" : "password"}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[15px]"
          style={{ color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)", letterSpacing: "0.05em" }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 cursor-pointer"
          style={{ color: "var(--ds-accent-300)" }}
          aria-label={visible ? "Masquer" : "Afficher"}
        >
          {visible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
        </button>
      </div>
      {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
    </div>
  );
}

function EtapeMotDePasse({ telephone, onValide }: { telephone: string; onValide: () => void }) {
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const c = evaluerMotDePasse(mdp);
  const valide = c.longueur && c.majuscule && c.chiffre && mdp === confirmation && confirmation.length > 0;

  function creer(e: React.FormEvent) {
    e.preventDefault();
    if (!c.longueur) {
      setErreur("10 caractères minimum.");
      return;
    }
    if (!c.majuscule || !c.chiffre) {
      setErreur("Une majuscule et un chiffre sont requis.");
      return;
    }
    if (mdp !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setErreur(null);
    definirMotDePasse(telephone, mdp);
    onValide();
  }

  return (
    <form onSubmit={creer} className="flex flex-col gap-5 mt-4 max-w-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--ds-border)" }}>
          <div className="w-full h-1" style={{ background: "var(--ds-accent)" }} />
        </div>
        <span className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          3/3
        </span>
      </div>

      <div>
        <h1
          className="text-2xl leading-tight"
          style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
        >
          Crée ton mot de passe
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--ds-text-muted)" }}>
          Numéro vérifié : <span style={{ color: "var(--ds-accent-300)", fontWeight: 600 }}>{telephone}</span>. Ce mot
          de passe te servira à te reconnecter, ici ou sur un autre appareil.
        </p>
      </div>

      <ChampMotDePasse label="Mot de passe" valeur={mdp} onChange={setMdp} />
      <IndicateurForce mdp={mdp} />
      <ChampMotDePasse
        label="Confirme le mot de passe"
        valeur={confirmation}
        onChange={setConfirmation}
        erreur={erreur ?? undefined}
      />

      <div
        className="flex flex-col gap-2 p-3.5"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        {[
          { label: "10 caractères ou plus", ok: c.longueur },
          { label: "Une majuscule et un chiffre", ok: c.majuscule && c.chiffre },
          { label: "Un caractère spécial (conseillé)", ok: c.special },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: item.ok ? "var(--ds-text)" : "var(--ds-muted)" }}>
            {item.ok ? (
              <Check size={13} strokeWidth={2.5} style={{ color: "var(--ds-accent)" }} />
            ) : (
              <span className="w-[13px] text-center" style={{ color: "var(--ds-border-strong)" }}>○</span>
            )}
            {item.label}
          </div>
        ))}
      </div>

      <Button variante="primary" bloc type="submit" disabled={!valide}>
        Créer mon compte
      </Button>
    </form>
  );
}

function VerifyInterne() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "connexion" ? "connexion" : "creer";

  const [etape, setEtape] = useState<"telephone" | "code" | "motdepasse">("telephone");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargementGoogle, setChargementGoogle] = useState(false);

  function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    if (telephone.replace(/\D/g, "").length < 8) {
      setErreur("Numéro invalide.");
      return;
    }
    setErreur(null);
    setEtape("code");
  }

  function validerCode(e: React.FormEvent) {
    e.preventDefault();
    if (code !== CODE_DEMO) {
      setErreur("Code incorrect. Réessaie.");
      return;
    }
    setErreur(null);
    setEtape("motdepasse");
  }

  function connexionMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    if (telephone.replace(/\D/g, "").length < 8) {
      setErreur("Numéro invalide.");
      return;
    }
    if (aUnMotDePasse(telephone) && !verifierMotDePasse(telephone, motDePasse)) {
      setErreur("Numéro ou mot de passe incorrect.");
      return;
    }
    if (!aUnMotDePasse(telephone)) {
      setErreur("Aucun compte avec ce numéro. Crée un compte d'abord.");
      return;
    }
    setErreur(null);
    marquerOnboarde();
    marquerConnecte("telephone", telephone);
    armerTransitionEntree();
    router.push(destinationApresConnexion());
  }

  function finInscription() {
    marquerOnboarde();
    marquerConnecte("telephone", telephone);
    armerTransitionEntree();
    router.push(destinationApresConnexion());
  }

  function connexionGoogle() {
    setChargementGoogle(true);
    // Simulation : pas de vraie fenêtre OAuth, juste un délai réaliste.
    setTimeout(() => {
      marquerOnboarde();
      marquerConnecte("google", EMAIL_GOOGLE_DEMO);
      armerTransitionEntree();
      router.push(destinationApresConnexion());
    }, 900);
  }

  if (mode === "creer" && etape === "motdepasse") {
    return (
      <div className="min-h-screen flex flex-col px-6 py-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour onRetour={() => setEtape("code")} titre="Créer mon compte" />
        <EtapeMotDePasse telephone={telephone} onValide={finInscription} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <AppBar
        retour
        onRetour={() => (etape === "code" ? setEtape("telephone") : router.back())}
        titre={
          etape === "telephone"
            ? mode === "creer"
              ? "Créer mon compte"
              : "Se connecter"
            : "Vérification"
        }
      />

      {mode === "connexion" ? (
        <div className="flex flex-col gap-5 mt-8 max-w-sm">
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Connecte-toi avec ton numéro et ton mot de passe.
          </p>
          <form onSubmit={connexionMotDePasse} className="flex flex-col gap-5">
            <Field
              label="Numéro de téléphone"
              placeholder="07 58 42 19 06"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
            <ChampMotDePasse label="Mot de passe" valeur={motDePasse} onChange={setMotDePasse} erreur={erreur ?? undefined} />
            <Button variante="primary" bloc type="submit">
              Se connecter
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
            <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
              ou
            </span>
            <div className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
          </div>

          <BoutonGoogle onClick={connexionGoogle} chargement={chargementGoogle} />
        </div>
      ) : etape === "telephone" ? (
        <div className="flex flex-col gap-5 mt-8 max-w-sm">
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            On t&apos;envoie un code par SMS pour vérifier ton numéro.
          </p>
          <form onSubmit={envoyerCode} className="flex flex-col gap-5">
            <Field
              label="Numéro de téléphone"
              placeholder="07 58 42 19 06"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              erreur={erreur ?? undefined}
            />
            <Button variante="primary" bloc type="submit">
              Envoyer le code
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
            <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
              ou
            </span>
            <div className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
          </div>

          <BoutonGoogle onClick={connexionGoogle} chargement={chargementGoogle} />
        </div>
      ) : (
        <form onSubmit={validerCode} className="flex flex-col gap-5 mt-8 max-w-sm">
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Code envoyé au <span style={{ color: "var(--ds-text)" }}>{telephone}</span>.
          </p>
          <div
            className="flex items-center gap-2.5 px-3.5 py-3 text-xs"
            style={{
              borderRadius: "var(--ds-radius-md)",
              background: "var(--ds-accent-900)",
              color: "var(--ds-accent-300)",
            }}
          >
            <ShieldCheck size={16} strokeWidth={2} className="shrink-0" />
            Mode démo — ton code est {CODE_DEMO}
          </div>
          <Field
            label="Code reçu par SMS"
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            erreur={erreur ?? undefined}
          />
          <Button variante="primary" bloc type="submit">
            Valider
          </Button>
          <button
            type="button"
            onClick={() => setEtape("telephone")}
            className="text-sm text-center cursor-pointer"
            style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-body)" }}
          >
            Changer de numéro
          </button>
        </form>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInterne />
    </Suspense>
  );
}
