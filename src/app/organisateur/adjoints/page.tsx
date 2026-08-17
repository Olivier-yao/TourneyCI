"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Check, X, Trash2, UserPlus, Info } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import {
  inviterAdjoint,
  adjointsDe,
  invitationsRecues,
  accepterInvitation,
  retirerAdjoint,
  type Adjoint,
} from "@/lib/mockAdjointsOrganisateur";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

/** Écran dédié à la gestion des adjoints — sortis de la modale exiguë du
 * profil organisateur pour leur propre interface, avec assez d'espace pour
 * expliquer clairement le périmètre du rôle (soutien en supervision, jamais
 * les réglages ni l'annulation). */
export default function AdjointsPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [adjoints, setAdjoints] = useState<Adjoint[]>([]);
  const [invitationsEnAttente, setInvitationsEnAttente] = useState<Adjoint[]>([]);
  const [nomAjout, setNomAjout] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function rafraichir(nomActuel: string) {
    setAdjoints(adjointsDe(nomActuel));
    setInvitationsEnAttente(invitationsRecues(nomActuel));
  }

  useEffect(() => {
    const n = nomOrganisateurActuel();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNom(n);
    rafraichir(n);
  }, []);

  function ajouter() {
    const err = inviterAdjoint(nom, nomAjout);
    if (err) {
      setErreur(err);
      return;
    }
    setNomAjout("");
    setErreur(null);
    rafraichir(nom);
  }

  function retirer(nomAdjoint: string) {
    retirerAdjoint(nom, nomAdjoint);
    rafraichir(nom);
  }

  function repondre(proprietaire: string, accepte: boolean) {
    if (accepte) accepterInvitation(proprietaire, nom);
    else retirerAdjoint(proprietaire, nom);
    rafraichir(nom);
  }

  const accepres = adjoints.filter((a) => a.statut === "accepte");
  const enAttenteEnvoyees = adjoints.filter((a) => a.statut === "en_attente");

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Adjoints" onRetour={() => router.back()} />

      <div className="flex items-start gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <Info size={17} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
          Un adjoint accepté peut t&apos;aider à superviser <b>tous tes tournois</b> en direct — qualifications, infos
          de room, stream, check-in. Il n&apos;a jamais accès aux réglages d&apos;un tournoi (titre, règlement...) ni
          à la demande d&apos;annulation, réservés à toi seul.
        </p>
      </div>

      {invitationsEnAttente.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Invitations reçues
          </div>
          <div className="flex flex-col gap-2">
            {invitationsEnAttente.map((inv) => (
              <div
                key={inv.proprietaire}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
              >
                <div
                  className="flex items-center justify-center shrink-0 text-xs font-semibold"
                  style={{ width: 36, height: 36, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
                >
                  {initiales(inv.proprietaire)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{inv.proprietaire}</div>
                  <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>t&apos;invite comme adjoint</div>
                </div>
                <button
                  type="button"
                  onClick={() => repondre(inv.proprietaire, true)}
                  aria-label="Accepter"
                  className={`w-9 h-9 flex items-center justify-center shrink-0 ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                >
                  <Check size={15} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => repondre(inv.proprietaire, false)}
                  aria-label="Refuser"
                  className={`w-9 h-9 flex items-center justify-center shrink-0 ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Mes adjoints · {accepres.length}
        </div>
        {accepres.length === 0 && enAttenteEnvoyees.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Tu n&apos;as encore invité personne. Utilise le formulaire ci-dessous pour inviter un organisateur qui
            t&apos;aidera à superviser tes tournois en direct.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {accepres.map((a) => (
              <div
                key={a.adjoint}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                <div
                  className="flex items-center justify-center shrink-0 text-xs font-semibold"
                  style={{ width: 36, height: 36, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
                >
                  {initiales(a.adjoint)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.adjoint}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ds-accent-300)" }}>
                    <ShieldCheck size={11} strokeWidth={2} />
                    Adjoint actif
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => retirer(a.adjoint)}
                  aria-label={`Retirer ${a.adjoint}`}
                  className={`w-9 h-9 flex items-center justify-center shrink-0 ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
            {enAttenteEnvoyees.map((a) => (
              <div
                key={a.adjoint}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px dashed var(--ds-border)" }}
              >
                <div
                  className="flex items-center justify-center shrink-0 text-xs font-semibold"
                  style={{ width: 36, height: 36, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)", color: "var(--ds-muted)" }}
                >
                  {initiales(a.adjoint)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.adjoint}</div>
                  <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>Invitation en attente</div>
                </div>
                <button
                  type="button"
                  onClick={() => retirer(a.adjoint)}
                  aria-label={`Annuler l'invitation à ${a.adjoint}`}
                  className={`w-9 h-9 flex items-center justify-center shrink-0 ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <div className="flex items-center gap-2">
          <UserPlus size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          <span className="text-sm font-medium">Inviter un organisateur</span>
        </div>
        <input
          value={nomAjout}
          onChange={(e) => { setNomAjout(e.target.value); setErreur(null); }}
          placeholder="Nom de l'organisateur"
          className="h-11 px-3.5 text-sm outline-none"
          style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)" }}
        />
        {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
        <button
          type="button"
          onClick={ajouter}
          className={`h-11 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
        >
          Envoyer l&apos;invitation
        </button>
      </div>
    </div>
  );
}
