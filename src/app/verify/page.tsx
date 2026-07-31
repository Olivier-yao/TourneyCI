"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { BoutonGoogle } from "@/components/ds/BoutonGoogle";
import { marquerConnecte, marquerOnboarde } from "@/lib/mockAuth";

const CODE_DEMO = "4821";
const EMAIL_GOOGLE_DEMO = "demo@gmail.com";

function VerifyInterne() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "connexion" ? "connexion" : "creer";

  const [etape, setEtape] = useState<"telephone" | "code">("telephone");
  const [telephone, setTelephone] = useState("");
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
    marquerOnboarde();
    marquerConnecte("telephone", telephone);
    router.push("/");
  }

  function connexionGoogle() {
    setChargementGoogle(true);
    // Simulation : pas de vraie fenêtre OAuth, juste un délai réaliste.
    setTimeout(() => {
      marquerOnboarde();
      marquerConnecte("google", EMAIL_GOOGLE_DEMO);
      router.push("/");
    }, 900);
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

      {etape === "telephone" ? (
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
