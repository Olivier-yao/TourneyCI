"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, BadgeCheck, Check, X, Trash2, UserPlus, ArrowDownToLine, ArrowUpFromLine, Hourglass } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { tousLesTournois, type Tournoi } from "@/lib/mockTournaments";
import { classementOrganisateurs } from "@/lib/mockClassementOrganisateurs";
import {
  inviterAdjoint,
  adjointsDe,
  invitationsRecues,
  accepterInvitation,
  retirerAdjoint,
  proprietairesSupervises,
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

type GroupeSupervision = { organisateur: string; certifie: boolean; tournois: Tournoi[] };

/** Écran dédié à la gestion des adjoints — deux sens de supervision affichés
 * en onglets séparés (design v8, lot M) : "Mes adjoints" = les joueurs que
 * j'ai invités pour m'aider, "À superviser" = les tournois d'organisateurs
 * qui m'ont nommé adjoint. Les deux se ressemblaient trop empilés sur un
 * seul écran, d'où la confusion possible sur qui supervise qui. */
export default function AdjointsPage() {
  const router = useRouter();
  const [onglet, setOnglet] = useState<"mine" | "super">("mine");
  const [nom, setNom] = useState("");
  const [adjoints, setAdjoints] = useState<Adjoint[]>([]);
  const [invitationsEnAttente, setInvitationsEnAttente] = useState<Adjoint[]>([]);
  const [nomAjout, setNomAjout] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [groupesSupervision, setGroupesSupervision] = useState<GroupeSupervision[]>([]);

  function rafraichir(nomActuel: string) {
    setAdjoints(adjointsDe(nomActuel));
    setInvitationsEnAttente(invitationsRecues(nomActuel));
    const proprietaires = proprietairesSupervises(nomActuel);
    const certifies = new Map(classementOrganisateurs().map((o) => [o.nom, o.certifie]));
    const tous = tousLesTournois();
    setGroupesSupervision(
      proprietaires
        .map((p) => ({
          organisateur: p,
          certifie: certifies.get(p) ?? false,
          tournois: tous.filter((t) => t.organisateur === p && !t.termine && !t.annule),
        }))
        .filter((g) => g.tournois.length > 0),
    );
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
  const totalTournoisSupervises = groupesSupervision.reduce((s, g) => s + g.tournois.length, 0);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Adjoints" onRetour={() => router.back()} />

      <div className="flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => setOnglet("mine")}
          className={`flex-1 h-9 px-1.5 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", background: onglet === "mine" ? "var(--ds-accent-800)" : "transparent", color: onglet === "mine" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
        >
          <ArrowDownToLine size={14} strokeWidth={2} />
          Mes adjoints
        </button>
        <button
          type="button"
          onClick={() => setOnglet("super")}
          className={`flex-1 h-9 px-1.5 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", background: onglet === "super" ? "var(--ds-accent-800)" : "transparent", color: onglet === "super" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
        >
          <ArrowUpFromLine size={14} strokeWidth={2} />
          À superviser
          {invitationsEnAttente.length > 0 && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--ds-accent-400)" }}
            />
          )}
        </button>
      </div>

      {onglet === "mine" ? (
        <>
          <div className="flex items-start gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm, none)" }}>
            <ArrowDownToLine size={16} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent-400)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
              <b style={{ color: "var(--ds-text)" }}>Tu délègues.</b> Ces joueurs peuvent saisir les scores de tes tournois, sans toucher aux paiements ni au séquestre.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Actifs · {accepres.length}
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
                    style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm, none)" }}
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
                    style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border)" }}
                  >
                    <Hourglass size={15} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-muted)" }} />
                    <div className="flex-1 min-w-0 text-xs" style={{ color: "var(--ds-muted)" }}>
                      Invitation envoyée à <span style={{ color: "var(--ds-text)" }}>{a.adjoint}</span>, en attente de réponse
                    </div>
                    <button
                      type="button"
                      onClick={() => retirer(a.adjoint)}
                      aria-label={`Annuler l'invitation à ${a.adjoint}`}
                      className={`w-8 h-8 flex items-center justify-center shrink-0 ${PRESS}`}
                      style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
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

          <p className="text-[10px] uppercase tracking-wide text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Un adjoint ne voit ni solde ni séquestre
          </p>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}>
            <ArrowUpFromLine size={16} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent-300)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
              <b style={{ color: "var(--ds-text)" }}>Tu assistes.</b> Tournois d&apos;organisateurs qui t&apos;ont nommé adjoint — tu y saisis les scores, tu n&apos;en es pas le propriétaire.
            </p>
          </div>

          {invitationsEnAttente.length > 0 && (
            <div className="flex flex-col gap-2">
              {invitationsEnAttente.map((inv) => (
                <div
                  key={inv.proprietaire}
                  className="flex items-center gap-3 p-3"
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
                >
                  <Link
                    href={`/organisateur/profil/${encodeURIComponent(inv.proprietaire)}`}
                    className={`flex-1 min-w-0 flex items-center gap-3 ${PRESS}`}
                  >
                    <div
                      className="flex items-center justify-center shrink-0 text-xs font-semibold"
                      style={{ width: 36, height: 36, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
                    >
                      {initiales(inv.proprietaire)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{inv.proprietaire}</div>
                      <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>t&apos;invite comme adjoint · voir le profil</div>
                    </div>
                  </Link>
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
          )}

          {groupesSupervision.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
              Aucun tournoi à superviser pour l&apos;instant — dès qu&apos;un organisateur t&apos;accepte comme adjoint, ses tournois en cours apparaissent ici.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {groupesSupervision.map((g) => (
                <div key={g.organisateur} className="flex flex-col gap-2">
                  <Link href={`/organisateur/profil/${encodeURIComponent(g.organisateur)}`} className="flex items-center gap-2.5 pl-0.5">
                    <div className="relative shrink-0">
                      <div
                        className="flex items-center justify-center text-[10px] font-medium"
                        style={{ width: 28, height: 28, borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
                      >
                        {initiales(g.organisateur)}
                      </div>
                      {g.certifie && (
                        <div
                          className="absolute -right-1 -bottom-1 flex items-center justify-center"
                          style={{ width: 13, height: 13, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-700)", border: "1.5px solid var(--ds-bg)", color: "var(--ds-accent-100)" }}
                        >
                          <BadgeCheck size={8} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{g.organisateur}</div>
                      <div className="text-[9px] uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        {g.tournois.length} tournoi{g.tournois.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col gap-1.5 ml-3.5 pl-3" style={{ borderLeft: "1px solid var(--ds-accent-800)" }}>
                    {g.tournois.map((t) => (
                      <Link
                        key={t.id}
                        href={`/organisateur/${t.id}/gestion`}
                        className={`p-2.5 ${PRESS}`}
                        style={{
                          borderRadius: "var(--ds-radius-md)",
                          background: t.enDirect ? "var(--ds-surface)" : "transparent",
                          boxShadow: t.enDirect ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {t.enDirect ? (
                            <LiveBadge />
                          ) : (
                            <span className="flex-1" />
                          )}
                          <div className="flex-1 min-w-0 text-right text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                            {t.dateLabel}
                          </div>
                        </div>
                        <div className="mt-1.5 text-sm font-medium truncate">{t.titre}</div>
                        <div className="mt-0.5 text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {t.jeuLabel}
                        </div>
                        <div
                          className="mt-2 h-8 flex items-center justify-center gap-1.5 text-xs font-medium"
                          style={{ borderRadius: "var(--ds-radius-sm)", border: `1px solid ${t.enDirect ? "var(--ds-accent)" : "var(--ds-border)"}`, color: t.enDirect ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                        >
                          {t.enDirect ? "Saisir les scores" : "Voir la gestion"}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {groupesSupervision.length > 0 && (
            <p className="text-[10px] uppercase tracking-wide text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {groupesSupervision.length} organisateur{groupesSupervision.length > 1 ? "s" : ""} · {totalTournoisSupervises} tournoi{totalTournoisSupervises > 1 ? "s" : ""} suivi{totalTournoisSupervises > 1 ? "s" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}
