"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Heart, ShieldCheck, IdCard, AtSign, Lock } from "lucide-react";
import { Button, PRESS } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { hexagoneStyle } from "@/components/ds/Palier";
import { mesTournoisOrganises, COMMISSION_PCT, type Tournoi } from "@/lib/mockTournaments";
import { estCertifie } from "@/lib/mockOrganisateur";
import { nomOrganisateur, definirNomOrganisateur } from "@/lib/mockOrganisateur";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type EtapeOnboarding = "nom" | "complet";

function LigneEtape({ n, titre, meta, actuelle, faite }: { n: number; titre: string; meta: string; actuelle: boolean; faite: boolean }) {
  return (
    <div
      className="flex items-center gap-3 p-3.5"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: actuelle ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)" }}
    >
      <div
        className="w-[30px] h-[30px] flex items-center justify-center shrink-0 text-xs"
        style={{ borderRadius: "var(--ds-radius-pill)", background: actuelle ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: actuelle ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
      >
        {n}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: actuelle ? "var(--ds-text)" : "var(--ds-muted)" }}>{titre}</div>
        <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{meta}</div>
      </div>
      {faite ? (
        <ShieldCheck size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
      ) : actuelle ? (
        <IdCard size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
      ) : (
        <AtSign size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
      )}
    </div>
  );
}

function OnboardingOrganisateur({ certifie, onVerifier, onValideNom }: { certifie: boolean; onVerifier: () => void; onValideNom: (nom: string) => void }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function valider() {
    if (!nom.trim()) {
      setErreur("Choisis un nom d'organisateur.");
      return;
    }
    onValideNom(nom.trim());
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "var(--ds-bg)" }}>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, var(--ds-accent-900) 0%, var(--ds-bg) 58%)" }}
      />
      <div className="relative flex-1 flex flex-col px-5 pt-6 pb-24 gap-3">
        <div className="text-[10px] uppercase tracking-wide text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Devenir organisateur
        </div>

        <div className="flex justify-center py-2">
          <div
            className="flex items-center justify-center"
            style={{ ...hexagoneStyle, width: 92, height: 102, background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 44px color-mix(in srgb, var(--ds-accent) 26%, transparent)" }}
          >
            <ShieldCheck size={38} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          </div>
        </div>

        <div>
          <div className="text-2xl leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Deviens organisateur
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            Choisis ton nom public pour commencer — la certification (CNI + selfie) reste optionnelle pour l&apos;instant, elle ne débloque que les tournois payants et ta commission de {Math.round(COMMISSION_PCT * 100)} %.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <button type="button" onClick={onVerifier} className={`block w-full text-left ${PRESS}`} disabled={certifie}>
            <LigneEtape n={1} titre="Vérification d'identité" meta="CNI RECTO/VERSO + SELFIE · FACULTATIF" actuelle={false} faite={certifie} />
          </button>
          <LigneEtape n={2} titre="Choix du nom d'organisateur" meta="NOM PUBLIC · MODIFIABLE UNE FOIS" actuelle={true} faite={false} />
        </div>

        <div className="flex flex-col gap-2.5 mt-1">
          <Field label="Nom d'organisateur" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Abidjan Battle Royale" />
          {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
        </div>

        <div className="mt-auto p-3.5 flex items-start gap-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-border)" }}>
          <Lock size={17} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent-400, var(--ds-accent))" }} />
          <div>
            <div className="text-sm font-medium">Tournois gratuits dès maintenant</div>
            <p className="mt-0.5 text-xs" style={{ color: "var(--ds-text-muted)" }}>
              Tu peux organiser sans attendre la validation ; seuls les tournois payants demandent la certification.
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-6 flex gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className={`flex-1 h-[46px] text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={valider}
          className={`flex-[2] h-[46px] text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          Valider et continuer
        </button>
      </div>
    </div>
  );
}

export default function OrganisateurPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [tournoisOrganises, setTournoisOrganises] = useState<Tournoi[]>([]);
  const [etape, setEtape] = useState<EtapeOnboarding>("complet");
  const [nomOrg, setNomOrg] = useState<string | undefined>(undefined);
  const [certifie, setCertifie] = useState(false);

  useEffect(() => {
    // État dépendant du localStorage : liste vide au premier rendu serveur,
    // synchronisée côté client une fois montée (évite un mismatch d'hydratation).
    const estCert = estCertifie();
    const nom = nomOrganisateur();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCertifie(estCert);
    setNomOrg(nom);
    setEtape(!nom ? "nom" : "complet");
    setTournoisOrganises(mesTournoisOrganises());
  }, []);

  if (!connecte) return null;

  if (etape === "nom") {
    return (
      <OnboardingOrganisateur
        certifie={certifie}
        onVerifier={() => router.push("/verification-identite")}
        onValideNom={(nom) => {
          definirNomOrganisateur(nom);
          setNomOrg(nom);
          setEtape("complet");
        }}
      />
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
      </div>

      {nomOrg && (
        <Link
          href={`/organisateur/profil/${encodeURIComponent(nomOrg)}`}
          className={`flex items-center justify-between gap-3 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex items-center justify-center shrink-0 w-8 h-8"
              style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
            >
              <AtSign size={15} strokeWidth={2} />
            </span>
            <span className="text-sm font-medium truncate" style={{ fontFamily: "var(--ds-font-mono)" }}>{nomOrg}</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: "var(--ds-accent-300)" }}>
            Voir mon profil
            <ChevronRight size={15} style={{ color: "var(--ds-accent-300)" }} />
          </span>
        </Link>
      )}

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
