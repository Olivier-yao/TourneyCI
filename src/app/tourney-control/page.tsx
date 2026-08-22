"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Info,
  Inbox,
  RefreshCw,
  UserCheck,
  Flag,
  Scale,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import {
  etapeConnexionAdmin,
  verifierIdentifiants,
  verifierPin,
  deconnecterAdminSecurise,
  demandesOrganisateurEnAttente,
  traiterDemandeOrganisateur,
  demandesAnnulationEnAttente,
  traiterDemandeAnnulation,
  type DemandeOrganisateurAdmin,
  type DemandeAnnulationAdmin,
} from "@/lib/mockTourneyControl";
import type { AnalyseDemandeOrganisateur } from "@/lib/mockAnalyseAutomatique";
import { plaintesEnAttente, traiterPlainte, type Plainte } from "@/lib/mockPlaintes";
import { mesLitiges, type Litige, type StatutLitige } from "@/lib/mockLitige";

/**
 * Interface administrateur sécurisée (point 160, restylée point 170 selon le
 * design Claude "Tourney Admin") — route volontairement non liée dans la
 * navigation de l'app, accès à deux facteurs (identifiants puis PIN, voir
 * src/lib/server/adminAuth.ts). Regroupe les interactions nécessitant une validation
 * administrative : demandes de statut organisateur certifié (avec
 * motivation, point 162), plaintes (point 148), demandes d'annulation
 * (point 116), et un aperçu des litiges en cours (arbitrés par les
 * organisateurs eux-mêmes, affichés ici pour supervision).
 */
export default function TourneyControlPage() {
  const [pret, setPret] = useState(false);
  const [etape, setEtape] = useState<"identifiants" | "pin" | "interface">("identifiants");

  useEffect(() => {
    async function verifier() {
      setEtape(await etapeConnexionAdmin());
      setPret(true);
    }
    verifier();
  }, []);

  if (!pret) return null;

  if (etape === "identifiants") return <EcranIdentifiants onValide={() => setEtape("pin")} />;
  if (etape === "pin")
    return <EcranPin onValide={() => setEtape("interface")} onRetour={() => setEtape("identifiants")} />;
  return <InterfaceAdmin onDeconnecter={() => setEtape("identifiants")} />;
}

function EtiquetteMono({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[9px] uppercase tracking-[.1em] mb-1.5"
      style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
    >
      {children}
    </div>
  );
}

