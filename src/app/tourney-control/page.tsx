"use client";

import { useEffect, useState } from "react";
import { Lock, KeyRound, ShieldCheck, LogOut, MessageSquareWarning } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import {
  verifierIdentifiants,
  verifierPin,
  etapeIdentifiantsValidee,
  estAuthentifieAdminSecurise,
  deconnecterAdminSecurise,
} from "@/lib/mockAdminSecure";
import {
  demandesOrganisateurEnAttente,
  traiterDemandeOrganisateur,
  type DemandeOrganisateur,
} from "@/lib/mockDemandesOrganisateur";
import {
  demandesEnAttente as demandesAnnulationEnAttente,
  traiterDemandeAnnulation,
  type DemandeAnnulation,
} from "@/lib/mockDemandesAnnulation";
import { annulerTournoi } from "@/lib/mockTournaments";
import { plaintesEnAttente, traiterPlainte, type Plainte } from "@/lib/mockPlaintes";
import { mesLitiges, type Litige } from "@/lib/mockLitige";

/**
 * Interface administrateur sécurisée (point 160) — route volontairement non
 * liée dans la navigation de l'app, accès à deux facteurs (identifiants puis
 * PIN, voir mockAdminSecure.ts). Regroupe les interactions nécessitant une
 * validation administrative : demandes de statut organisateur certifié
 * (avec motivation, point 162), plaintes (point 148), demandes d'annulation
 * (point 116), et un aperçu des litiges en cours (arbitrés par les
 * organisateurs eux-mêmes, affichés ici pour supervision).
 */
export default function TourneyControlPage() {
  const [pret, setPret] = useState(false);
  const [etape, setEtape] = useState<"identifiants" | "pin" | "interface">("identifiants");

  useEffect(() => {
    if (estAuthentifieAdminSecurise()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEtape("interface");
    } else if (etapeIdentifiantsValidee()) {
      setEtape("pin");
    }
    setPret(true);
  }, []);

  if (!pret) return null;

  if (etape === "identifiants") return <EcranIdentifiants onValide={() => setEtape("pin")} />;
  if (etape === "pin") return <EcranPin onValide={() => setEtape("interface")} />;
  return <InterfaceAdmin onDeconnecter={() => setEtape("identifiants")} />;
}

