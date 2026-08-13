"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Lock } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button } from "@/components/ds/Button";
import { formatXof } from "@/lib/formatXof";
import {
  statistiquesReputation,
  statutModeration,
  confirmerTricheEtBannir,
  leverSuspension,
  listeNoire,
  nomOrganisateurActuel,
  type StatutModeration,
} from "@/lib/mockOrganisateur";
import {
  paiementsEnAttente,
  libererSequestreCashPrize,
  reevaluerPaiementsEnAttente,
  tauxPlateformeSurCommission,
  definirTauxPlateformeSurCommission,
  type PaiementEnAttente,
} from "@/lib/mockTournaments";
import { tousLesAppelsOuverts, traiterAppel, type Appel } from "@/lib/mockAppel";
import { AdminGate } from "@/components/ds/AdminGate";

/**
 * Outil d'administration (mock) : pas de rôle admin séparé dans l'app, donc
 * cet écran agit sur l'organisateur de cet appareil. Accessible uniquement
 * par URL directe (non lié dans la navigation), à remplacer par un vrai
 * back-office en phase 8.
 */
export default function ModerationAdminPage() {
  return (
    <AdminGate>
      <ModerationAdminContenu />
    </AdminGate>
  );
}

function ModerationAdminContenu() {
  const [organisateur, setOrganisateur] = useState("");
  const [stats, setStats] = useState({ coeurs: 0, coeursBrises: 0 });
  const [statut, setStatut] = useState<StatutModeration>("actif");
  const [liste, setListe] = useState<ReturnType<typeof listeNoire>>([]);
  const [sequestres, setSequestres] = useState<PaiementEnAttente[]>([]);
  const [appelsOuverts, setAppelsOuverts] = useState<Appel[]>([]);
  const [tauxPlateforme, setTauxPlateforme] = useState("20");

  function rafraichir() {
    const nom = nomOrganisateurActuel();
    setOrganisateur(nom);
    setStats(statistiquesReputation(nom));
    setStatut(statutModeration(nom));
    setListe(listeNoire());
    setSequestres(paiementsEnAttente());
    setAppelsOuverts(tousLesAppelsOuverts());
    setTauxPlateforme(String(Math.round(tauxPlateformeSurCommission() * 100)));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    rafraichir();
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar titre="Modération anti-triche" />

      <div className="p-3.5 flex flex-col gap-2" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <div className="text-sm font-semibold">{organisateur}</div>
        <div className="flex gap-4 text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          <span>{stats.coeurs} cœurs</span>
          <span>{stats.coeursBrises} cœurs brisés</span>
        </div>
        <div
          className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 text-[11px]"
          style={{
            borderRadius: "var(--ds-radius-pill)",
            background: statut === "actif" ? "var(--ds-accent-900)" : "color-mix(in srgb, var(--ds-danger) 15%, transparent)",
            color: statut === "actif" ? "var(--ds-accent-300)" : "var(--ds-danger)",
          }}
        >
          {statut === "actif" ? <CheckCircle2 size={12} strokeWidth={2} /> : <AlertTriangle size={12} strokeWidth={2} />}
          {statut === "actif" ? "Actif" : statut === "suspendu" ? "Suspendu (vérification en cours)" : "Banni"}
        </div>
      </div>

      {statut === "suspendu" && (
        <div className="flex flex-col gap-2">
          <Button
            variante="primary"
            bloc
            onClick={() => {
              leverSuspension();
              rafraichir();
            }}
          >
            <CheckCircle2 size={16} strokeWidth={2} />
            Vérification OK · lever la suspension
          </Button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Confirmer la triche et bannir ce compte ? Sa pièce d'identité sera mise en liste noire.")) {
                confirmerTricheEtBannir(organisateur);
                rafraichir();
              }
            }}
            className="h-11 text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
            style={{ borderRadius: "var(--ds-radius-btn)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
          >
            <Ban size={16} strokeWidth={2} />
            Triche confirmée · bannir
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Part plateforme sur la commission organisateur</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={tauxPlateforme}
            onChange={(e) => setTauxPlateforme(e.target.value)}
            className="w-20 h-10 px-2.5 text-sm outline-none"
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          <span className="text-sm" style={{ color: "var(--ds-muted)" }}>%</span>
          <button
            type="button"
            onClick={() => {
              definirTauxPlateformeSurCommission((Number(tauxPlateforme) || 0) / 100);
              rafraichir();
            }}
            className="text-xs font-medium cursor-pointer px-2.5 py-2"
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Appels des résultats en cours</div>
        {appelsOuverts.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucun appel en cours.</p>
        ) : (
          appelsOuverts.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 p-2.5" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <div className="text-xs font-medium">{a.tournoiTitre}</div>
              <div className="text-xs" style={{ color: "var(--ds-muted)" }}>{a.auteur} : {a.motif}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    traiterAppel(a.id, "valide");
                    reevaluerPaiementsEnAttente();
                    rafraichir();
                  }}
                  className="flex-1 text-xs font-medium cursor-pointer px-2.5 py-1.5"
                  style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                >
                  Valider l&apos;appel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    traiterAppel(a.id, "rejete");
                    reevaluerPaiementsEnAttente();
                    rafraichir();
                  }}
                  className="flex-1 text-xs font-medium cursor-pointer px-2.5 py-1.5"
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Cash prize en séquestre</div>
        {sequestres.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucun paiement en attente.</p>
        ) : (
          sequestres.map((p) => (
            <div
              key={p.tournoiId}
              className="flex items-center gap-3 p-2.5"
              style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
            >
              <Lock size={14} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{p.titre}</div>
                <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{formatXof(p.montantXof)}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  libererSequestreCashPrize(p.tournoiId);
                  rafraichir();
                }}
                className="text-xs font-medium cursor-pointer px-2.5 py-1.5"
                style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
              >
                Libérer
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Liste noire (pièces d&apos;identité)</div>
        {liste.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucune entrée.</p>
        ) : (
          liste.map((e) => (
            <div key={e.documentNom + e.horodatage} className="p-2.5 text-xs" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <div className="font-medium">{e.documentNom}</div>
              <div style={{ color: "var(--ds-muted)" }}>{e.motif}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
