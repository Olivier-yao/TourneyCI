"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Plus, Trash2, X, Send, Check, Mail } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { EcussonEquipe } from "@/components/ds/Palier";
import { Avatar, AvatarPile } from "@/components/ds/Avatar";
import { PRESS, Button } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { Modal } from "@/components/ds/Modal";
import { lireProfil, tagDeJoueur } from "@/lib/mockProfil";
import { equipesDuJoueur, demandesEnAttente, creerEquipeBR, ajouterMembresDirect, TAILLE_EQUIPE_BR, type EquipeBR } from "@/lib/mockEquipesBR";
import { tournoiParId, estTermine, type Tournoi } from "@/lib/mockTournaments";
import {
  equipesProfilDontChef,
  creerEquipeProfil,
  renommerEquipeProfil,
  retirerMembreEquipeProfil,
  supprimerEquipeProfil,
  invitationsRecues,
  repondreInvitationEquipeProfil,
  inviterParTagEquipeProfil,
  apercuJoueurParTag,
  MAX_EQUIPES_PROFIL,
  MAX_MEMBRES_EQUIPE_PROFIL,
  type EquipeProfil,
  type InvitationEquipeProfil,
} from "@/lib/mockEquipesProfil";
import { propositionsEnAttentePourEquipe, traiterPropositionEquipe, type PropositionEquipe } from "@/lib/mockPropositionsEquipe";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type EquipeAvecTournoi = { equipe: EquipeBR; tournoi: Tournoi; pending: number };

/** Panneau de gestion d'une équipe pré-créée (point 140) : renommage,
 * invitation par TAG et retrait de membres, suppression — indépendant de
 * tout tournoi, contrairement aux équipes éphémères (point 54). Point 192 :
 * l'ajout d'un membre passe désormais par une invitation (recherche par TAG,
 * confirmation photo/TAG, acceptation par le joueur invité) plutôt qu'un
 * ajout direct par pseudo. Affiche aussi les propositions d'inscription en
 * tournoi envoyées par des membres non-chef, à valider ici. */
