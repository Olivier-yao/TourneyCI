"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Plus, Check, X, Mail, Users, MessageCircle, LogOut } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { EcussonEquipe } from "@/components/ds/Palier";
import { AvatarPile } from "@/components/ds/Avatar";
import { PRESS, Button } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { Modal } from "@/components/ds/Modal";
import { lireProfil } from "@/lib/mockProfil";
import { equipesDuJoueur, demandesEnAttente, TAILLE_EQUIPE_BR, type EquipeBR } from "@/lib/mockEquipesBR";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";
import {
  equipesProfilDontChef,
  equipesProfilDontMembreNonChef,
  creerEquipeProfil,
  retirerMembreEquipeProfil,
  invitationsRecues,
  repondreInvitationEquipeProfil,
  MAX_EQUIPES_PROFIL,
  MAX_MEMBRES_EQUIPE_PROFIL,
  type EquipeProfil,
  type InvitationEquipeProfil,
} from "@/lib/mockEquipesProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type EquipeAvecTournoi = { equipe: EquipeBR; tournoi: Tournoi; pending: number };

export default function MesEquipesPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [onglet, setOnglet] = useState<"precreees" | "tournoi" | "invitations">("precreees");
  const [pseudo, setPseudo] = useState("");

  const [equipesProfil, setEquipesProfil] = useState<EquipeProfil[]>([]);
  const [equipesMembre, setEquipesMembre] = useState<EquipeProfil[]>([]);
  const [creationOuverte, setCreationOuverte] = useState(false);
  const [nomCreation, setNomCreation] = useState("");

  const [equipesTournoi, setEquipesTournoi] = useState<EquipeAvecTournoi[]>([]);
  const [invitations, setInvitations] = useState<InvitationEquipeProfil[]>([]);
  const [erreurInvitation, setErreurInvitation] = useState<string | null>(null);

  function rafraichirEquipesProfil(moi: string) {
    setEquipesProfil(equipesProfilDontChef(moi));
    // Équipes rejointes en tant que simple membre (invitation acceptée) —
    // sans ça, accepter une invitation ne montre jamais nulle part que
    // l'équipe a bien été rejointe.
    setEquipesMembre(equipesProfilDontMembreNonChef(moi));
  }

  function rafraichirInvitations(moi: string) {
    setInvitations(invitationsRecues(moi));
  }

  useEffect(() => {
    async function charger() {
      const moi = lireProfil().pseudo;
      setPseudo(moi);
      rafraichirEquipesProfil(moi);
      rafraichirInvitations(moi);
      const brut = await Promise.all(
        equipesDuJoueur(moi).map(async (equipe) => {
          const tournoi = await tournoiParId(equipe.tournoiId);
          if (!tournoi || tournoi.termine) return undefined;
          const pending = equipe.chef === moi ? demandesEnAttente(equipe.id).length : 0;
          return { equipe, tournoi, pending };
        }),
      );
      const avecTournoi = brut
        .filter((v): v is EquipeAvecTournoi => Boolean(v))
        .sort((a, b) => b.equipe.creeLe - a.equipe.creeLe);
      setEquipesTournoi(avecTournoi);
    }
    charger();
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
    const err = repondreInvitationEquipeProfil(invitation.id, accepter);
    setErreurInvitation(err);
    rafraichirInvitations(pseudo);
    if (accepter && !err) rafraichirEquipesProfil(pseudo);
  }

  function quitter(equipe: EquipeProfil) {
    if (!window.confirm(`Quitter l'équipe « ${equipe.nom} » ?`)) return;
    retirerMembreEquipeProfil(equipe.id, pseudo);
    rafraichirEquipesProfil(pseudo);
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
              {equipesProfil.length} dirigée{equipesProfil.length > 1 ? "s" : ""} · {equipesMembre.length} rejointe{equipesMembre.length > 1 ? "s" : ""}{invitations.length > 0 ? ` · ${invitations.length} invitation${invitations.length > 1 ? "s" : ""}` : ""}
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
          equipesProfil.length === 0 && equipesMembre.length === 0 ? (
            <EmptyState
              titre="Aucune équipe pré-créée"
              description="Crée jusqu'à 5 équipes fixes de 4 membres max, à sélectionner directement lors d'une inscription en duo/squad."
            />
          ) : (
            <>
              {equipesProfil.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Crown size={12} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-400)" }} />
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                      Je dirige
                    </div>
                    <div className="flex-1 h-px" style={{ background: "var(--ds-accent-800)" }} />
                  </div>
                  {equipesProfil.map((equipe) => (
                    <Link
                      key={equipe.id}
                      href={`/mes-equipes/${equipe.id}`}
                      className={`p-[13px] flex items-center gap-3 ${PRESS}`}
                      style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
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
                    </Link>
                  ))}
                </div>
              )}

              {equipesMembre.length > 0 && (
                <div className="flex flex-col gap-2 mt-1.5">
                  <div className="flex items-center gap-2">
                    <Users size={12} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-muted)" }} />
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      J&apos;ai rejoint
                    </div>
                    <div className="flex-1 h-px" style={{ background: "var(--ds-border)" }} />
                  </div>
                  {equipesMembre.map((equipe) => (
                    <div
                      key={equipe.id}
                      className="p-[13px] flex flex-col gap-2.5"
                      style={{ borderRadius: "var(--ds-radius-lg)", border: "1px solid var(--ds-border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style="neutre" largeur={40} hauteur={46} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{equipe.nom}</div>
                          <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                            {equipe.membres.length}/{MAX_MEMBRES_EQUIPE_PROFIL}
                          </div>
                        </div>
                        <div
                          className="px-2.5 py-1 shrink-0 text-[9px]"
                          style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
                        >
                          MEMBRE
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-0.5">
                        <div
                          className="flex items-center justify-center shrink-0 text-[8px] font-medium"
                          style={{ width: 20, height: 20, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
                        >
                          {equipe.chef.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          CHEF · {equipe.chef}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Link
                          href={`/mes-equipes/${equipe.id}/chat`}
                          className={`flex-1 h-[34px] flex items-center justify-center gap-1.5 text-[11px] font-medium ${PRESS}`}
                          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                        >
                          <MessageCircle size={13} strokeWidth={2} />
                          Chat
                        </Link>
                        <Link
                          href={`/mes-equipes/${equipe.id}`}
                          className={`flex-1 h-[34px] flex items-center justify-center gap-1.5 text-[11px] font-medium ${PRESS}`}
                          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                        >
                          <Users size={13} strokeWidth={2} />
                          Membres
                        </Link>
                        <button
                          type="button"
                          onClick={() => quitter(equipe)}
                          className={`flex-1 h-[34px] flex items-center justify-center gap-1.5 text-[11px] font-medium ${PRESS}`}
                          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                        >
                          <LogOut size={13} strokeWidth={2} />
                          Quitter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
          <>
            {erreurInvitation && (
              <div className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}>
                <p className="text-xs">{erreurInvitation}</p>
              </div>
            )}
            {invitations.map((invitation) => (
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
            ))}
          </>
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

      <TabBar />
    </div>
  );
}
