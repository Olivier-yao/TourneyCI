"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Heart, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { mesTournoisOrganises } from "@/lib/mockTournaments";
import { estCertifie } from "@/lib/mockOrganisateur";
import { nomOrganisateur, definirNomOrganisateur } from "@/lib/mockOrganisateur";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type EtapeOnboarding = "verification" | "nom" | "complet";

function OnboardingVerification({ onVerifier }: { onVerifier: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
      <ShieldCheck size={28} style={{ color: "var(--ds-accent-300)" }} />
      <div className="text-lg font-medium">Deviens organisateur</div>
      <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
        Avant de pouvoir créer des tournois, vérifie ton identité (pièce officielle) et confirme avoir 18 ans ou plus.
      </p>
      <Button variante="primary" onClick={onVerifier}>
        Vérifier mon identité
        <ArrowRight size={16} strokeWidth={2} />
      </Button>
    </div>
  );
}

function OnboardingNom({ onValide }: { onValide: (nom: string) => void }) {
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function valider() {
    if (!nom.trim()) {
      setErreur("Choisis un nom d'organisateur.");
      return;
    }
    onValide(nom.trim());
  }

  return (
    <div className="flex flex-col gap-3 py-6 px-1">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ds-accent-300)" }}>
        <ShieldCheck size={16} strokeWidth={2} />
        Identité vérifiée
      </div>
      <div className="text-lg font-medium">Choisis ton nom d&apos;organisateur</div>
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Ce nom (différent de ton pseudo joueur) sera affiché sur tous les tournois que tu organises.
      </p>
      <Field label="Nom d'organisateur" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Abidjan Battle Royale" />
      {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
      <Button variante="primary" onClick={valider}>
        Valider et continuer
      </Button>
    </div>
  );
}

export default function OrganisateurPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [tournoisOrganises] = useState(mesTournoisOrganises);
  const [etape, setEtape] = useState<EtapeOnboarding>("complet");
  const [nomOrg, setNomOrg] = useState<string | undefined>(undefined);

  useEffect(() => {
    const certifie = estCertifie();
    const nom = nomOrganisateur();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNomOrg(nom);
    setEtape(!certifie ? "verification" : !nom ? "nom" : "complet");
  }, []);

  if (!connecte) return null;

  if (etape === "verification") {
    return (
      <div className="min-h-screen flex flex-col px-5 pt-4 pb-24 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <OnboardingVerification onVerifier={() => router.push("/verification-identite")} />
        <TabBar />
      </div>
    );
  }

  if (etape === "nom") {
    return (
      <div className="min-h-screen flex flex-col px-5 pt-4 pb-24 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <OnboardingNom
          onValide={(nom) => {
            definirNomOrganisateur(nom);
            setNomOrg(nom);
            setEtape("complet");
          }}
        />
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-4 pb-24 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div>
        <div
          className="text-2xl"
          style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
        >
          Organisateur
        </div>
        {nomOrg && (
          <Link
            href={`/organisateur/profil/${encodeURIComponent(nomOrg)}`}
            className="text-xs mt-0.5 inline-block"
            style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
          >
            {nomOrg} · voir mon profil →
          </Link>
        )}
      </div>

      <Link href="/organisateur/nouveau">
        <Button variante="primary" bloc>
          <Plus size={17} strokeWidth={2} />
          Créer un tournoi
        </Button>
      </Link>

      <Link
        href="/organisateur/classement"
        className="flex items-center justify-between p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
          Classement des organisateurs
        </span>
        <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
      </Link>

      <Link
        href="/coup-de-coeur"
        className="flex items-center justify-between p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
          <Heart size={14} strokeWidth={2} />
          Coup de cœur
        </span>
        <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
      </Link>

      {tournoisOrganises.length === 0 ? (
        <EmptyState titre="Aucun tournoi organisé" description="Crée ton premier tournoi pour le voir apparaître ici." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-base font-medium">Mes tournois</div>
          {tournoisOrganises.map((t) => (
            <Link key={t.id} href={`/tournois/${t.id}`}>
              <div
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.titre}</div>
                  <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <TabBar />
    </div>
  );
}
