"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Plus, Trash2, X } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { EcussonEquipe } from "@/components/ds/Palier";
import { AvatarPile } from "@/components/ds/Avatar";
import { PRESS, Button } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { Modal } from "@/components/ds/Modal";
import { lireProfil } from "@/lib/mockProfil";
import { equipesDuJoueur, demandesEnAttente, TAILLE_EQUIPE_BR, type EquipeBR } from "@/lib/mockEquipesBR";
import { tournoiParId, estTermine, type Tournoi } from "@/lib/mockTournaments";
import {
  equipesProfilDontChef,
  creerEquipeProfil,
  renommerEquipeProfil,
  ajouterMembreEquipeProfil,
  retirerMembreEquipeProfil,
  supprimerEquipeProfil,
  MAX_EQUIPES_PROFIL,
  MAX_MEMBRES_EQUIPE_PROFIL,
  type EquipeProfil,
} from "@/lib/mockEquipesProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type EquipeAvecTournoi = { equipe: EquipeBR; tournoi: Tournoi; pending: number };

/** Panneau de gestion d'une équipe pré-créée (point 140) : renommage, ajout
 * et retrait de membres par pseudo, suppression — indépendant de tout
 * tournoi, contrairement aux équipes éphémères (point 54). */
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
  const [nom, setNom] = useState(equipe.nom);
  const [nouveauMembre, setNouveauMembre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function valider() {
    if (nom.trim() && nom.trim() !== equipe.nom) renommerEquipeProfil(equipe.id, nom.trim());
    onChange();
  }

  function ajouter() {
    const err = ajouterMembreEquipeProfil(equipe.id, nouveauMembre);
    if (err) {
      setErreur(err);
      return;
    }
    setErreur(null);
    setNouveauMembre("");
    onChange();
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

  return (
    <Modal ouvert titre="Gérer l'équipe" onFermer={onFermer}>
      <div className="flex flex-col gap-3.5 not-italic" style={{ whiteSpace: "normal" }}>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Nom de l'équipe" value={nom} onChange={(e) => setNom(e.target.value)} />
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
            <div className="flex gap-2">
              <div className="flex-1">
                <Field label="Ajouter un membre (pseudo)" value={nouveauMembre} onChange={(e) => setNouveauMembre(e.target.value)} placeholder="Pseudo exact" />
              </div>
            </div>
            {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
            <button
              type="button"
              onClick={ajouter}
              className={`h-10 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              Ajouter
            </button>
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
  const [onglet, setOnglet] = useState<"precreees" | "tournoi">("precreees");
  const [pseudo, setPseudo] = useState("");

  const [equipesProfil, setEquipesProfil] = useState<EquipeProfil[]>([]);
  const [creationOuverte, setCreationOuverte] = useState(false);
  const [nomCreation, setNomCreation] = useState("");
  const [equipeSelectionnee, setEquipeSelectionnee] = useState<EquipeProfil | null>(null);

  const [equipesTournoi, setEquipesTournoi] = useState<EquipeAvecTournoi[]>([]);

  function rafraichirEquipesProfil(moi: string) {
    setEquipesProfil(equipesProfilDontChef(moi));
  }

  useEffect(() => {
    const moi = lireProfil().pseudo;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPseudo(moi);
    rafraichirEquipesProfil(moi);
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

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              Mes équipes
            </div>
            <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {equipesProfil.length} pré-créée{equipesProfil.length > 1 ? "s" : ""} · {equipesTournoi.length} en tournoi
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
          ) : (
            <button
              type="button"
              onClick={() => router.push("/tournois")}
              aria-label="Rejoindre ou créer une équipe depuis un tournoi"
              className={`flex items-center justify-center w-9 h-9 shrink-0 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              <Plus size={16} strokeWidth={2} />
            </button>
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
            Pré-créées
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
            En tournoi
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
        ) : equipesTournoi.length === 0 ? (
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
