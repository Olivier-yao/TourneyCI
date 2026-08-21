"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Crown, Send, UserMinus, MessageCircle, Trash2, LogOut, Check, X, Radio } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { Avatar } from "@/components/ds/Avatar";
import { EcussonEquipe } from "@/components/ds/Palier";
import { lireProfil, tagDeJoueur } from "@/lib/mockProfil";
import {
  equipeProfilParId,
  renommerEquipeProfil,
  retirerMembreEquipeProfil,
  supprimerEquipeProfil,
  inviterParTagEquipeProfil,
  apercuJoueurParTag,
  MAX_MEMBRES_EQUIPE_PROFIL,
  type EquipeProfil,
} from "@/lib/mockEquipesProfil";
import { propositionsEnAttentePourEquipe, traiterPropositionEquipe, type PropositionEquipe } from "@/lib/mockPropositionsEquipe";
import { creerEquipeBR, ajouterMembresDirect } from "@/lib/mockEquipesBR";
import { tournoiParId } from "@/lib/mockTournaments";
import { messagesChatEquipe } from "@/lib/mockChatEquipe";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

/** Page dédiée de gestion d'une équipe pré-créée (design v8, lot M4) —
 * remplace l'ancienne modale exiguë : le chef y gère renommage, invitation
 * par TAG, retrait de membres et propositions d'inscription en attente ; un
 * simple membre n'y voit qu'une liste en lecture seule + un bouton
 * "Quitter l'équipe". Le chat d'équipe (N1) est accessible en pied de page. */