function EcranIdentifiants({ onValide }: { onValide: () => void }) {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [focus, setFocus] = useState<"identifiant" | "motDePasse" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentativesRestantes, setTentativesRestantes] = useState(3);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    if (await verifierIdentifiants(identifiant, motDePasse)) {
      setErreur(null);
      onValide();
      return;
    }
    const restantes = tentativesRestantes - 1;
    if (restantes <= 0) {
      setTentativesRestantes(3);
      setCooldown(30);
      setErreur("Trop de tentatives.");
    } else {
      setTentativesRestantes(restantes);
      setErreur(
        `Identifiant ou mot de passe incorrect. ${restantes} tentative${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""}.`,
      );
    }
  }

  const messageErreur = cooldown > 0 ? `Trop de tentatives. Nouvelle saisie dans ${cooldown} s.` : erreur;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="w-full max-w-[420px] mx-auto flex flex-col flex-1 px-6">
        <div className="pt-10 flex items-center justify-between">
          <span
            className="text-[9px] tracking-[.12em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            TOURNEY ADMIN
          </span>
          <span
            className="text-[9px] tracking-[.12em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            V1.4.2
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6 py-10 min-h-0">
          <div>
            <div
              className="w-[42px] h-[42px] flex items-center justify-center"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-accent-300)" }}
            >
              <Lock size={20} strokeWidth={2} />
            </div>
            <div className="mt-4 text-2xl font-medium tracking-tight" style={{ fontFamily: "var(--ds-font-heading)" }}>
              Administration
            </div>
            <div
              className="mt-1.5 text-[10px] tracking-[.1em]"
              style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
            >
              ACCÈS RESTREINT · ÉTAPE 1 / 2
            </div>
          </div>

          <form onSubmit={valider} className="flex flex-col gap-3">
            <div>
              <EtiquetteMono>Identifiant</EtiquetteMono>
              <input
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                onFocus={() => setFocus("identifiant")}
                onBlur={() => setFocus(null)}
                autoComplete="off"
                disabled={cooldown > 0}
                className="w-full h-[46px] px-3.5 text-sm outline-none"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: "var(--ds-surface-2)",
                  border: `1px solid ${focus === "identifiant" ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  color: "var(--ds-text)",
                }}
              />
            </div>
            <div>
              <EtiquetteMono>Mot de passe</EtiquetteMono>
              <div
                className="flex items-center gap-2.5 h-[46px] px-3.5"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: "var(--ds-surface-2)",
                  border: `1px solid ${focus === "motDePasse" ? "var(--ds-accent)" : "var(--ds-border)"}`,
                }}
              >
                <input
                  type={voir ? "text" : "password"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  onFocus={() => setFocus("motDePasse")}
                  onBlur={() => setFocus(null)}
                  disabled={cooldown > 0}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                  style={{ color: "var(--ds-text)", letterSpacing: voir ? "normal" : ".18em" }}
                />
                <button
                  type="button"
                  onClick={() => setVoir((v) => !v)}
                  className="shrink-0"
                  style={{ color: "var(--ds-muted)" }}
                  aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {voir ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cooldown > 0}
              className={`h-12 text-sm font-medium mt-1 ${PRESS}`}
              style={{
                borderRadius: "var(--ds-radius-md)",
                border: "1px solid var(--ds-accent)",
                color: "var(--ds-accent-300)",
                opacity: cooldown > 0 ? 0.45 : 1,
              }}
            >
              Continuer
            </button>

            {messageErreur && (
              <div className="flex items-start gap-2 mt-1">
                <AlertCircle size={14} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-snug" style={{ color: "var(--ds-text-muted)" }}>
                  {messageErreur}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="pb-8">
          <div
            className="text-[9px] tracking-[.1em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            SESSION EXPIRÉE APRÈS 15 MIN D&apos;INACTIVITÉ
          </div>
        </div>
      </div>
    </div>
  );
}

function EcranPin({ onValide, onRetour }: { onValide: () => void; onRetour: () => void }) {
  const [pin, setPin] = useState("");
  const [focus, setFocus] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    if (await verifierPin(pin)) {
      setErreur(null);
      onValide();
      return;
    }
    setPin("");
    setCooldown(30);
    setErreur("Code invalide.");
  }

  const messageErreur = cooldown > 0 ? `Code invalide. Nouvelle saisie dans ${cooldown} s.` : erreur;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="w-full max-w-[420px] mx-auto flex flex-col flex-1 px-6">
        <div className="pt-10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRetour}
            className={`w-[30px] h-[30px] flex items-center justify-center shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            aria-label="Retour"
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <span
            className="text-[9px] tracking-[.12em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            TOURNEY ADMIN
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10 min-h-0 text-center">
          <div>
            <div
              className="w-[42px] h-[42px] mx-auto flex items-center justify-center"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent-600)", color: "var(--ds-accent-300)" }}
            >
              <ShieldCheck size={20} strokeWidth={2} />
            </div>
            <div className="mt-4 text-[22px] font-medium tracking-tight" style={{ fontFamily: "var(--ds-font-heading)" }}>
              Code de vérification
            </div>
            <div
              className="mt-1.5 text-[10px] tracking-[.1em]"
              style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
            >
              ADMIN.TOURNEY · ÉTAPE 2 / 2
            </div>
          </div>

          <form onSubmit={valider} className="w-full flex flex-col gap-3">
            <div>
              <div
                className="h-[60px] flex items-center justify-center"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: "var(--ds-surface-2)",
                  border: `1px solid ${focus ? "var(--ds-accent)" : "var(--ds-border)"}`,
                }}
              >
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  disabled={cooldown > 0}
                  className="w-full bg-transparent outline-none text-center"
                  style={{ fontFamily: "var(--ds-font-mono)", fontSize: 28, letterSpacing: ".5em", textIndent: ".5em", color: "var(--ds-text)" }}
                  autoFocus
                />
              </div>
              <div
                className="mt-2 text-[9px] tracking-[.1em]"
                style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
              >
                6 CHIFFRES · SAISIE MASQUÉE
              </div>
            </div>

            <button
              type="submit"
              disabled={cooldown > 0}
              className={`h-12 text-sm font-medium ${PRESS}`}
              style={{
                borderRadius: "var(--ds-radius-md)",
                border: "1px solid var(--ds-accent)",
                color: "var(--ds-accent-300)",
                opacity: cooldown > 0 ? 0.45 : 1,
              }}
            >
              Déverrouiller
            </button>

            {messageErreur && (
              <div className="flex items-start justify-center gap-2">
                <AlertCircle size={14} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-snug" style={{ color: "var(--ds-text-muted)" }}>
                  {messageErreur}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="pb-8 text-center">
          <div
            className="text-[9px] tracking-[.1em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            PIN DÉFINI DEPUIS LA CONSOLE INTERNE
          </div>
        </div>
      </div>
    </div>
  );
}

