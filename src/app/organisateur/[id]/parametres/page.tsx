"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
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

      <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
        Le type de compétition, les frais et le cash prize ne sont plus modifiables une fois le tournoi créé
        (des inscriptions peuvent déjà s&apos;appuyer dessus). Tu peux ajuster le reste ici.
      </p>

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

      <label className="flex items-start gap-2.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={streamActif}
          onChange={(e) => setStreamActif(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Activer le stream live de la partie en cours
          <span className="block mt-0.5 text-xs" style={{ color: "var(--ds-muted)" }}>
            Une fois le tournoi en direct, remplace la bannière par un cadre de stream visible des spectateurs.
          </span>
        </span>
      </label>

      <Button variante="primary" onClick={enregistrer} disabled={!titre.trim()}>
        {enregistre ? "Enregistré ✓" : "Enregistrer"}
      </Button>
    </div>
  );
}
