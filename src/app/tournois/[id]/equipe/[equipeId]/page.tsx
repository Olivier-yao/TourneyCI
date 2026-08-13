"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Copy, Crown, MoreVertical, Plus, UserX, X } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { EcussonEquipe } from "@/components/ds/Palier";
import { Field } from "@/components/ds/Input";
import { Modal } from "@/components/ds/Modal";
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
  TAILLE_EQUIPE_BR,
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
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [parametresOuverts, setParametresOuverts] = useState(false);

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
  const taille = tournoi.brSousType && tournoi.brSousType !== "solo" ? TAILLE_EQUIPE_BR[tournoi.brSousType] : equipe.membres.length;
  const placesLibres = Math.max(0, taille - equipe.membres.length);

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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => router.push(`/tournois/${params.id}`)}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style="accent" largeur={44} hauteur={50} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-lg truncate" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              {equipe.nom}
            </div>
            <Crown size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          </div>
          <div className="text-[10px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.titre.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4 flex-1">
        {demandes.length > 0 && (
          <div
            className="p-[15px] flex flex-col gap-3"
            style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent)" }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />
              <div className="flex-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                À valider · {demandes.length} demande{demandes.length > 1 ? "s" : ""}
              </div>
              <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {placesLibres} PLACE{placesLibres > 1 ? "S" : ""} LIBRE{placesLibres > 1 ? "S" : ""}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {demandes.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5 p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
                  <Avatar initiales={d.demandeur.slice(0, 2).toUpperCase()} taille={34} />
                  <div className="flex-1 text-sm font-medium truncate">{d.demandeur}</div>
                  <button
                    type="button"
                    onClick={() => { refuserDemande(d.id); rafraichir(); }}
                    className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                    aria-label="Refuser"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { approuverDemande(d.id); rafraichir(); }}
                    className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                    aria-label="Approuver"
                  >
                    <Check size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Effectif · {equipe.membres.length} sur {taille}
            </div>
            <button type="button" onClick={copierLien} className={`text-xs font-medium ${PRESS}`} style={{ color: "var(--ds-accent-300)" }}>
              {copie ? "Lien copié ✓" : "Inviter"}
            </button>
          </div>
          {equipe.membres.map((m) => (
            <div key={m} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                <Avatar initiales={m.slice(0, 2).toUpperCase()} taille={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-center gap-1.5">
                    {m}
                    {m === equipe.chef && <Crown size={11} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} aria-label="Chef d'équipe" />}
                  </div>
                </div>
                {m !== equipe.chef && !tournoiCommence ? (
                  <button
                    type="button"
                    onClick={() => { setMembreARetirer(membreARetirer === m ? null : m); setMotif(""); }}
                    className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
                    style={{ color: "var(--ds-muted)" }}
                    aria-label="Options"
                  >
                    <MoreVertical size={15} strokeWidth={2} />
                  </button>
                ) : (
                  <MoreVertical size={15} strokeWidth={2} style={{ color: "var(--ds-border)" }} />
                )}
              </div>
              {membreARetirer === m && (
                <div className="flex flex-col gap-2 pl-2 pb-2">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ds-danger)" }}>
                    <UserX size={13} strokeWidth={2} />
                    Retirer {m} de l&apos;équipe
                  </div>
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
          {Array.from({ length: placesLibres }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5" style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border)" }}>
              <div className="w-8 h-8 flex items-center justify-center" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px dashed var(--ds-border)", color: "var(--ds-muted)" }}>
                <Plus size={13} strokeWidth={2} />
              </div>
              <div className="flex-1 text-sm" style={{ color: "var(--ds-muted)" }}>
                Place {equipe.membres.length + i + 1} libre
              </div>
            </div>
          ))}

          {retraits.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoriqueOuvert(true)}
              className={`mt-2.5 flex items-center justify-between pt-3 ${PRESS}`}
              style={{ borderTop: "1px solid var(--ds-border)" }}
            >
              <div className="text-left">
                <div className="text-sm" style={{ color: "var(--ds-muted)" }}>Historique des retraits</div>
                <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {retraits.length} DÉPART{retraits.length > 1 ? "S" : ""}
                </div>
              </div>
              <ChevronRight size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={() => setParametresOuverts(true)}
          className={`w-full h-11 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Paramètres de l&apos;équipe
        </button>
      </div>

      <Modal ouvert={historiqueOuvert} titre="Historique des retraits" onFermer={() => setHistoriqueOuvert(false)}>
        <div className="flex flex-col gap-2 not-italic" style={{ whiteSpace: "normal" }}>
          {retraits.map((r) => (
            <div key={r.id} className="text-xs p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
              <span style={{ color: "var(--ds-text)" }}>{r.membre}</span> — {r.motif}
              <div className="mt-0.5" style={{ fontFamily: "var(--ds-font-mono)" }}>
                {new Date(r.horodatage).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal ouvert={parametresOuverts} titre="Paramètres de l'équipe" onFermer={() => setParametresOuverts(false)}>
        <div className="flex flex-col gap-2 not-italic" style={{ whiteSpace: "normal" }}>
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
        </div>
      </Modal>
    </div>
  );
}
