"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus, Heart, ShieldCheck, IdCard, AtSign, Lock, Clock, XCircle, Send, CheckCircle2 } from "lucide-react";
import { Button, PRESS } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { hexagoneStyle } from "@/components/ds/Palier";
import { mesTournoisOrganises, COMMISSION_PCT, type Tournoi } from "@/lib/mockTournaments";
import { estCertifie, estOrganisateurCertifie, reglementStandardAccepte } from "@/lib/mockOrganisateur";
import { nomOrganisateur, definirNomOrganisateur } from "@/lib/mockOrganisateur";
import { creerDemandeOrganisateur, demandeOrganisateurActuelle, type DemandeOrganisateur } from "@/lib/mockDemandesOrganisateur";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { AlerteVerificationIdentite } from "@/components/ds/AlerteVerificationIdentite";

type EtapeOnboarding = "nom" | "complet";

/**
 * Demande de statut organisateur certifié (points 146, 158, 162) — distincte
 * de la vérification d'identité et NON bloquante pour organiser des tournois
 * gratuits (point 167) : un organisateur standard peut toujours créer, cette
 * demande sert uniquement à devenir certifié (débloque les tournois payants).
 * Accessible volontairement depuis le tableau de bord, pas imposée.
 */
function DemandeOrganisateurEcran({
  nomOrg,
  identiteVerifiee,
  demande,
  onEnvoyer,
  onFermer,
}: {
  nomOrg: string;
  identiteVerifiee: boolean;
  demande: DemandeOrganisateur | undefined;
  onEnvoyer: (motivation: string) => void;
  onFermer: () => void;
}) {
  const [motivation, setMotivation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const enAttente = demande?.statut === "en_attente";
  const validee = demande?.statut === "validee";
  const refusee = demande?.statut === "refusee";
  const soumise = enAttente || validee || refusee;
  // Point 188 : critères affichés au candidat avant l'envoi, pour qu'il sache
  // exactement ce qui est attendu plutôt que de découvrir un refus après coup.
  const criteres = [
    { label: "Identité vérifiée (CNI + selfie)", ok: identiteVerifiee },
    { label: "Nom d'organisateur choisi", ok: Boolean(nomOrg) },
    { label: "Motivation détaillée rédigée", ok: motivation.trim().length >= 20 },
  ];

  function envoyer() {
    if (!motivation.trim()) {
      setErreur("Explique pourquoi tu souhaites devenir organisateur certifié.");
      return;
    }
    setErreur(null);
    onEnvoyer(motivation.trim());
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "var(--ds-bg)" }}>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, var(--ds-accent-900) 0%, var(--ds-bg) 58%)" }}
      />
      <div className="relative flex-1 flex flex-col px-5 pt-6 pb-24 gap-4">
        <div className="text-[10px] uppercase tracking-wide text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Devenir organisateur certifié
        </div>

        <div className="flex justify-center py-2">
          <div
            className="flex items-center justify-center"
            style={{ ...hexagoneStyle, width: 92, height: 102, background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 44px color-mix(in srgb, var(--ds-accent) 26%, transparent)" }}
          >
            {enAttente ? (
              <Clock size={38} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            ) : validee ? (
              <CheckCircle2 size={38} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            ) : refusee ? (
              <XCircle size={38} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
            ) : (
              <Send size={34} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            {enAttente ? "Demande en cours d'examen" : validee ? "Statut certifié débloqué" : refusee ? "Demande refusée" : "Demande de certification"}
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            {enAttente
              ? `Ta demande pour "${nomOrg}" a été envoyée à l'administration. Tu peux déjà organiser des tournois gratuits en attendant.`
              : validee
                ? `Félicitations — "${nomOrg}" est maintenant certifié. Les tournois payants et ta commission sont débloqués.${demande?.messageAdmin ? ` ${demande.messageAdmin}` : ""}`
                : refusee
                  ? `L'administration n'a pas validé ta demande.${demande?.messageAdmin ? ` Motif : ${demande.messageAdmin}` : ""} Tu peux en envoyer une nouvelle si ta situation a changé.`
                  : "Explique à l'administration pourquoi tu souhaites devenir organisateur certifié — ça reste optionnel, tu peux déjà organiser des tournois gratuits sans ça."}
          </p>
        </div>

        {!soumise || refusee ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Critères attendus
              </div>
              {criteres.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5 py-2" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                  <CheckCircle2 size={15} strokeWidth={2} style={{ color: c.ok ? "var(--ds-accent-300)" : "var(--ds-muted)" }} />
                  <span className="flex-1 text-[13px]" style={{ color: c.ok ? "var(--ds-text)" : "var(--ds-muted)" }}>{c.label}</span>
                  <span className="text-[10px]" style={{ color: c.ok ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {c.ok ? "OK" : "MANQUANT"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
                Pourquoi veux-tu devenir organisateur certifié ?
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={4}
                placeholder="Ex : je veux promouvoir le gaming local, organiser des tournois payants pour ma communauté..."
                className="px-3 py-2.5 text-sm outline-none resize-none"
                style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
              />
              {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative px-5 pb-6 flex gap-2.5">
        {!enAttente && (
          <button
            type="button"
            onClick={envoyer}
            className={`flex-1 h-[46px] text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            {refusee ? "Envoyer une nouvelle demande" : soumise ? "Retour au profil" : "Envoyer ma demande"}
          </button>
        )}
        {soumise && !refusee && (
          <button
            type="button"
            onClick={onFermer}
            className={`flex-1 h-[46px] text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            {validee ? "Créer mon premier tournoi payant" : "Retour au profil"}
          </button>
        )}
        {!soumise && (
          <button
            type="button"
            onClick={onFermer}
            className={`px-4 h-[46px] text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

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
            Choisis ton nom public pour commencer à organiser des tournois gratuits dès maintenant. La certification
            (identité vérifiée + demande validée) reste optionnelle, elle ne débloque que les tournois payants et ta
            commission de {Math.round(COMMISSION_PCT * 100)} %.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <button type="button" onClick={onVerifier} className={`block w-full text-left ${PRESS}`} disabled={certifie}>
            <LigneEtape n={1} titre="Vérification d'identité" meta="CNI RECTO/VERSO + SELFIE · FACULTATIF" actuelle={false} faite={certifie} />
          </button>
          <LigneEtape n={2} titre="Choix du nom d'organisateur" meta="NOM PUBLIC · MODIFIABLE UNE FOIS PAR MOIS" actuelle={true} faite={false} />
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
              Tu peux organiser sans attendre — la demande de statut certifié, si tu la fais un jour, ne sert qu&apos;à
              débloquer les tournois payants.
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

function OrganisateurPageInterne() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tournoisOrganises, setTournoisOrganises] = useState<Tournoi[]>([]);
  const [etape, setEtape] = useState<EtapeOnboarding>("complet");
  const [nomOrg, setNomOrg] = useState<string | undefined>(undefined);
  const [certifie, setCertifie] = useState(false);
  const [organisateurCertifie, setOrganisateurCertifie] = useState(false);
  const [demande, setDemande] = useState<DemandeOrganisateur | undefined>(undefined);
  const [vueCertification, setVueCertification] = useState(false);
  const [alerteVerifOuverte, setAlerteVerifOuverte] = useState(false);

  useEffect(() => {
    async function charger() {
      // État dépendant du localStorage : liste vide au premier rendu serveur,
      // synchronisée côté client une fois montée (évite un mismatch d'hydratation).
      const estCert = estCertifie();
      const nom = nomOrganisateur();
      // Point 178 : le règlement général doit être lu avant même le choix du
      // nom d'organisateur, la toute première fois.
      if (!nom && !(await reglementStandardAccepte())) {
        router.replace("/organisateur/reglement-standard");
        return;
      }
      const demandeActuelle = await demandeOrganisateurActuelle();
      const estOrgaCert = await estOrganisateurCertifie();
      setCertifie(estCert);
      setOrganisateurCertifie(estOrgaCert);
      setNomOrg(nom);
      setDemande(demandeActuelle);
      // Point 167 : un nom suffit pour atteindre le tableau de bord — la
      // demande de statut certifié (point 158) n'est plus une étape imposée.
      setEtape(!nom ? "nom" : "complet");
      setTournoisOrganises(await mesTournoisOrganises());
      // Point 187 : arrivée depuis l'alerte du formulaire de création après
      // vérification d'identité — ouvre directement la demande de certification
      // plutôt que de laisser l'utilisateur revenir au même message.
      if (searchParams.get("ouvrirCertification") === "1" && nom && estCert && !estOrgaCert) {
        setVueCertification(true);
      }
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (vueCertification) {
    return (
      <DemandeOrganisateurEcran
        nomOrg={nomOrg ?? ""}
        identiteVerifiee={certifie}
        demande={demande}
        onEnvoyer={async (motivation) => {
          const d = await creerDemandeOrganisateur(motivation, certifie);
          if (d) {
            setDemande(d);
            setOrganisateurCertifie(await estOrganisateurCertifie());
            // Point 159 : le règlement organisateur certifié est présenté
            // dès que le statut est validé (immédiat tant que l'auto-
            // validation du point 157 est active).
            if (d.statut === "validee") router.push("/organisateur/reglement-certifie");
          }
        }}
        onFermer={() => setVueCertification(false)}
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

      {!organisateurCertifie && (
        <button
          type="button"
          onClick={() => {
            // Point 181 : l'accès à la demande de certification (étape 2)
            // reste bloqué tant que la vérification d'identité (étape 1)
            // n'est pas complétée.
            if (!certifie) {
              setAlerteVerifOuverte(true);
              return;
            }
            setVueCertification(true);
          }}
          className={`flex items-center justify-between p-3 text-left ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            Devenir organisateur certifié
          </span>
          <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
        </button>
      )}

      <AlerteVerificationIdentite
        ouvert={alerteVerifOuverte}
        description="Avant d'envoyer ta demande de statut organisateur certifié, tu dois d'abord faire vérifier ton identité (pièce d'identité + âge)."
        onFermer={() => setAlerteVerifOuverte(false)}
      />

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

export default function OrganisateurPage() {
  return (
    <Suspense fallback={null}>
      <OrganisateurPageInterne />
    </Suspense>
  );
}
