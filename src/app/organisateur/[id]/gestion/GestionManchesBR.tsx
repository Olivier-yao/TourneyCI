"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Info, CheckCircle2 } from "lucide-react";
import {
  unitesBR,
  manchesBR,
  ajouterMancheBR,
  mancheEnCoursBR,
  validerMancheEnDirect,
  LABEL_UNITE_BR,
  type SousTypeBR,
  type UniteBR,
  type MancheBR,
} from "@/lib/mockBattleRoyale";
import { notifierParticipants } from "@/lib/mockNotifications";
import { Modal } from "@/components/ds/Modal";
import { PRESS } from "@/components/ds/Button";
import { EcussonEquipe } from "@/components/ds/Palier";

export function GestionManchesBR({
  tournoiId,
  tournoiTitre,
  sousType,
  manchesPrevues,
  onEnregistre,
}: {
  tournoiId: string;
  tournoiTitre: string;
  sousType: SousTypeBR;
  manchesPrevues: number;
  onEnregistre: () => void;
}) {
  const [participants, setParticipants] = useState<UniteBR[]>([]);
  const [manches, setManches] = useState<MancheBR[]>([]);
  const [rafraichir, setRafraichir] = useState(0);
  const numeroSuivant = manches.length + 1;
  // Réhydrate depuis le dernier aperçu validé (point 205) : sans ça, revenir
  // sur cet écran après avoir quitté remet les points à zéro alors que
  // l'aperçu en direct affiché aux spectateurs, lui, reste correct.
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [eliminations, setEliminations] = useState<Record<string, number>>({});
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [valide, setValide] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      const [unites, mns, enCours] = await Promise.all([
        unitesBR(tournoiId, sousType),
        manchesBR(tournoiId),
        mancheEnCoursBR(tournoiId),
      ]);
      setParticipants(unites);
      setManches(mns);
      const initPlacements: Record<string, string> = {};
      for (const r of enCours) if (r.placement > 0) initPlacements[r.participantId] = String(r.placement);
      const initEliminations: Record<string, number> = {};
      for (const r of enCours) if (r.eliminations > 0) initEliminations[r.participantId] = r.eliminations;
      setPlacements(initPlacements);
      setEliminations(initEliminations);
      setValide(enCours.length > 0);
    }
    charger();
  }, [tournoiId, sousType, rafraichir]);

  function stepper(id: string, delta: number) {
    setEliminations((e) => ({ ...e, [id]: Math.max(0, (e[id] ?? 0) + delta) }));
    setValide(false);
  }

  const resultatsPrets = participants
    .map((p) => ({
      participantId: p.id,
      placement: Number(placements[p.id]) || 0,
      eliminations: eliminations[p.id] ?? 0,
    }))
    .filter((r) => r.placement > 0 || r.eliminations > 0);

  /** Point 205 : pousse un aperçu provisoire visible des spectateurs (classement
   * en direct) sans clôturer la manche — même logique que le bouton "Valider"
   * du point 151 pour les matchs 1v1. */
  async function valider() {
    if (resultatsPrets.length === 0) return;
    await validerMancheEnDirect(tournoiId, resultatsPrets);
    setValide(true);
  }

  async function cloturer() {
    if (resultatsPrets.length === 0) return;
    const resultat = await ajouterMancheBR(tournoiId, resultatsPrets);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Impossible d'enregistrer cette manche pour l'instant.");
      setConfirmationOuverte(false);
      setRafraichir((n) => n + 1);
      return;
    }
    await notifierParticipants(tournoiId, tournoiTitre, `Manche ${numeroSuivant} enregistrée — classement mis à jour`);
    setPlacements({});
    setEliminations({});
    setValide(false);
    setErreur(null);
    setConfirmationOuverte(false);
    setRafraichir((n) => n + 1);
    onEnregistre();
  }

  if (participants.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Aucun participant chargé pour ce battle royale pour l&apos;instant.
      </p>
    );
  }

  // Bug rapporté : rien n'empêchait d'ajouter des manches indéfiniment
  // au-delà du nombre prévu à la création — le tournoi ne se clôturait
  // jamais (cf. le même garde-fou côté serveur, POST /api/tournois/[id]/
  // manches-br). Une fois la cible atteinte, plus de formulaire de saisie :
  // la clôture automatique prend le relais sous 2 minutes.
  if (manches.length >= manchesPrevues) {
    return (
      <div className="flex items-start gap-2.5 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
        <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium">Toutes les manches prévues sont jouées</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            {manches.length} sur {manchesPrevues} manche{manchesPrevues > 1 ? "s" : ""} — le tournoi se clôture automatiquement
            (points de classement + gains) sous 2 minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="text-[10px] tracking-wide uppercase shrink-0" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
          Manche {numeroSuivant}
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--ds-border)" }} />
        <div className="text-[9px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {participants.length} {LABEL_UNITE_BR[sousType].pluriel}
        </div>
      </div>
      <div className="flex items-center gap-2.5 px-2.5">
        <div className="flex-1 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {LABEL_UNITE_BR[sousType].singulier}
        </div>
        <div className="w-14 text-center text-[9px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>PLACE</div>
        <div className="w-[100px] text-center text-[9px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>ÉLIMS</div>
      </div>
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {participants.map((p) => {
          const rempli = Boolean(placements[p.id]) || (eliminations[p.id] ?? 0) > 0;
          return (
            <div
              key={p.id}
              className="flex items-center gap-2.5 p-2.5"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: rempli ? "0 0 0 1px var(--ds-accent)" : "var(--ds-shadow-sm, none)" }}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2.5">
                <EcussonEquipe initiales={p.nom.split(" ").map((m) => m[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()} style={rempli ? "profond" : "neutre"} largeur={26} hauteur={30} />
                <span className="text-sm truncate min-w-0">{p.nom}</span>
              </div>
              <input
                type="number"
                min={0}
                placeholder="—"
                value={placements[p.id] ?? ""}
                onChange={(e) => {
                  setPlacements((v) => ({ ...v, [p.id]: e.target.value }));
                  setValide(false);
                }}
                className="text-sm text-center shrink-0"
                style={{
                  width: 56,
                  height: 30,
                  borderRadius: "var(--ds-radius-sm)",
                  background: "var(--ds-bg)",
                  border: `1px solid ${rempli ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  color: rempli ? "var(--ds-accent-300)" : "var(--ds-text)",
                }}
              />
              <div className="flex items-center gap-1.5 shrink-0" style={{ width: 100 }}>
                <button
                  type="button"
                  onClick={() => stepper(p.id, -1)}
                  className="flex items-center justify-center w-7 h-7 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Minus size={12} strokeWidth={2} />
                </button>
                <span className="flex-1 text-center text-sm" style={{ fontFamily: "var(--ds-font-mono)" }}>
                  {eliminations[p.id] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => stepper(p.id, 1)}
                  className="flex items-center justify-center w-7 h-7 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={valider}
        disabled={resultatsPrets.length === 0}
        className={`h-11 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: valide ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
        title="Met à jour le classement affiché aux spectateurs, sans clôturer la manche"
      >
        {valide ? "Aperçu validé — visible des spectateurs" : "Valider (aperçu en direct)"}
      </button>

      <Link
        href={`/tournois/${tournoiId}/battle-royale`}
        className="text-sm font-medium"
        style={{ color: "var(--ds-accent-300)" }}
      >
        Voir le classement en direct →
      </Link>

      {/* Point 203 : un seul bouton de clôture, définitif, tout en bas. */}
      <div className="flex flex-col gap-2 pt-2">
        <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
          La clôture fige la manche {numeroSuivant} et l&apos;ajoute au classement cumulé — irréversible, à faire une fois tous les résultats saisis.
        </p>
        {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
        <button
          type="button"
          onClick={() => setConfirmationOuverte(true)}
          disabled={resultatsPrets.length === 0}
          className={`h-11 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
        >
          Clôturer la manche
        </button>
      </div>

      <Modal ouvert={confirmationOuverte} titre={`Clôturer la manche ${numeroSuivant}`} onFermer={() => setConfirmationOuverte(false)}>
        <div className="flex flex-col gap-2.5 not-italic" style={{ whiteSpace: "normal" }}>
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            {resultatsPrets.length} résultat{resultatsPrets.length > 1 ? "s" : ""} vont être enregistrés. Le classement de la manche
            {" "}{numeroSuivant} sera figé et communiqué aux participants — vérifie les placements et éliminations avant de continuer.
          </p>
          <div className="flex items-start gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <Info size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              En cas d&apos;erreur ou d&apos;incident nécessitant l&apos;annulation du tournoi, cette clôture de manche ne l&apos;empêche
              pas : utilise la demande d&apos;annulation motivée depuis la section Clôture du tournoi, elle sera examinée par
              l&apos;administration.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setConfirmationOuverte(false)}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={cloturer}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Confirmer la clôture
          </button>
        </div>
      </Modal>
    </div>
  );
}