type Onglet = "organisateurs" | "plaintes" | "litiges" | "annulations";

const ONGLET_META: Record<Onglet, { label: string; icon: LucideIcon }> = {
  organisateurs: { label: "Organisateurs", icon: UserCheck },
  plaintes: { label: "Plaintes", icon: Flag },
  litiges: { label: "Litiges", icon: Scale },
  annulations: { label: "Annulations", icon: XCircle },
};

function formatDateHeure(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${date} · ${h}H${m}`;
}

function footMetaPour(onglet: Onglet, counts: Record<Onglet, number>): string {
  switch (onglet) {
    case "organisateurs":
      return `TRIÉ PAR ANCIENNETÉ · ${counts.organisateurs} EN ATTENTE`;
    case "plaintes":
      return `TRIÉ PAR ANCIENNETÉ · ${counts.plaintes} EN ATTENTE`;
    case "litiges":
      return `SUPERVISION · ${counts.litiges} EN ATTENTE D'ARBITRAGE`;
    case "annulations":
      return "REMBOURSEMENT AUTOMATIQUE SI ACCEPTÉ";
  }
}

function EtatVide({ texte }: { texte: string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="text-center">
        <Inbox size={26} style={{ color: "var(--ds-border-strong)" }} className="mx-auto" strokeWidth={1.75} />
        <div className="mt-2.5 text-sm" style={{ color: "var(--ds-muted)" }}>
          {texte}
        </div>
      </div>
    </div>
  );
}

function AnalyseAutomatique({ analyse }: { analyse: AnalyseDemandeOrganisateur }) {
  return (
    <div
      className="flex flex-col gap-1.5 p-2.5"
      style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
    >
      <div
        className="text-[9px] tracking-[.08em] uppercase"
        style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
      >
        Analyse automatique · {analyse.score}/{analyse.total} critères
      </div>
      {analyse.criteres.map((c) => (
        <div key={c.label} className="flex items-start gap-1.5 text-[11px] leading-snug" style={{ color: c.rempli ? "var(--ds-text)" : "var(--ds-muted)" }}>
          {c.rempli ? (
            <CheckCircle2 size={12} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent-300)" }} />
          ) : (
            <XCircle size={12} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-muted)" }} />
          )}
          {c.label}
        </div>
      ))}
    </div>
  );
}

