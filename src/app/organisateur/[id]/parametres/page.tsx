"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ImageOff, Radio } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button, PRESS } from "@/components/ds/Button";
import { tournoiParId, modifierTournoi } from "@/lib/mockTournaments";
import { estOrganisateur } from "@/lib/mockAuth";

export default function ParametresTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [autorise, setAutorise] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  const tournoi = tournoiParId(params.id);

  const [titre, setTitre] = useState(tournoi?.titre ?? "");
  const [ville, setVille] = useState(tournoi?.ville ?? "");
  const [checkin, setCheckin] = useState(tournoi?.checkin ?? "");
  const [reglement, setReglement] = useState(tournoi?.reglement ?? "");
  const [informations, setInformations] = useState(tournoi?.informations ?? "");
  const [streamActif, setStreamActif] = useState(tournoi?.streamActif ?? false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutorise(estOrganisateur());
  }, []);

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  if (!autorise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette page est réservée aux organisateurs.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  function enregistrer() {
    modifierTournoi(params.id, {
      titre: titre.trim() || tournoi!.titre,
      ville: ville.trim() || tournoi!.ville,
      checkin: checkin.trim(),
      reglement: reglement.trim(),
      informations: informations.trim() || undefined,
      streamActif,
    });
    setEnregistre(true);
    setTimeout(() => setEnregistre(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Paramètres du tournoi" onRetour={() => router.push(`/organisateur/${params.id}/gestion`)} />

      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Diffusion</div>
      <button
        type="button"
        onClick={() => setStreamActif((v) => !v)}
        className={`flex gap-3 p-3.5 text-left ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: streamActif ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)" }}
      >
        <span
          className="mt-0.5 flex items-center justify-center shrink-0"
          style={{ width: 20, height: 20, borderRadius: "var(--ds-radius-sm)", border: `1px solid ${streamActif ? "var(--ds-accent)" : "var(--ds-border-strong)"}`, background: streamActif ? "var(--ds-accent-800)" : "transparent" }}
        >
          {streamActif && <Check size={11} strokeWidth={2.5} style={{ color: "var(--ds-accent-300)" }} />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium">Activer le stream live de la partie en cours</span>
          <span className="block mt-1 text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 52%, transparent)" }}>
            Une fois le tournoi en direct, remplace la bannière par un cadre de stream visible des spectateurs.
          </span>
        </span>
      </button>
      <div className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
        {streamActif ? (
          <Radio size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
        ) : (
          <ImageOff size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
        )}
        <div className="text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 55%, transparent)" }}>
          {streamActif
            ? "Cadre de stream affiché à la place de la bannière dès le passage en direct."
            : "La fiche gardera une simple bande d'en-tête : ni bannière, ni cadre vide."}
        </div>
      </div>

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Déroulé</div>

      <Field label="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
      <Field label="Ville / lieu" value={ville} onChange={(e) => setVille(e.target.value)} />
      <Field label="Heure de check-in" value={checkin} onChange={(e) => setCheckin(e.target.value)} placeholder="19h30" />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Règlement</label>
        <textarea
          value={reglement}
          onChange={(e) => setReglement(e.target.value)}
          rows={5}
          className="px-3 py-2.5 text-sm outline-none resize-none"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Informations (facultatif)</label>
        <textarea
          value={informations}
          onChange={(e) => setInformations(e.target.value)}
          rows={4}
          className="px-3 py-2.5 text-sm outline-none resize-none"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        />
      </div>

      <Button variante="primary" onClick={enregistrer} disabled={!titre.trim()}>
        {enregistre ? "Enregistré ✓" : "Enregistrer"}
      </Button>
    </div>
  );
}