function EcranIdentifiants({ onValide }: { onValide: () => void }) {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function valider(e: React.FormEvent) {
    e.preventDefault();
    if (verifierIdentifiants(identifiant, motDePasse)) {
      setErreur(null);
      onValide();
    } else {
      setErreur("Identifiants incorrects.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <Lock size={28} style={{ color: "var(--ds-accent-300)" }} />
      <form onSubmit={valider} className="flex flex-col gap-3 w-full max-w-xs">
        <Field label="Identifiant" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoComplete="off" />
        <Field label="Mot de passe" type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} erreur={erreur ?? undefined} />
        <button
          type="submit"
          className={`h-11 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
        >
          Continuer
        </button>
      </form>
    </div>
  );
}

function EcranPin({ onValide }: { onValide: () => void }) {
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function valider(e: React.FormEvent) {
    e.preventDefault();
    if (verifierPin(pin)) {
      setErreur(null);
      onValide();
    } else {
      setErreur("Code PIN incorrect.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <KeyRound size={28} style={{ color: "var(--ds-accent-300)" }} />
      <form onSubmit={valider} className="flex flex-col gap-3 w-full max-w-xs">
        <Field
          label="Code PIN"
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          erreur={erreur ?? undefined}
        />
        <button
          type="submit"
          className={`h-11 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
        >
          Déverrouiller
        </button>
      </form>
    </div>
  );
}

type Onglet = "organisateurs" | "plaintes" | "litiges" | "annulations";

function CarteAction({
  titre,
  meta,
  corps,
  onAccepter,
  onRefuser,
}: {
  titre: string;
  meta: string;
  corps: string;
  onAccepter: (message: string) => void;
  onRefuser: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="flex flex-col gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
      <div className="text-sm font-medium">{titre}</div>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{meta}</div>
      <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--ds-text-muted)" }}>{corps}</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        placeholder="Message pour la personne concernée (motif du refus, note...)"
        className="px-2.5 py-2 text-xs outline-none resize-none"
        style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAccepter(message)}
          className={`flex-1 h-9 text-xs font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => onRefuser(message)}
          className={`flex-1 h-9 text-xs font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
        >
          Refuser
        </button>
      </div>
    </div>
  );
}

function InterfaceAdmin({ onDeconnecter }: { onDeconnecter: () => void }) {
  const [onglet, setOnglet] = useState<Onglet>("organisateurs");
  const [demandesOrga, setDemandesOrga] = useState<DemandeOrganisateur[]>([]);
  const [plaintes, setPlaintes] = useState<Plainte[]>([]);
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [demandesAnnul, setDemandesAnnul] = useState<DemandeAnnulation[]>([]);

  function rafraichir() {
    setDemandesOrga(demandesOrganisateurEnAttente());
    setPlaintes(plaintesEnAttente());
    setLitiges(mesLitiges());
    setDemandesAnnul(demandesAnnulationEnAttente());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    rafraichir();
  }, []);

  const onglets: { id: Onglet; label: string; count: number }[] = [
    { id: "organisateurs", label: "Organisateurs", count: demandesOrga.length },
    { id: "plaintes", label: "Plaintes", count: plaintes.length },
    { id: "litiges", label: "Litiges", count: litiges.filter((l) => l.statut === "en_attente").length },
    { id: "annulations", label: "Annulations", count: demandesAnnul.length },
  ];

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          <span className="text-lg font-medium">Administration</span>
        </div>
        <button
          type="button"
          onClick={() => {
            deconnecterAdminSecurise();
            onDeconnecter();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <LogOut size={13} strokeWidth={2} />
          Se déconnecter
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 h-8 text-xs font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-pill)",
              background: onglet === o.id ? "var(--ds-accent-800)" : "transparent",
              border: onglet === o.id ? "none" : "1px solid var(--ds-border)",
              color: onglet === o.id ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            {o.label}
            {o.count > 0 && (
              <span
                className="flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px]"
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-danger)", color: "#fff", fontFamily: "var(--ds-font-mono)" }}
              >
                {o.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {onglet === "organisateurs" &&
          (demandesOrga.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucune demande en attente.</p>
          ) : (
            demandesOrga.map((d) => (
              <CarteAction
                key={d.id}
                titre={d.nomOrganisateur}
                meta={new Date(d.horodatage).toLocaleDateString("fr-FR")}
                corps={d.motivation}
                onAccepter={(msg) => {
                  traiterDemandeOrganisateur(d.id, "validee", msg);
                  rafraichir();
                }}
                onRefuser={(msg) => {
                  traiterDemandeOrganisateur(d.id, "refusee", msg);
                  rafraichir();
                }}
              />
            ))
          ))}

        {onglet === "plaintes" &&
          (plaintes.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucune plainte en attente.</p>
          ) : (
            plaintes.map((p) => (
              <CarteAction
                key={p.id}
                titre={`${p.sujet} · ${p.auteur}`}
                meta={new Date(p.horodatage).toLocaleDateString("fr-FR")}
                corps={p.description}
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
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucun litige.</p>
          ) : (
            <>
              <p className="text-[11px]" style={{ color: "var(--ds-muted)" }}>
                Les litiges sont tranchés par l&apos;organisateur du tournoi concerné — aperçu à titre de supervision.
              </p>
              {litiges.map((l) => (
                <div key={l.id} className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                  <MessageSquareWarning size={15} strokeWidth={2} style={{ color: l.statut === "en_attente" ? "var(--ds-accent-300)" : "var(--ds-muted)" }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{l.tournoiTitre} · {l.motifLabel}</div>
                    <div className="text-[10px] truncate" style={{ color: "var(--ds-muted)" }}>vs {l.adversaire} · arbitre {l.arbitre}</div>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {l.statut === "en_attente" ? "EN ATTENTE" : l.statut === "resolu_faveur" ? "RÉSOLU" : "REJETÉ"}
                  </span>
                </div>
              ))}
            </>
          ))}

        {onglet === "annulations" &&
          (demandesAnnul.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucune demande en attente.</p>
          ) : (
            demandesAnnul.map((d) => (
              <CarteAction
                key={d.id}
                titre={d.tournoiTitre}
                meta={`${d.organisateur} · ${new Date(d.horodatage).toLocaleDateString("fr-FR")}`}
                corps={d.motif}
                onAccepter={(msg) => {
                  annulerTournoi(d.tournoiId);
                  traiterDemandeAnnulation(d.id, "validee", msg);
                  rafraichir();
                }}
                onRefuser={(msg) => {
                  traiterDemandeAnnulation(d.id, "refusee", msg);
                  rafraichir();
                }}
              />
            ))
          ))}
      </div>
    </div>
  );
}
