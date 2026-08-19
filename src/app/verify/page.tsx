"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, MailCheck } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { BoutonGoogle } from "@/components/ds/BoutonGoogle";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import {
  marquerOnboarde,
  armerTransitionEntree,
  reglementAccepte,
  attendreSession,
  estConnecte,
} from "@/lib/mockAuth";
import { profilExiste, attendreProfil } from "@/lib/mockProfil";

/** Points 142 et 147 : après une connexion réussie, deux étapes obligatoires
 * (profil puis règlement intérieur) tant qu'elles n'ont pas été complétées,
 * avant d'atteindre l'accueil. */
async function destinationApresConnexion(): Promise<string> {
  await attendreProfil();
  if (!profilExiste()) return "/bienvenue-profil";
  if (!reglementAccepte()) return "/reglement-interieur";
  return "/accueil";
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Traduit les messages Supabase Auth les plus courants — le reste passe
 * tel quel (déjà en anglais neutre, rare en usage normal). */
function traduireErreur(message: string): string {
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/user already registered/i.test(message)) return "Un compte existe déjà avec cet e-mail — connecte-toi plutôt.";
  if (/password should be at least/i.test(message)) return "Mot de passe trop court (6 caractères minimum côté serveur).";
  if (/rate limit/i.test(message)) return "Trop de tentatives — réessaie dans quelques minutes.";
  return message;
}

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

function VerifyInterne() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "connexion" ? "connexion" : "creer";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargementGoogle, setChargementGoogle] = useState(false);
  const [chargementForm, setChargementForm] = useState(false);
  const [emailAConfirmer, setEmailAConfirmer] = useState(false);
  const [verificationInitiale, setVerificationInitiale] = useState(false);

  const c = evaluerMotDePasse(motDePasse);

  async function terminer() {
    marquerOnboarde();
    armerTransitionEntree();
    router.push(await destinationApresConnexion());
  }

  useEffect(() => {
    // Retour du callback OAuth Google, ou session déjà active (onglet
    // rouvert sur /verify alors que connecté) : on saute directement le
    // formulaire plutôt que de le montrer inutilement.
    attendreSession().then(() => {
      if (estConnecte()) {
        void terminer();
        return;
      }
      setVerificationInitiale(true);
      if (searchParams.get("erreur") === "oauth") {
        setErreur("La connexion Google a échoué. Réessaie.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function creerCompte(e: React.FormEvent) {
    e.preventDefault();
    if (!REGEX_EMAIL.test(email.trim())) {
      setErreur("Adresse e-mail invalide.");
      return;
    }
    if (!c.longueur) {
      setErreur("10 caractères minimum.");
      return;
    }
    if (!c.majuscule || !c.chiffre) {
      setErreur("Une majuscule et un chiffre sont requis.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setErreur(null);
    setChargementForm(true);
    const supabase = creerClientSupabaseNavigateur();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: motDePasse,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setChargementForm(false);
    if (error) {
      setErreur(traduireErreur(error.message));
      return;
    }
    if (data.session) {
      await terminer();
      return;
    }
    // Confirmation par e-mail activée côté Supabase : pas de session tant
    // que le lien reçu par mail n'est pas cliqué.
    setEmailAConfirmer(true);
  }

  async function connexionEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!REGEX_EMAIL.test(email.trim())) {
      setErreur("Adresse e-mail invalide.");
      return;
    }
    setErreur(null);
    setChargementForm(true);
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
    setChargementForm(false);
    if (error) {
      setErreur(traduireErreur(error.message));
      return;
    }
    await terminer();
  }

  async function connexionGoogle() {
    setChargementGoogle(true);
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Sans ça, Google reconnecte en silence le compte deja actif sur
        // l'appareil/navigateur au lieu de demander lequel choisir - source
        // de confusion si plusieurs comptes Google existent (telephone vs
        // PC, comptes pro/perso...), donnant l'impression a tort de creer
        // un "nouveau compte" alors que c'est juste un Gmail different.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setChargementGoogle(false);
      setErreur(traduireErreur(error.message));
      return;
    }
    // Sinon : navigation complète vers Google en cours, cette page va se
    // décharger — pas besoin de retirer le chargement.
  }

  if (!verificationInitiale) return null;

  if (emailAConfirmer) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        <MailCheck size={32} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-base font-medium">Vérifie ta boîte mail</p>
        <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          Un lien de confirmation a été envoyé à {email.trim()}. Clique dessus pour activer ton compte.
        </p>
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
        onRetour={() => router.replace("/onboarding")}
        titre={mode === "creer" ? "Créer mon compte" : "Se connecter"}
      />

      <div className="flex flex-col gap-5 mt-8 max-w-sm">
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          {mode === "creer"
            ? "Crée ton compte avec Google en un clic, ou avec ton e-mail et un mot de passe."
            : "Connecte-toi avec Google, ou avec ton e-mail et ton mot de passe."}
        </p>

        <BoutonGoogle onClick={connexionGoogle} chargement={chargementGoogle} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
          <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
            ou
          </span>
          <div className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
        </div>

        {mode === "creer" ? (
          <form onSubmit={creerCompte} className="flex flex-col gap-5">
            <Field
              type="email"
              label="Adresse e-mail"
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erreur={erreur ?? undefined}
            />
            <ChampMotDePasse label="Mot de passe" valeur={motDePasse} onChange={setMotDePasse} />
            <IndicateurForce mdp={motDePasse} />
            <ChampMotDePasse label="Confirme le mot de passe" valeur={confirmation} onChange={setConfirmation} />

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

            <Button variante="primary" bloc type="submit" disabled={chargementForm}>
              {chargementForm ? "Création en cours…" : "Créer mon compte"}
            </Button>
          </form>
        ) : (
          <form onSubmit={connexionEmail} className="flex flex-col gap-5">
            <Field
              type="email"
              label="Adresse e-mail"
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ChampMotDePasse label="Mot de passe" valeur={motDePasse} onChange={setMotDePasse} erreur={erreur ?? undefined} />
            <Button variante="primary" bloc type="submit" disabled={chargementForm}>
              {chargementForm ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>
        )}
      </div>
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