function GestionEquipeProfil({
  equipe,
  moi,
  onFermer,
  onChange,
}: {
  equipe: EquipeProfil;
  moi: string;
  onFermer: () => void;
  onChange: () => void;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(equipe.nom);
  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [tagRecherche, setTagRecherche] = useState("");
  const [profilTrouve, setProfilTrouve] = useState<{ nom: string } | undefined>(undefined);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
  const [messageInvitation, setMessageInvitation] = useState<string | null>(null);
  const [propositions, setPropositions] = useState<PropositionEquipe[]>(propositionsEnAttentePourEquipe(equipe.id));

  function valider() {
    if (!nom.trim() || nom.trim() === equipe.nom) return;
    const err = renommerEquipeProfil(equipe.id, nom.trim());
    if (err) {
      setErreurNom(err);
      return;
    }
    setErreurNom(null);
    onChange();
  }

  function rechercher() {
    setProfilTrouve(apercuJoueurParTag(tagRecherche));
    setRechercheEffectuee(true);
    setMessageInvitation(null);
  }

  function inviter() {
    const err = inviterParTagEquipeProfil(equipe.id, tagRecherche);
    if (err) {
      setMessageInvitation(err);
      return;
    }
    setMessageInvitation(`Invitation envoyée à ${profilTrouve?.nom}`);
    setTagRecherche("");
    setProfilTrouve(undefined);
    setRechercheEffectuee(false);
  }

  function retirer(membre: string) {
    retirerMembreEquipeProfil(equipe.id, membre);
    onChange();
  }

  function supprimer() {
    if (!window.confirm(`Supprimer l'équipe « ${equipe.nom} » ?`)) return;
    supprimerEquipeProfil(equipe.id);
    onFermer();
  }

  /** Le chef valide une proposition d'inscription (point 192) : l'équipe est
   * réellement inscrite maintenant (créée côté tournoi + membres intégrés
   * directement, déjà validés en amont) — s'il reste un paiement à faire, le
   * chef le finalise sur la fiche du tournoi (repli déjà géré par CtaInscription). */
  function accepterProposition(p: PropositionEquipe) {
    const equipeLive = creerEquipeBR(p.tournoiId, equipe.nom, moi, false);
    ajouterMembresDirect(equipeLive.id, equipe.membres.filter((m) => m !== moi));
    traiterPropositionEquipe(p.id, "validee");
    router.push(`/tournois/${p.tournoiId}`);
  }

  function refuserProposition(p: PropositionEquipe) {
    traiterPropositionEquipe(p.id, "refusee");
    setPropositions(propositionsEnAttentePourEquipe(equipe.id));
  }

  return (
    <Modal ouvert titre="Gérer l'équipe" onFermer={onFermer}>
      <div className="flex flex-col gap-3.5 not-italic" style={{ whiteSpace: "normal" }}>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field
              label="Nom de l'équipe"
              value={nom}
              onChange={(e) => { setNom(e.target.value); setErreurNom(null); }}
              erreur={erreurNom ?? undefined}
            />
          </div>
          <button
            type="button"
            onClick={valider}
            disabled={!nom.trim() || nom.trim() === equipe.nom}
            className={`h-11 px-3 text-xs font-medium disabled:opacity-40 shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            Renommer
          </button>
        </div>
        <p className="text-[11px] -mt-2.5" style={{ color: "var(--ds-muted)" }}>Modifiable une fois par mois.</p>

        {propositions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Propositions d&apos;inscription</label>
            {propositions.map((p) => {
              const tournoi = tournoiParId(p.tournoiId);
              return (
                <div key={p.id} className="flex items-center gap-2.5 p-2.5" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
                  <div className="flex-1 min-w-0 text-xs">
                    <strong>{p.proposeur}</strong> propose d&apos;inscrire l&apos;équipe
                    {tournoi && <div className="truncate" style={{ color: "var(--ds-muted)" }}>{tournoi.titre}</div>}
                  </div>
                  <button type="button" onClick={() => accepterProposition(p)} aria-label="Accepter" className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}>
                    <Check size={14} strokeWidth={2} />
                  </button>
                  <button type="button" onClick={() => refuserProposition(p)} aria-label="Refuser" className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Membres ({equipe.membres.length}/{MAX_MEMBRES_EQUIPE_PROFIL})
          </label>
          <div className="flex flex-col gap-1.5">
            {equipe.membres.map((m) => (
              <div key={m} className="flex items-center gap-2 px-3 py-2" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)" }}>
                <span className="flex-1 text-sm">{m}{m === equipe.chef ? " · chef" : ""}</span>
                {m !== moi && (
                  <button type="button" onClick={() => retirer(m)} aria-label={`Retirer ${m}`} className={PRESS}>
                    <X size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {equipe.membres.length < MAX_MEMBRES_EQUIPE_PROFIL && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Inviter par TAG</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Field
                  value={tagRecherche}
                  onChange={(e) => { setTagRecherche(e.target.value); setRechercheEffectuee(false); setProfilTrouve(undefined); setMessageInvitation(null); }}
                  placeholder="Ex: KADER_B"
                />
              </div>
              <button
                type="button"
                onClick={rechercher}
                disabled={!tagRecherche.trim()}
                className={`h-11 px-3 text-xs font-medium disabled:opacity-40 shrink-0 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              >
                Rechercher
              </button>
            </div>
            {rechercheEffectuee && (
              profilTrouve ? (
                <div className="flex items-center gap-2.5 p-2.5" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)" }}>
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
                    Inviter
                  </button>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--ds-danger)" }}>Aucun profil ne correspond à ce TAG.</p>
              )
            )}
            {messageInvitation && <p className="text-xs" style={{ color: "var(--ds-accent-300)" }}>{messageInvitation}</p>}
          </div>
        )}

        <button
          type="button"
          onClick={supprimer}
          className={`flex items-center justify-center gap-2 h-10 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
        >
          <Trash2 size={14} strokeWidth={2} />
          Supprimer l&apos;équipe
        </button>
      </div>
    </Modal>
  );
}

export default function MesEquipesPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [onglet, setOnglet] = useState<"precreees" | "tournoi" | "invitations">("precreees");
  const [pseudo, setPseudo] = useState("");

  const [equipesProfil, setEquipesProfil] = useState<EquipeProfil[]>([]);
  const [creationOuverte, setCreationOuverte] = useState(false);
  const [nomCreation, setNomCreation] = useState("");
  const [equipeSelectionnee, setEquipeSelectionnee] = useState<EquipeProfil | null>(null);

  const [equipesTournoi, setEquipesTournoi] = useState<EquipeAvecTournoi[]>([]);
  const [invitations, setInvitations] = useState<InvitationEquipeProfil[]>([]);

  function rafraichirEquipesProfil(moi: string) {
    setEquipesProfil(equipesProfilDontChef(moi));
  }

  function rafraichirInvitations(moi: string) {
    setInvitations(invitationsRecues(moi));
  }

  useEffect(() => {
    const moi = lireProfil().pseudo;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPseudo(moi);
    rafraichirEquipesProfil(moi);
    rafraichirInvitations(moi);
    const avecTournoi = equipesDuJoueur(moi)
      .filter((e) => !estTermine(e.tournoiId))
      .map((equipe) => {
        const tournoi = tournoiParId(equipe.tournoiId);
        if (!tournoi) return undefined;
        const pending = equipe.chef === moi ? demandesEnAttente(equipe.id).length : 0;
        return { equipe, tournoi, pending };
      })
      .filter((v): v is EquipeAvecTournoi => Boolean(v))
      .sort((a, b) => b.equipe.creeLe - a.equipe.creeLe);
    setEquipesTournoi(avecTournoi);
  }, []);

  if (!connecte) return null;

  function creer() {
    if (!nomCreation.trim()) return;
    const equipe = creerEquipeProfil(nomCreation.trim(), pseudo);
    if (!equipe) return;
    setNomCreation("");
    setCreationOuverte(false);
    rafraichirEquipesProfil(pseudo);
  }

  function repondre(invitation: InvitationEquipeProfil, accepter: boolean) {
    repondreInvitationEquipeProfil(invitation.id, accepter);
    rafraichirInvitations(pseudo);
  }

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              Mes équipes
            </div>
            <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {equipesProfil.length} créée{equipesProfil.length > 1 ? "s" : ""} par moi · {equipesTournoi.length} en tournoi{invitations.length > 0 ? ` · ${invitations.length} invitation${invitations.length > 1 ? "s" : ""}` : ""}
            </div>
          </div>
          {onglet === "precreees" ? (
            <button
              type="button"
              onClick={() => setCreationOuverte(true)}
              disabled={equipesProfil.length >= MAX_EQUIPES_PROFIL}
              aria-label="Créer une équipe"
              className={`flex items-center justify-center w-9 h-9 shrink-0 disabled:opacity-40 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              <Plus size={16} strokeWidth={2} />
            </button>
          ) : onglet === "tournoi" ? (
            <button
              type="button"
              onClick={() => router.push("/tournois")}
              aria-label="Rejoindre ou créer une équipe depuis un tournoi"
              className={`flex items-center justify-center w-9 h-9 shrink-0 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              <Plus size={16} strokeWidth={2} />
            </button>
          ) : (
            <div
              className="flex items-center justify-center w-9 h-9 shrink-0"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              aria-hidden
            >
              <Mail size={15} strokeWidth={2} />
            </div>
          )}
        </div>

        <div className="flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
          <button
            type="button"
            onClick={() => setOnglet("precreees")}
            className={`flex-1 h-[30px] text-xs font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "precreees" ? "var(--ds-accent-800)" : "transparent",
              color: onglet === "precreees" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            Mes équipes
          </button>
          <button
            type="button"
            onClick={() => setOnglet("tournoi")}
            className={`flex-1 h-[30px] text-xs font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "tournoi" ? "var(--ds-accent-800)" : "transparent",
              color: onglet === "tournoi" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            En tournois
          </button>
          <button
            type="button"
            onClick={() => setOnglet("invitations")}
            className={`relative flex-1 h-[30px] text-xs font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "invitations" ? "var(--ds-accent-800)" : "transparent",
              color: onglet === "invitations" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            Invitations
            {invitations.length > 0 && (
              <span
                className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--ds-accent-400)" }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 flex-1 flex flex-col gap-2.5">
        {onglet === "precreees" ? (
          equipesProfil.length === 0 ? (
            <EmptyState
              titre="Aucune équipe pré-créée"
              description="Crée jusqu'à 5 équipes fixes de 4 membres max, à sélectionner directement lors d'une inscription en duo/squad."
            />
          ) : (
            equipesProfil.map((equipe) => (
              <button
                key={equipe.id}
                type="button"
                onClick={() => setEquipeSelectionnee(equipe)}
                className={`p-[13px] flex items-center gap-3 text-left ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-border)" }}
              >
                <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style="accent" largeur={46} hauteur={52} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[15px] font-medium truncate">{equipe.nom}</div>
                    <Crown size={13} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-400)" }} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <AvatarPile initiales={equipe.membres.map((m) => m.slice(0, 2).toUpperCase())} />
                    <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {equipe.membres.length}/{MAX_MEMBRES_EQUIPE_PROFIL}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: "var(--ds-accent-300)" }}>
                  Gérer
                </span>
              </button>
            ))
          )
        ) : onglet === "tournoi" ? (
          equipesTournoi.length === 0 ? (
          <EmptyState
            titre="Aucune équipe en tournoi"
            description="Rejoins ou crée une équipe depuis un tournoi Battle Royale — ce repli disparaît automatiquement une fois le tournoi terminé."
          />
        ) : (
          equipesTournoi.map(({ equipe, tournoi, pending }) => {
            const estChef = equipe.chef === pseudo;
            const taille = tournoi.brSousType && tournoi.brSousType !== "solo" ? TAILLE_EQUIPE_BR[tournoi.brSousType] : equipe.membres.length;
            return (
              <button
                key={equipe.id}
                type="button"
                onClick={() => router.push(`/tournois/${tournoi.id}/equipe/${equipe.id}`)}
                className={`p-[13px] flex flex-col gap-2.5 text-left ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-lg)",
                  background: "var(--ds-surface)",
                  boxShadow: pending > 0 ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style={estChef ? "accent" : "neutre"} largeur={46} hauteur={52} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[15px] font-medium truncate">{equipe.nom}</div>
                      {estChef && <Crown size={13} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-400)" }} />}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {tournoi.jeuLabel.toUpperCase()} · {tournoi.titre}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 shrink-0"
                    style={{ borderRadius: "var(--ds-radius-pill)", background: tournoi.enDirect ? "var(--ds-accent-800)" : "transparent", border: tournoi.enDirect ? "none" : "1px solid var(--ds-border)", color: tournoi.enDirect ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)", fontSize: 9 }}
                  >
                    {tournoi.enDirect ? "EN DIRECT" : "À VENIR"}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <AvatarPile initiales={equipe.membres.slice(0, 4).map((m) => m.slice(0, 2).toUpperCase())} />
                  <div className="flex-1 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {equipe.membres.length} sur {taille}
                  </div>
                  {pending > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", fontFamily: "var(--ds-font-mono)", fontSize: 9, color: "var(--ds-accent-300)" }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: "var(--ds-accent-400)" }} />
                      {pending} demande{pending > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div
                  className="h-9 flex items-center justify-center text-xs font-medium"
                  style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${estChef ? "var(--ds-accent)" : "var(--ds-border)"}`, color: estChef ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                >
                  {estChef ? "Gérer l'équipe" : "Voir l'équipe"}
                </div>
              </button>
            );
          })
          )
        ) : invitations.length === 0 ? (
          <EmptyState
            titre="Aucune invitation"
            description="Les invitations à rejoindre une équipe pré-créée par TAG apparaissent ici, à accepter ou refuser."
          />
        ) : (
          invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-[13px] flex items-center gap-3"
              style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
            >
              <EcussonEquipe initiales={invitation.equipeNom.slice(0, 2).toUpperCase()} style="accent" largeur={46} hauteur={52} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate">{invitation.equipeNom}</div>
                <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  INVITÉ PAR {invitation.chef.toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => repondre(invitation, true)}
                aria-label="Accepter"
                className={`flex items-center justify-center w-9 h-9 shrink-0 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
              >
                <Check size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => repondre(invitation, false)}
                aria-label="Refuser"
                className={`flex items-center justify-center w-9 h-9 shrink-0 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>

      <Modal ouvert={creationOuverte} titre="Nouvelle équipe" onFermer={() => setCreationOuverte(false)}>
        <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            Jusqu&apos;à {MAX_MEMBRES_EQUIPE_PROFIL} membres, sélectionnable directement lors d&apos;une inscription en duo/squad.
          </p>
          <Field label="Nom de l'équipe" value={nomCreation} onChange={(e) => setNomCreation(e.target.value)} placeholder="Les Lions" />
          <Button variante="primary" onClick={creer} disabled={!nomCreation.trim()}>
            Créer
          </Button>
        </div>
      </Modal>

      {equipeSelectionnee && (
        <GestionEquipeProfil
          equipe={equipeSelectionnee}
          moi={pseudo}
          onFermer={() => {
            setEquipeSelectionnee(null);
            rafraichirEquipesProfil(pseudo);
          }}
          onChange={() => {
            rafraichirEquipesProfil(pseudo);
            const maj = equipesProfilDontChef(pseudo).find((e) => e.id === equipeSelectionnee.id);
            setEquipeSelectionnee(maj ?? null);
          }}
        />
      )}

      <TabBar />
    </div>
  );
}