export default function EquipeProfilPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [equipe, setEquipe] = useState<EquipeProfil | undefined>(undefined);
  const [moi, setMoi] = useState("");
  const [nbMessages, setNbMessages] = useState(0);

  const [editionNom, setEditionNom] = useState(false);
  const [nom, setNom] = useState("");
  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [tagRecherche, setTagRecherche] = useState("");
  const [profilTrouve, setProfilTrouve] = useState<{ nom: string } | undefined>(undefined);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
  const [messageInvitation, setMessageInvitation] = useState<string | null>(null);
  const [propositions, setPropositions] = useState<PropositionEquipe[]>([]);
  const [titresTournois, setTitresTournois] = useState<Record<string, string>>({});

  async function rafraichir() {
    const e = equipeProfilParId(params.id);
    setEquipe(e);
    if (e) {
      const props = propositionsEnAttentePourEquipe(e.id);
      setPropositions(props);
      setNbMessages(messagesChatEquipe(e.id).length);
      const entrees = await Promise.all(
        props.map(async (p) => [p.tournoiId, (await tournoiParId(p.tournoiId))?.titre] as const),
      );
      setTitresTournois(
        Object.fromEntries(entrees.filter((e2): e2 is [string, string] => e2[1] !== undefined)),
      );
    }
  }

  useEffect(() => {
    async function charger() {
      setMoi(lireProfil().pseudo);
      await rafraichir();
      setPret(true);
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!connecte || !pret) return null;

  if (!equipe || !equipe.membres.includes(moi)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Équipe introuvable.</p>
        <Link href="/mes-equipes" style={{ color: "var(--ds-accent-300)" }}>Retour à mes équipes</Link>
      </div>
    );
  }

  const estChef = equipe.chef === moi;

  function validerNom() {
    if (!equipe || !nom.trim() || nom.trim() === equipe.nom) { setEditionNom(false); return; }
    const err = renommerEquipeProfil(equipe.id, nom.trim());
    if (err) { setErreurNom(err); return; }
    setErreurNom(null);
    setEditionNom(false);
    rafraichir();
  }

  function rechercher() {
    setProfilTrouve(apercuJoueurParTag(tagRecherche));
    setRechercheEffectuee(true);
    setMessageInvitation(null);
  }

  function inviter() {
    if (!equipe) return;
    const err = inviterParTagEquipeProfil(equipe.id, tagRecherche);
    if (err) { setMessageInvitation(err); return; }
    setMessageInvitation(`Invitation envoyée à ${profilTrouve?.nom}`);
    setTagRecherche("");
    setProfilTrouve(undefined);
    setRechercheEffectuee(false);
  }

  function retirer(membre: string) {
    if (!equipe) return;
    retirerMembreEquipeProfil(equipe.id, membre);
    rafraichir();
  }

  function quitter() {
    if (!equipe) return;
    if (!window.confirm(`Quitter l'équipe « ${equipe.nom} » ?`)) return;
    retirerMembreEquipeProfil(equipe.id, moi);
    router.push("/mes-equipes");
  }

  function supprimer() {
    if (!equipe) return;
    if (!window.confirm(`Supprimer l'équipe « ${equipe.nom} » ? Cette action est irréversible.`)) return;
    supprimerEquipeProfil(equipe.id);
    router.push("/mes-equipes");
  }

  function accepterProposition(p: PropositionEquipe) {
    if (!equipe) return;
    const equipeLive = creerEquipeBR(p.tournoiId, equipe.nom, moi, false);
    ajouterMembresDirect(equipeLive.id, equipe.membres.filter((m) => m !== moi));
    traiterPropositionEquipe(p.id, "validee");
    router.push(`/tournois/${p.tournoiId}`);
  }

  function refuserProposition(p: PropositionEquipe) {
    traiterPropositionEquipe(p.id, "refusee");
    setPropositions(propositionsEnAttentePourEquipe(equipe!.id));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] pb-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--ds-divider, var(--ds-border))" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className={`flex items-center justify-center w-9 h-9 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style={estChef ? "accent" : "neutre"} largeur={42} hauteur={48} />
        <div className="flex-1 min-w-0">
          {editionNom ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={nom}
                onChange={(e) => { setNom(e.target.value); setErreurNom(null); }}
                onKeyDown={(e) => e.key === "Enter" && validerNom()}
                className="flex-1 min-w-0 h-8 px-2 text-sm outline-none"
                style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-accent)", borderRadius: "var(--ds-radius-sm)", color: "var(--ds-text)" }}
              />
              <button type="button" onClick={validerNom} className={PRESS} style={{ color: "var(--ds-accent-300)" }}>
                <Check size={16} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="text-base font-medium truncate">{equipe.nom}</div>
              {estChef && (
                <button
                  type="button"
                  onClick={() => { setNom(equipe.nom); setEditionNom(true); }}
                  className={PRESS}
                  aria-label="Renommer l'équipe"
                >
                  <Pencil size={13} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                </button>
              )}
            </div>
          )}
          {erreurNom && <p className="text-xs mt-0.5" style={{ color: "var(--ds-danger)" }}>{erreurNom}</p>}
          <div className="text-[9px] uppercase mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {estChef ? "Tu es chef" : "Membre"} · {equipe.membres.length}/{MAX_MEMBRES_EQUIPE_PROFIL}
          </div>
        </div>
      </div>

      <div className="px-5 pt-3.5 flex-1 flex flex-col gap-3.5 pb-6">
        {estChef && propositions.length > 0 && (
          <div className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
            <div className="flex items-center gap-2">
              <Radio size={12} strokeWidth={2} className="animate-pulse shrink-0" style={{ color: "var(--ds-accent-400)" }} />
              <div className="flex-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                {propositions.length} proposition{propositions.length > 1 ? "s" : ""} d&apos;inscription
              </div>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              {propositions.map((p) => {
                const titreTournoi = titresTournois[p.tournoiId];
                return (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-semibold">{p.proposeur}</span> propose d&apos;inscrire l&apos;équipe
                      {titreTournoi && <div className="truncate" style={{ color: "var(--ds-muted)" }}>{titreTournoi}</div>}
                    </div>
                    <button type="button" onClick={() => refuserProposition(p)} aria-label="Refuser" className={`w-8 h-8 flex items-center justify-center shrink-0 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                      <X size={13} strokeWidth={2} />
                    </button>
                    <button type="button" onClick={() => accepterProposition(p)} aria-label="Accepter" className={`w-8 h-8 flex items-center justify-center shrink-0 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}>
                      <Check size={13} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {estChef && equipe.membres.length < MAX_MEMBRES_EQUIPE_PROFIL && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Field
                value={tagRecherche}
                onChange={(e) => { setTagRecherche(e.target.value); setRechercheEffectuee(false); setProfilTrouve(undefined); setMessageInvitation(null); }}
                placeholder="Inviter par TAG…"
              />
            </div>
            <button
              type="button"
              onClick={rechercher}
              disabled={!tagRecherche.trim()}
              className={`h-11 px-3.5 text-xs font-medium disabled:opacity-40 shrink-0 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              Inviter
            </button>
          </div>
        )}
        {estChef && rechercheEffectuee && (
          profilTrouve ? (
            <div className="flex items-center gap-2.5 p-2.5 -mt-2" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)" }}>
              <Avatar initiales={profilTrouve.nom.slice(0, 2).toUpperCase()} taille={32} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{profilTrouve.nom}</div>
                <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>@{tagDeJoueur(profilTrouve.nom)}</div>
              </div>
              <button
                type="button"
                onClick={inviter}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold shrink-0 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
              >
                <Send size={12} strokeWidth={2} />
                Envoyer
              </button>
            </div>
          ) : (
            <p className="text-xs -mt-2" style={{ color: "var(--ds-danger)" }}>Aucun profil ne correspond à ce TAG.</p>
          )
        )}
        {estChef && messageInvitation && <p className="text-xs -mt-2" style={{ color: "var(--ds-accent-300)" }}>{messageInvitation}</p>}

        <div className="flex flex-col gap-0.5">
          <div className="text-[9px] uppercase tracking-wide mb-1.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Effectif · {equipe.membres.length} sur {MAX_MEMBRES_EQUIPE_PROFIL}
          </div>
          {equipe.membres.map((m) => (
            <div key={m} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
              <div
                className="flex items-center justify-center shrink-0 text-xs font-medium"
                style={{ width: 32, height: 32, borderRadius: "var(--ds-radius-pill)", background: m === equipe.chef ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: m === equipe.chef ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
              >
                {m.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="text-sm truncate">{m}</span>
                {m === equipe.chef && <Crown size={12} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-400)" }} />}
              </div>
              {estChef && m !== moi && (
                <button type="button" onClick={() => retirer(m)} aria-label={`Retirer ${m}`} className={PRESS}>
                  <UserMinus size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {estChef ? (
          <button
            type="button"
            onClick={supprimer}
            className={`flex items-center justify-center gap-2 h-10 text-sm font-medium mt-auto ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
          >
            <Trash2 size={14} strokeWidth={2} />
            Supprimer l&apos;équipe
          </button>
        ) : (
          <button
            type="button"
            onClick={quitter}
            className={`flex items-center justify-center gap-2 h-10 text-sm font-medium mt-auto ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
          >
            <LogOut size={14} strokeWidth={2} />
            Quitter l&apos;équipe
          </button>
        )}
      </div>

      <div className="px-5 py-3" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <Link
          href={`/mes-equipes/${equipe.id}/chat`}
          className={`h-11 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          <MessageCircle size={15} strokeWidth={2} />
          Chat d&apos;équipe{nbMessages > 0 ? ` · ${nbMessages}` : ""}
        </Link>
      </div>
    </div>
  );
}
