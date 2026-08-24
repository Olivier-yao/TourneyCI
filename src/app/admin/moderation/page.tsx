"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { tousLesAppelsOuverts, traiterAppel, type Appel } from "@/lib/mockAppel";
import { AdminGate } from "@/components/ds/AdminGate";

/**
 * Outil d'administration (mock) : pas de rôle admin séparé dans l'app pour
 * l'appel des résultats ci-dessous — accès uniquement par URL directe (non
 * lié dans la navigation), à remplacer par un vrai back-office. Le
 * bannissement/la suspension des organisateurs, qui vivait ici, a été
 * déplacé vers /tourney-control (vrai admin, session server-side, cf.
 * src/lib/server/moderation.ts) : cet écran-ci n'a jamais pu agir que sur
 * "l'organisateur de cet appareil" (aucun moyen de cibler un autre compte),
 * donc ne bannissait jamais personne d'autre que soi-même.
 */
export default function ModerationAdminPage() {
  return (
    <AdminGate>
      <ModerationAdminContenu />
    </AdminGate>
  );
}

function ModerationAdminContenu() {
  const [appelsOuverts, setAppelsOuverts] = useState<Appel[]>([]);

  async function rafraichir() {
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
    </div>
  );
}
