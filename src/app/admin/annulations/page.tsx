"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { AdminGate } from "@/components/ds/AdminGate";
import { annulerTournoi } from "@/lib/mockTournaments";
import { demandesEnAttente, traiterDemandeAnnulation, type DemandeAnnulation } from "@/lib/mockDemandesAnnulation";

/**
 * Écran d'administration (mock, même déterrent léger que /admin/moderation) :
 * consulte les demandes d'annulation en attente et les valide ou les
 * refuse (point 116). La validation déclenche annulerTournoi(), qui gère
 * déjà le remboursement automatique (point 22).
 */
export default function AnnulationsAdminPage() {
  return (
    <AdminGate>
      <AnnulationsAdminContenu />
    </AdminGate>
  );
}

function AnnulationsAdminContenu() {
  const [demandes, setDemandes] = useState<DemandeAnnulation[]>([]);

  function rafraichir() {
    setDemandes(demandesEnAttente());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    rafraichir();
  }, []);

  function valider(d: DemandeAnnulation) {
    if (!window.confirm(`Valider l'annulation de "${d.tournoiTitre}" ? Le tournoi passera au statut annulé et les inscrits seront remboursés.`)) return;
    annulerTournoi(d.tournoiId);
    traiterDemandeAnnulation(d.id, "validee");
    rafraichir();
  }

  function refuser(d: DemandeAnnulation) {
    traiterDemandeAnnulation(d.id, "refusee");
    rafraichir();
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar titre="Demandes d'annulation" />

      {demandes.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ds-muted)" }}>Aucune demande en attente.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {demandes.map((d) => (
            <div key={d.id} className="flex flex-col gap-2 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <div className="flex items-center gap-2">
                <Clock size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{d.tournoiTitre}</span>
              </div>
              <div className="text-xs" style={{ color: "var(--ds-muted)" }}>Organisateur : {d.organisateur}</div>
              <div className="text-sm" style={{ color: "var(--ds-text-muted)" }}>{d.motif}</div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => refuser(d)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer px-2.5 py-2"
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <XCircle size={13} strokeWidth={2} />
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => valider(d)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer px-2.5 py-2"
                  style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                >
                  <CheckCircle2 size={13} strokeWidth={2} />
                  Valider l&apos;annulation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