function CarteAction({
  icon: Icon,
  primary,
  titre,
  meta,
  corps,
  analyse,
  placeholder,
  onAccepter,
  onRefuser,
}: {
  icon: LucideIcon;
  primary: boolean;
  titre: string;
  meta: string;
  corps: string;
  analyse?: AnalyseDemandeOrganisateur;
  placeholder: string;
  onAccepter: (message: string) => void;
  onRefuser: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  return (
    <div
      className="flex flex-col gap-2.5 p-3.5"
      style={{
        borderRadius: "var(--ds-radius-md)",
        background: "var(--ds-surface)",
        border: `1px solid ${primary ? "var(--ds-accent)" : "var(--ds-border)"}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", color: primary ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
        >
          <Icon size={15} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight">{titre}</div>
          <div
            className="mt-1 text-[9px] tracking-[.06em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            {meta}
          </div>
        </div>
      </div>

      <p
        className="text-xs leading-relaxed whitespace-pre-wrap p-2.5"
        style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", color: "var(--ds-text-muted)" }}
      >
        {corps}
      </p>

      {analyse && <AnalyseAutomatique analyse={analyse} />}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="px-3 py-2 text-xs outline-none resize-none"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onRefuser(message)}
          className={`flex-1 h-[38px] text-xs font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => onAccepter(message)}
          className={`flex-1 h-[38px] text-xs font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}

const STATUT_LITIGE_STYLE: Record<StatutLitige, { label: string; bg: string; border: string; color: string; accent: boolean }> = {
  en_attente: { label: "EN ATTENTE", bg: "var(--ds-accent-900)", border: "var(--ds-accent)", color: "var(--ds-accent-300)", accent: true },
  resolu_faveur: { label: "RÉSOLU", bg: "transparent", border: "var(--ds-border)", color: "var(--ds-muted)", accent: false },
  rejete: { label: "REJETÉ", bg: "transparent", border: "var(--ds-border)", color: "var(--ds-muted)", accent: false },
};

function CarteLitige({ litige }: { litige: Litige }) {
  const skin = STATUT_LITIGE_STYLE[litige.statut];
  const meta = `${litige.statut === "en_attente" ? "SIGNALÉ LE" : "TRANCHÉ LE"} ${formatDateHeure(litige.horodatage)}`;
  const rows: [string, string][] = [
    ["MOTIF", litige.motifLabel],
    ["ADVERSAIRE", litige.adversaire],
    ["ARBITRE", litige.arbitre],
    litige.statut === "en_attente"
      ? ["PREUVES", `${litige.preuves.length} preuve${litige.preuves.length > 1 ? "s" : ""}`]
      : ["DÉCISION", litige.statut === "resolu_faveur" ? "Signalement retenu" : "Score maintenu"],
  ];

  return (
    <div
      className="flex flex-col gap-2.5 p-3.5"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: `1px solid ${skin.accent ? "var(--ds-accent)" : "var(--ds-border)"}` }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", color: skin.accent ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
        >
          <Scale size={15} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight">{litige.tournoiTitre}</div>
          <div
            className="mt-1 text-[9px] tracking-[.06em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            {meta}
          </div>
        </div>
        <div
          className="shrink-0 px-2.5 py-1 text-[9px]"
          style={{ borderRadius: 999, background: skin.bg, border: `1px solid ${skin.border}`, color: skin.color, fontFamily: "var(--ds-font-mono)" }}
        >
          {skin.label}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2.5">
            <div
              className="w-[78px] shrink-0 text-[9px] tracking-[.06em]"
              style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
            >
              {k}
            </div>
            <div className="flex-1 min-w-0 text-xs">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterfaceAdmin({ onDeconnecter }: { onDeconnecter: () => void }) {
  const [onglet, setOnglet] = useState<Onglet>("organisateurs");
  const [demandesOrga, setDemandesOrga] = useState<DemandeOrganisateurAdmin[]>([]);
  const [plaintes, setPlaintes] = useState<Plainte[]>([]);
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [demandesAnnul, setDemandesAnnul] = useState<DemandeAnnulationAdmin[]>([]);

  async function rafraichir() {
    setDemandesOrga(await demandesOrganisateurEnAttente());
    setPlaintes(plaintesEnAttente());
    setLitiges(mesLitiges());
    setDemandesAnnul(await demandesAnnulationEnAttente());
  }

  useEffect(() => {
    rafraichir();
  }, []);

  const counts: Record<Onglet, number> = {
    organisateurs: demandesOrga.length,
    plaintes: plaintes.length,
    litiges: litiges.filter((l) => l.statut === "en_attente").length,
    annulations: demandesAnnul.length,
  };
  // Les litiges sont supervisés, pas traités ici — exclus du total affiché en en-tête.
  const totalEnAttente = counts.organisateurs + counts.plaintes + counts.annulations;

  const onglets: Onglet[] = ["organisateurs", "plaintes", "litiges", "annulations"];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="w-full max-w-[420px] mx-auto flex flex-col flex-1 px-5">
        <div className="pt-10 pb-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[22px] font-medium tracking-tight" style={{ fontFamily: "var(--ds-font-heading)" }}>
              Administration
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[.1em]"
              style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
            >
              {totalEnAttente > 0 ? `${totalEnAttente} DEMANDE${totalEnAttente > 1 ? "S" : ""} EN ATTENTE` : "AUCUNE DEMANDE EN ATTENTE"}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await deconnecterAdminSecurise();
              onDeconnecter();
            }}
            className={`flex items-center gap-1.5 text-xs shrink-0 ${PRESS}`}
            style={{ color: "var(--ds-muted)" }}
          >
            <LogOut size={14} strokeWidth={2} />
            Déconnexion
          </button>
        </div>

        <div className="flex gap-1.5 pb-3" style={{ borderBottom: "1px solid var(--ds-border)" }}>
          {onglets.map((id) => {
            const actif = onglet === id;
            const Icon = ONGLET_META[id].icon;
            const n = counts[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOnglet(id)}
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-sm)", background: actif ? "var(--ds-accent-900)" : "transparent" }}
              >
                <span className="flex items-center gap-1">
                  <Icon size={14} strokeWidth={2} style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)" }} />
                  {n > 0 && (
                    <span
                      className="min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[9px]"
                      style={{
                        borderRadius: 999,
                        fontFamily: "var(--ds-font-mono)",
                        background: actif ? "var(--ds-accent-600)" : "var(--ds-border)",
                        color: actif ? "var(--ds-accent-100)" : "var(--ds-muted)",
                      }}
                    >
                      {n}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-medium" style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}>
                  {ONGLET_META[id].label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col gap-2.5 py-3.5 min-h-0">
          {onglet === "litiges" && (
            <div
              className="flex gap-2.5 items-start p-3"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
            >
              <Info size={15} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-snug" style={{ color: "var(--ds-text-muted)" }}>
                Les litiges sont tranchés par l&apos;organisateur du tournoi concerné. Cette liste n&apos;est
                qu&apos;une supervision : aucune action n&apos;est possible ici.
              </div>
            </div>
          )}

          {onglet === "organisateurs" &&
            (demandesOrga.length === 0 ? (
              <EtatVide texte="Aucune demande d'organisateur en attente." />
            ) : (
              demandesOrga.map((d, i) => (
                <CarteAction
                  key={d.id}
                  icon={UserCheck}
                  primary={i === 0}
                  titre={d.nomOrganisateur}
                  meta={`DEMANDE DU ${formatDateHeure(d.horodatage)} · ${d.identiteVerifiee ? "CNI VÉRIFIÉE" : "CNI EN ATTENTE"}`}
                  corps={d.motivation}
                  analyse={d.analyseAutomatique}
                  placeholder={`Réponse à ${d.nomOrganisateur}…`}
                  onAccepter={async (msg) => {
                    await traiterDemandeOrganisateur(d.id, "validee", msg);
                    rafraichir();
                  }}
                  onRefuser={async (msg) => {
                    await traiterDemandeOrganisateur(d.id, "refusee", msg);
                    rafraichir();
                  }}
                />
              ))
            ))}

          {onglet === "plaintes" &&
            (plaintes.length === 0 ? (
              <EtatVide texte="Aucune plainte en attente." />
            ) : (
              plaintes.map((p, i) => (
                <CarteAction
                  key={p.id}
                  icon={Flag}
                  primary={i === 0}
                  titre={`${p.sujet} · ${p.auteur}`}
                  meta={`DÉPOSÉE LE ${formatDateHeure(p.horodatage)}`}
                  corps={p.description}
                  placeholder={`Réponse à ${p.auteur}…`}
                  onAccepter={(msg) => {
                    traiterPlainte(p.id, msg || "Signalement traité.");
                    rafraichir();
                  }}
                  onRefuser={(msg) => {
                    traiterPlainte(p.id, msg || "Signalement clos sans suite.");
                    rafraichir();
                  }}
                />
              ))
            ))}

          {onglet === "litiges" &&
            (litiges.length === 0 ? (
              <EtatVide texte="Aucun litige en cours." />
            ) : (
              litiges.map((l) => <CarteLitige key={l.id} litige={l} />)
            ))}

          {onglet === "annulations" &&
            (demandesAnnul.length === 0 ? (
              <EtatVide texte="Aucune demande d'annulation en attente." />
            ) : (
              demandesAnnul.map((d, i) => (
                <CarteAction
                  key={d.id}
                  icon={XCircle}
                  primary={i === 0}
                  titre={d.tournoiTitre}
                  meta={`${d.organisateurNom.toUpperCase()} · DEMANDE DU ${formatDateHeure(d.horodatage)} · ${d.placesInscrites} INSCRIT${d.placesInscrites > 1 ? "S" : ""}`}
                  corps={d.motif}
                  placeholder={`Réponse à ${d.organisateurNom}…`}
                  onAccepter={async (msg) => {
                    // L'annulation reelle du tournoi est faite cote serveur
                    // par traiterDemandeAnnulation quand le statut est "validee".
                    await traiterDemandeAnnulation(d.id, "validee", msg);
                    rafraichir();
                  }}
                  onRefuser={async (msg) => {
                    await traiterDemandeAnnulation(d.id, "refusee", msg);
                    rafraichir();
                  }}
                />
              ))
            ))}
        </div>

        <div className="pb-6 pt-2.5 flex items-center gap-2" style={{ borderTop: "1px solid var(--ds-border)" }}>
          <div
            className="flex-1 text-[9px] tracking-[.09em]"
            style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}
          >
            {footMetaPour(onglet, counts)}
          </div>
          <button type="button" onClick={rafraichir} style={{ color: "var(--ds-muted)" }} aria-label="Rafraîchir">
            <RefreshCw size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
