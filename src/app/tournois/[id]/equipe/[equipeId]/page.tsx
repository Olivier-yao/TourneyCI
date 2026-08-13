"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Copy, Crown, UserX, X } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Avatar } from "@/components/ds/Avatar";
import { Field } from "@/components/ds/Input";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId } from "@/lib/mockTournaments";
import { lireProfil } from "@/lib/mockProfil";
import {
  equipeParId,
  demandesEnAttente,
  approuverDemande,
  refuserDemande,
  retirerMembre,
  historiqueRetraits,
  lienInvitation,
  type EquipeBR,
  type DemandeEquipeBR,
  type RetraitEquipeBR,
} from "@/lib/mockEquipesBR";

export default function GestionEquipeBRPage() {
  const params = useParams<{ id: string; equipeId: string }>();
  const router = useRouter();
  const [equipe, setEquipe] = useState<EquipeBR | undefined>(undefined);
  const [demandes, setDemandes] = useState<DemandeEquipeBR[]>([]);
  const [retraits, setRetraits] = useState<RetraitEquipeBR[]>([]);
  const [monPseudo, setMonPseudo] = useState("");
  const [copie, setCopie] = useState(false);
  const [membreARetirer, setMembreARetirer] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  const tournoi = tournoiParId(params.id);

  function rafraichir() {
    const e = equipeParId(params.equipeId);
    setEquipe(e);
    if (e) {
      setDemandes(demandesEnAttente(e.id));
      setRetraits(historiqueRetraits(e.id));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonPseudo(lireProfil().pseudo);
    rafraichir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.equipeId]);

  if (!tournoi || !equipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Équipe introuvable.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  if (equipe.chef !== monPseudo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette page est réservée au chef de l&apos;équipe.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  const tournoiCommence = tournoi.enDirect || Boolean(tournoi.termine) || Boolean(tournoi.annule);

  function copierLien() {
    navigator.clipboard.writeText(lienInvitation(params.id, params.equipeId));
    setCopie(true);
    setTimeout(() => setCopie(false), 1800);
  }

  function confirmerRetrait() {
    if (!membreARetirer || !motif.trim()) return;
    retirerMembre(equipe!.id, membreARetirer, motif);
    setMembreARetirer(null);
    setMotif("");
    rafraichir();
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Gérer mon équipe" onRetour={() => router.push(`/tournois/${params.id}`)} />

      <div>
        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.titre}</div>
        <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          {equipe.nom}
        </div>
      </div>

      <button
        type="button"
        onClick={copierLien}
        className={`flex items-center gap-2.5 p-3 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        {copie ? <Check size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} /> : <Copy size={16} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />}
        <span className="text-sm font-medium" style={{ color: copie ? "var(--ds-accent-300)" : "var(--ds-text)" }}>
          {copie ? "Lien copié" : "Copier le lien d'invitation"}
        </span>
      </button>

      {demandes.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="text-sm font-medium">Demandes en attente</div>
          {demandes.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-2.5" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
              <Avatar initiales={d.demandeur.slice(0, 2).toUpperCase()} taille={32} />
              <div className="flex-1 text-sm font-medium truncate">{d.demandeur}</div>
              <button
                type="button"
                onClick={() => { approuverDemande(d.id); rafraichir(); }}
                className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                aria-label="Approuver"
              >
                <Check size={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => { refuserDemande(d.id); rafraichir(); }}
                className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                aria-label="Refuser"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-sm font-medium">Membres · {equipe.membres.length}</div>
        {equipe.membres.map((m) => (
          <div key={m} className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <Avatar initiales={m.slice(0, 2).toUpperCase()} taille={32} />
              <div className="flex-1 text-sm font-medium truncate flex items-center gap-1.5">
                {m}
                {m === equipe.chef && <Crown size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} aria-label="Chef d'équipe" />}
              </div>
              {m !== equipe.chef && !tournoiCommence && membreARetirer !== m && (
                <button
                  type="button"
                  onClick={() => { setMembreARetirer(m); setMotif(""); }}
                  className={`flex items-center gap-1 text-xs font-medium shrink-0 ${PRESS}`}
                  style={{ color: "var(--ds-danger)" }}
                >
                  <UserX size={13} strokeWidth={2} />
                  Retirer
                </button>
              )}
            </div>
            {membreARetirer === m && (
              <div className="flex flex-col gap-2 pl-2">
                <Field
                  label="Motif du retrait (obligatoire)"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex : injoignable avant le tournoi"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMembreARetirer(null)}
                    className={`flex-1 h-9 text-xs font-medium ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmerRetrait}
                    disabled={!motif.trim()}
                    className={`flex-[2] h-9 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-danger)", color: "#fff" }}
                  >
                    Confirmer le retrait
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {retraits.length > 0 && (
        <div className="flex flex-col gap-2 pb-6">
          <div className="text-sm font-medium" style={{ color: "var(--ds-muted)" }}>Historique des retraits</div>
          {retraits.map((r) => (
            <div key={r.id} className="text-xs p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
              <span style={{ color: "var(--ds-text)" }}>{r.membre}</span> — {r.motif}
              <div className="mt-0.5" style={{ fontFamily: "var(--ds-font-mono)" }}>
                {new Date(r.horodatage).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
