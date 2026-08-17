"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Settings2, Users, ListChecks, Flag, Zap, Clock, Radio, KeyRound, Info, Network } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { Modal } from "@/components/ds/Modal";
import { tournoiParId, inscriptionsFermees, terminerTournoi, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, classementFinalBracket } from "@/lib/mockBracket";
import { classementFinalBR, manchesBR, unitesBR } from "@/lib/mockBattleRoyale";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { creerDemandeAnnulation, demandeAnnulationPourTournoi, type DemandeAnnulation } from "@/lib/mockDemandesAnnulation";

/** La clôture n'est plus déclenchée manuellement (point 119) : dès que le
 * classement final est calculable (dernier match/manche validé), le tournoi
 * passe automatiquement au statut "terminé" — aucun gain n'est jamais versé
 * avant ce moment précis (point 118), qui est le seul endroit du code où
 * terminerTournoi() est appelé. */
function SectionCloture({
  tournoiId,
  tournoiTitre,
  organisateur,
  type,
  brSousType,
  termine,
  onTermine,
  onAnnule,
}: {
  tournoiId: string;
  tournoiTitre: string;
  organisateur: string;
  type: "1v1" | "equipes" | "battle_royale";
  brSousType?: "solo" | "duo" | "trio" | "squad";
  termine: boolean;
  onTermine: () => void;
  onAnnule: () => void;
}) {
  const [resultat, setResultat] = useState<{ pointsAttribues: number; gainCredite: number } | null>(null);
  const [demandeOuverte, setDemandeOuverte] = useState(false);
  const [motif, setMotif] = useState("");
  const [demandeEnAttente, setDemandeEnAttente] = useState<DemandeAnnulation | undefined>(undefined);

  const classement = type === "battle_royale" ? classementFinalBR(tournoiId, brSousType ?? "solo") : classementFinalBracket(tournoiId);
  const pret = classement.length > 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemandeEnAttente(demandeAnnulationPourTournoi(tournoiId));
  }, [tournoiId]);

  useEffect(() => {
    if (pret && !termine && !resultat) {
      const r = terminerTournoi(tournoiId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResultat(r);
      onTermine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, termine]);

  function envoyerDemande() {
    if (!motif.trim()) return;
    const d = creerDemandeAnnulation(tournoiId, tournoiTitre, organisateur, motif.trim());
    if (d) {
      setDemandeEnAttente(d);
      // Point 209 : tant que la validation automatique pré-backend (point
      // 157) est active, la demande est déjà résolue à l'envoi — le tournoi
      // est réellement annulé immédiatement, il faut donc le refléter tout
      // de suite (pas de "en attente d'examen" trompeur) plutôt que de
      // laisser croire que rien ne s'est passé.
      if (d.statut === "validee") onAnnule();
    }
    setDemandeOuverte(false);
    setMotif("");
  }

  if (termine || resultat) {
    return (
      <div
        className="flex items-center gap-2 p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
      >
        <CheckCircle2 size={17} strokeWidth={2} />
        <span className="text-sm">
          Tournoi clôturé automatiquement — points attribués{resultat && resultat.gainCredite > 0 ? `, ${resultat.gainCredite.toLocaleString("fr-FR")} F en attente de vérification (séquestre le temps de recueillir les avis)` : ""}.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        {pret ? (
          <span className="flex items-center gap-2">
            <Radio size={14} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-300)" }} />
            Classement final prêt — clôture automatique en cours.
          </span>
        ) : type === "battle_royale" ? (
          "Le tournoi se clôturera automatiquement une fois le dernier survivant connu."
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
      ) : (
        <button
          type="button"
          onClick={() => setDemandeOuverte(true)}
          className={`self-start flex items-center gap-1.5 px-3 py-2 text-sm ${PRESS}`}
          style={{ color: "var(--ds-danger)" }}
        >
          <XCircle size={15} strokeWidth={2} />
          Demander l&apos;annulation du tournoi
        </button>
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

function CarteActionRequise({
  tournoi,
}: {
  tournoi: NonNullable<ReturnType<typeof tournoiParId>>;
}) {
  if (tournoi.termine || tournoi.annule) return null;

  if (tournoi.type === "battle_royale") {
    const manches = manchesBR(tournoi.id);
    const unites = unitesBR(tournoi.id, tournoi.brSousType ?? "solo");
    if (unites.length === 0) return null;
    return (
      <Link
        href={`/organisateur/${tournoi.id}/qualification`}
        className="flex flex-col gap-1 p-3.5"
        style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
            Action requise
          </span>
          <Zap size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
        </div>
        <div className="text-[15px] font-medium mt-0.5">Saisir les points de la manche {manches.length + 1}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--ds-text-muted)" }}>
          {unites.length} équipe{unites.length > 1 ? "s" : ""} en jeu.
        </div>
      </Link>
    );
  }

  const matches = matchsDuTournoi(tournoi.id);
  const enAttente = matches.filter((m) => m.statut !== "termine" && m.joueur1 && m.joueur2).length;
  if (enAttente === 0) return null;
  return (
    <Link
      href={`/organisateur/${tournoi.id}/qualification`}
      className="flex flex-col gap-1 p-3.5"
      style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
          Action requise
        </span>
        <Zap size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
      </div>
      <div className="text-[15px] font-medium mt-0.5">
        {enAttente} match{enAttente > 1 ? "s" : ""} en attente de score
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--ds-text-muted)" }}>
        Valide les scores pour faire avancer le bracket.
      </div>
    </Link>
  );
}

export default function GestionTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);

  function rafraichirTournoi() {
    setTournoi(tournoiParId(params.id));
  }

  useEffect(() => {
    const t = tournoiParId(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournoi(t);
    setAutorise(t?.organisateur === nomOrganisateurActuel());
    setPret(true);
  }, [params.id]);

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
        <AppBar retour titre="Gestion en direct" onRetour={() => router.back()} />
        <div
          className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4"
        >
          <XCircle size={32} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
          <p className="text-base font-medium">Tournoi annulé</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            {tournoi.titre} a été annulé suite à ta demande. Les inscrits déjà payés ont été remboursés automatiquement.
          </p>
          <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Voir la fiche du tournoi</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Gestion en direct" onRetour={() => router.back()} />

      <div>
        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {tournoi.titre}
        </div>
        <div
          className="text-lg"
          style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
        >
          {tournoi.jeuLabel} · {tournoi.placesInscrites} inscrits
        </div>
      </div>

      <CarteActionRequise tournoi={tournoi} />

      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href={`/tournois/${params.id}/inscrits`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Users size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Check-in</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.placesInscrites} inscrits
            </div>
          </div>
        </Link>
        <Link
          href={`/organisateur/${params.id}/qualification`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <ListChecks size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">{tournoi.type === "battle_royale" ? "Manches" : "Scores"}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.type === "battle_royale" ? `${manchesBR(tournoi.id).length} jouée(s)` : "Saisir un résultat"}
            </div>
          </div>
        </Link>
        <Link
          href={`/organisateur/${params.id}/parametres`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Info size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Infos du tournoi</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Titre, règlement...
            </div>
          </div>
        </Link>
        <Link
          href={`/organisateur/${params.id}/stream`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Settings2 size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Paramètres</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Stream / diffusion
            </div>
          </div>
        </Link>
        <Link
          href={tournoi.type === "battle_royale" ? `/tournois/${params.id}/battle-royale` : `/tournois/${params.id}/bracket`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Network size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">{tournoi.type === "battle_royale" ? "Aperçu classement" : "Aperçu bracket"}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Avant le lancement
            </div>
          </div>
        </Link>
        <a
          href="#cloture"
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Flag size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Clôture</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.termine ? "Terminé" : "En cours"}
            </div>
          </div>
        </a>
        {inscriptionsFermees(tournoi) && (
          <Link
            href={`/organisateur/${params.id}/room`}
            className={`flex flex-col gap-2 p-3 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
          >
            <KeyRound size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
            <div>
              <div className="text-[13px] font-medium">Infos de room</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Lien, mot de passe, envoi
              </div>
            </div>
          </Link>
        )}
      </div>

      <div id="cloture" className="flex flex-col gap-3 scroll-mt-4 pb-6">
        <div className="text-base font-medium flex items-center gap-2">
          <CheckCircle2 size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          Clôture du tournoi
        </div>
        <SectionCloture
          tournoiId={params.id}
          tournoiTitre={tournoi.titre}
          organisateur={tournoi.organisateur}
          type={tournoi.type}
          brSousType={tournoi.brSousType}
          termine={Boolean(tournoi.termine)}
          onTermine={rafraichirTournoi}
          onAnnule={rafraichirTournoi}
        />
      </div>
    </div>
  );
}
