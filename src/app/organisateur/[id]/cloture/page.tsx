"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Radio, AlertTriangle } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { Modal } from "@/components/ds/Modal";
import { tournoiParId, terminerTournoi, type Tournoi } from "@/lib/mockTournaments";
import { classementFinalBracket } from "@/lib/mockBracket";
import { classementFinalBR, manchesBR } from "@/lib/mockBattleRoyale";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { creerDemandeAnnulation, demandeAnnulationPourTournoi, type DemandeAnnulation } from "@/lib/mockDemandesAnnulation";

/** Écran dédié de clôture (revu suite au retour utilisateur : la clôture et
 * ses informations doivent vivre derrière leur propre bouton "Clôture" avec
 * une mise en garde, pas en ancre inline sur la page de gestion).
 *
 * La clôture n'est jamais déclenchée manuellement (point 119) : dès que le
 * classement final est calculable (dernier match/manche validé), le tournoi
 * passe automatiquement au statut "terminé" — aucun gain n'est jamais versé
 * avant ce moment précis (point 118), qui est le seul endroit du code où
 * terminerTournoi() est appelé. */
export default function ClotureTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [estProprietaire, setEstProprietaire] = useState(false);
  const [resultat, setResultat] = useState<{ pointsAttribues: number; gainCredite: number } | null>(null);
  const [demandeOuverte, setDemandeOuverte] = useState(false);
  const [motif, setMotif] = useState("");
  const [demandeEnAttente, setDemandeEnAttente] = useState<DemandeAnnulation | undefined>(undefined);

  function rafraichirTournoi() {
    setTournoi(tournoiParId(params.id));
  }

  useEffect(() => {
    const t = tournoiParId(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournoi(t);
    setAutorise(Boolean(t) && peutSuperviser(t!.organisateur, nomOrganisateurActuel()));
    setEstProprietaire(t?.organisateur === nomOrganisateurActuel());
    setDemandeEnAttente(demandeAnnulationPourTournoi(params.id));
    setPret(true);
  }, [params.id]);

  const manchesJouees = tournoi?.type === "battle_royale" ? manchesBR(params.id).length : 0;
  const classement = tournoi
    ? tournoi.type === "battle_royale"
      ? classementFinalBR(params.id, tournoi.brSousType ?? "solo")
      : classementFinalBracket(params.id)
    : [];
  // Pour un Battle Royale, "prêt" attend le nombre de manches choisi par
  // l'organisateur à la création — pas juste la première manche jouée.
  const cloturePret = tournoi
    ? tournoi.type === "battle_royale"
      ? manchesJouees > 0 && manchesJouees >= (tournoi.manchesPrevues ?? 1)
      : classement.length > 0
    : false;

  useEffect(() => {
    if (tournoi && cloturePret && !tournoi.termine && !resultat) {
      const r = terminerTournoi(params.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResultat(r);
      rafraichirTournoi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloturePret, tournoi?.termine]);

  function envoyerDemande() {
    if (!motif.trim() || !tournoi) return;
    const d = creerDemandeAnnulation(params.id, tournoi.titre, tournoi.organisateur, motif.trim());
    if (d) {
      setDemandeEnAttente(d);
      // Point 209 : tant que la validation automatique pré-backend (point
      // 157) est active, la demande est déjà résolue à l'envoi — le tournoi
      // est réellement annulé immédiatement, il faut donc le refléter tout
      // de suite (pas de "en attente d'examen" trompeur) plutôt que de
      // laisser croire que rien ne s'est passé.
      if (d.statut === "validee") rafraichirTournoi();
    }
    setDemandeOuverte(false);
    setMotif("");
  }

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  if (!autorise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette page est réservée aux organisateurs.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  if (tournoi.annule) {
    return (
      <div className="min-h-screen flex flex-col px-5 py-4 gap-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Clôture du tournoi" onRetour={() => router.back()} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4">
          <XCircle size={32} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
          <p className="text-base font-medium">Tournoi annulé</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            {tournoi.titre} a été annulé. Les inscrits déjà payés ont été remboursés automatiquement.
          </p>
          <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Voir la fiche du tournoi</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Clôture du tournoi" onRetour={() => router.back()} />

      <div
        className="flex items-start gap-2.5 p-3.5"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <AlertTriangle size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
          La clôture est <strong>automatique et définitive</strong> : elle attribue les points de classement et déclenche le
          versement des gains dès que {tournoi.type === "battle_royale" ? "le nombre de manches prévu est joué" : "la finale du bracket est jouée"}.
          Une fois le tournoi clôturé, plus rien n&apos;est modifiable — utilise la demande d&apos;annulation ci-dessous
          si un problème survient avant la fin.
        </p>
      </div>

      {tournoi.termine || resultat ? (
        <div
          className="flex items-center gap-2 p-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          <CheckCircle2 size={17} strokeWidth={2} />
          <span className="text-sm">
            Tournoi clôturé automatiquement — points attribués{resultat && resultat.gainCredite > 0 ? `, ${resultat.gainCredite.toLocaleString("fr-FR")} F en attente de vérification (séquestre le temps de recueillir les avis)` : ""}.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            {cloturePret ? (
              <span className="flex items-center gap-2">
                <Radio size={14} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-300)" }} />
                Classement final prêt — clôture automatique en cours.
              </span>
            ) : tournoi.type === "battle_royale" ? (
              `Le tournoi se clôturera automatiquement une fois ${tournoi.manchesPrevues ?? 1} manche${(tournoi.manchesPrevues ?? 1) > 1 ? "s" : ""} jouée${(tournoi.manchesPrevues ?? 1) > 1 ? "s" : ""} (${manchesJouees}/${tournoi.manchesPrevues ?? 1} pour l'instant).`
            ) : (
              "Le tournoi se clôturera automatiquement une fois la finale du bracket jouée."
            )}
          </p>

          {demandeEnAttente ? (
            <div className="flex items-center gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <Clock size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
              <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
                Demande d&apos;annulation envoyée à l&apos;administration, en attente d&apos;examen.
              </span>
            </div>
          ) : estProprietaire ? (
            <button
              type="button"
              onClick={() => setDemandeOuverte(true)}
              className={`self-start flex items-center gap-1.5 px-3 py-2 text-sm ${PRESS}`}
              style={{ color: "var(--ds-danger)" }}
            >
              <XCircle size={15} strokeWidth={2} />
              Demander l&apos;annulation du tournoi
            </button>
          ) : (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Seul l&apos;organisateur propriétaire peut demander l&apos;annulation du tournoi.
            </p>
          )}
        </div>
      )}

      <Modal ouvert={demandeOuverte} titre="Demande d'annulation" onFermer={() => setDemandeOuverte(false)}>
        <div className="flex flex-col gap-2.5 not-italic" style={{ whiteSpace: "normal" }}>
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Explique pourquoi ce tournoi doit être annulé. La demande part à l&apos;administration pour inspection —
            le tournoi reste actif tant qu&apos;elle n&apos;est pas validée, et ça compte contre ta réputation d&apos;organisateur.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Motif (obligatoire)</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={4}
              placeholder="Ex : nombre d'inscrits insuffisant, problème de salle, incident..."
              className="px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setDemandeOuverte(false)}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={envoyerDemande}
            disabled={!motif.trim()}
            className={`flex-1 h-10 text-sm font-medium disabled:opacity-40 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Envoyer la demande
          </button>
        </div>
      </Modal>
    </div>
  );
}
