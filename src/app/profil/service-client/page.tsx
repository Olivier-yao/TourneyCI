"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, CheckCircle2, Mail } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { lireProfil } from "@/lib/mockProfil";
import { creerPlainte } from "@/lib/mockPlaintes";

/** Point 148 : contact sobre pour signaler un problème de sécurité ou
 * autre — envoie un signalement dans l'app (traité dans l'interface
 * administrateur, point 160) plutôt qu'un simple mailto. */
export default function ServiceClientPage() {
  const router = useRouter();
  const [sujet, setSujet] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  function envoyer() {
    if (!sujet.trim() || !description.trim()) {
      setErreur("Renseigne un sujet et une description.");
      return;
    }
    setErreur(null);
    const plainte = creerPlainte(lireProfil().pseudo, sujet, description);
    if (plainte) setEnvoye(true);
  }

  if (envoye) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <CheckCircle2 size={36} style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-base font-medium">Signalement envoyé</p>
        <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          Notre équipe l&apos;examine et te répondra si nécessaire.
        </p>
        <Button variante="secondary" onClick={() => router.push("/profil")}>
          Retour au profil
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Service client" onRetour={() => router.back()} />

      <div className="flex items-start gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <LifeBuoy size={17} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
          Utilise ce formulaire pour signaler un problème de sécurité, un comportement inapproprié, ou toute autre
          question concernant l&apos;application.
        </p>
      </div>

      <Field label="Sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex : compte suspect, bug de paiement..." />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Décris le problème le plus précisément possible."
          className="px-3 py-2.5 text-sm outline-none resize-none"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        />
      </div>
      {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}

      <Button variante="primary" bloc onClick={envoyer}>
        Envoyer le signalement
      </Button>

      <a
        href="mailto:supporttourney.ci.app@gmail.com"
        className="flex items-center justify-center gap-1.5 text-xs"
        style={{ color: "var(--ds-muted)" }}
      >
        <Mail size={12} strokeWidth={2} />
        Ou par email : supporttourney.ci.app@gmail.com
      </a>
    </div>
  );
}
