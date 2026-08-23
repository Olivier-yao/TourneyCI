"use client";

import { useEffect, useState } from "react";
import { Info, Lock } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { formatXof } from "@/lib/formatXof";
import {
  paiementsEnAttente,
  libererSequestreCashPrize,
  reevaluerPaiementsEnAttente,
  type PaiementEnAttente,
} from "@/lib/mockTournaments";
import { tousLesAppelsOuverts, traiterAppel, type Appel } from "@/lib/mockAppel";
import { AdminGate } from "@/components/ds/AdminGate";

/**
 * Outil d'administration (mock) : pas de rôle admin séparé dans l'app pour
 * l'appel des résultats et la libération du séquestre ci-dessous — accès
 * uniquement par URL directe (non lié dans la navigation), à remplacer par
 * un vrai back-office. Le bannissement/la suspension des organisateurs, qui
 * vivait ici, a été déplacé vers /tourney-control (vrai admin, session
 * server-side, cf. src/lib/server/moderation.ts) : cet écran-ci n'a jamais
 * pu agir que sur "l'organisateur de cet appareil" (aucun moyen de cibler un
 * autre compte), donc ne bannissait jamais personne d'autre que soi-même.
 */
export default function ModerationAdminPage() {
  return (
    <AdminGate>
      <ModerationAdminContenu />
    </AdminGate>
  );
}

function ModerationAdminContenu() {
  const [sequestres, setSequestres] = useState<PaiementEnAttente[]>([]);
  const [appelsOuverts, setAppelsOuverts] = useState<Appel[]>([]);

  async function rafraichir() {
    setSequestres(paiementsEnAttente());
    setAppelsOuverts(await tousLesAppelsOuverts());
  }

  useEffect(() => {
    rafraichir();
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar titre="Modération anti-triche" />

      <div className="flex items-start gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
        <Info size={15} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
        <div className="text-xs leading-snug" style={{ color: "var(--ds-text-muted)" }}>
          Le bannissement/la suspension des organisateurs se gère désormais depuis /tourney-control (onglet
          Modération), avec une vraie recherche par compte.
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
                  onClick={async () => {
                    await traiterAppel(a.id, "valide");
                    await reevaluerPaiementsEnAttente();
                    rafraichir();
                  }}
                  className="flex-1 text-xs font-medium cursor-pointer px-2.5 py-1.5"
                  style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                >
                  Valider l&apos;appel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await traiterAppel(a.id, "rejete");
                    await reevaluerPaiementsEnAttente();
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
                onClick={async () => {
                  await libererSequestreCashPrize(p.tournoiId);
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

    </div>
  );
}
