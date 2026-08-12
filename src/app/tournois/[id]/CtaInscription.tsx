"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Bell, CheckCircle2, Users, Pencil, Check as CheckIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { Modal } from "@/components/ds/Modal";
import { formatXof } from "@/lib/formatXof";
import { estFavori, basculerFavori } from "@/lib/mockFavoris";
import { estInscrit, inscriptionDe, renommerEquipe, enregistrerInscription } from "@/lib/mockInscriptions";
import { notifsActivees, basculerNotifsTournoi } from "@/lib/mockNotifications";
import { incrementerInscrits } from "@/lib/mockTournaments";
import type { EquipeInfo, ModeEquipe, TypeCompetition } from "@/lib/mockTournaments";

export function CtaInscription({
  tournoiId,
  titre,
  jeuLabel,
  dateLabel,
  fraisXof,
  typeCompetition,
  equipes,
  modeEquipe,
  tournoiCommence = false,
  fermeInscriptions = false,
}: {
  tournoiId: string;
  titre: string;
  jeuLabel: string;
  dateLabel: string;
  fraisXof: number;
  typeCompetition: TypeCompetition;
  equipes?: EquipeInfo[];
  modeEquipe?: ModeEquipe;
  tournoiCommence?: boolean;
  fermeInscriptions?: boolean;
}) {
  const router = useRouter();
  const estEquipes = typeCompetition === "equipes";
  const [choixEquipe, setChoixEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [favori, setFavori] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const [inscrit, setInscrit] = useState(false);
  const [equipeInscrite, setEquipeInscrite] = useState<string | undefined>(undefined);
  const [renommage, setRenommage] = useState(false);
  const [nouveauNomEquipe, setNouveauNomEquipe] = useState("");
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [equipeEnAttente, setEquipeEnAttente] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Lu depuis le localStorage : état neutre au premier rendu serveur,
    // synchronisé côté client une fois monté (cf. LanceurApp.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavori(estFavori(tournoiId));
    setNotifs(notifsActivees(tournoiId));
    setInscrit(estInscrit(tournoiId));
    setEquipeInscrite(inscriptionDe(tournoiId)?.equipe);
  }, [tournoiId]);

  function allerAuPaiement(equipe?: string) {
    const url = equipe
      ? `/paiement/${tournoiId}?equipe=${encodeURIComponent(equipe)}`
      : `/paiement/${tournoiId}`;
    router.push(url);
  }

  function demarrerInscription(equipe?: string) {
    if (fraisXof === 0) {
      // Tournoi gratuit : pas de moyen de paiement, juste une confirmation
      // récapitulative avant de valider l'inscription.
      setEquipeEnAttente(equipe);
      setConfirmationOuverte(true);
      return;
    }
    allerAuPaiement(equipe);
  }

  function confirmerInscriptionGratuite() {
    enregistrerInscription(tournoiId, equipeEnAttente);
    incrementerInscrits(tournoiId);
    setConfirmationOuverte(false);
    setInscrit(true);
    setEquipeInscrite(equipeEnAttente);
  }

  function onClicInscription() {
    if (estEquipes) {
      setChoixEquipe(true);
      return;
    }
    demarrerInscription();
  }

  function validerEquipe() {
    if (!nomEquipe.trim()) {
      setErreur("Choisis ou saisis le nom de ton équipe.");
      return;
    }
    demarrerInscription(nomEquipe.trim());
  }

  function validerRenommage() {
    if (!nouveauNomEquipe.trim()) return;
    renommerEquipe(tournoiId, nouveauNomEquipe.trim());
    setEquipeInscrite(nouveauNomEquipe.trim());
    setRenommage(false);
  }

  if (inscrit) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-2.5"
        style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}
      >
        {renommage && (
          <div className="flex flex-col gap-2">
            <Field
              label="Nouveau nom d'équipe"
              value={nouveauNomEquipe}
              onChange={(e) => setNouveauNomEquipe(e.target.value)}
              placeholder={equipeInscrite}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Link
            href={`/tournois/${tournoiId}/inscrits`}
            className="flex items-center justify-center w-10 h-10 shrink-0"
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            aria-label="Voir la liste des inscrits"
          >
            <Users size={18} strokeWidth={2} />
          </Link>
          <button
            type="button"
            onClick={() => setNotifs(basculerNotifsTournoi(tournoiId))}
            className="flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-md)",
              border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`,
              color: notifs ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
            aria-label={notifs ? "Désactiver les notifications" : "Activer les notifications"}
          >
            <Bell size={18} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
          </button>
          {equipeInscrite && !tournoiCommence && (
            <button
              type="button"
              onClick={() => {
                if (renommage) {
                  validerRenommage();
                } else {
                  setNouveauNomEquipe(equipeInscrite ?? "");
                  setRenommage(true);
                }
              }}
              className="flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              aria-label={renommage ? "Valider le nouveau nom" : "Renommer l'équipe"}
            >
              {renommage ? <CheckIcon size={18} strokeWidth={2} /> : <Pencil size={16} strokeWidth={2} />}
            </button>
          )}
          <div
            className="flex-1 h-[46px] flex items-center justify-center gap-2 text-[15px] font-medium"
            style={{
              borderRadius: "var(--ds-radius-btn)",
              background: "var(--ds-accent-900)",
              color: "var(--ds-accent-300)",
            }}
          >
            <CheckCircle2 size={17} strokeWidth={2} />
            Déjà inscrit{equipeInscrite ? ` · ${equipeInscrite}` : ""}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-3"
      style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}
    >
      {choixEquipe && (
        <div className="flex flex-col gap-2.5">
          {modeEquipe === "predefinies" && equipes && equipes.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {equipes.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setNomEquipe(e.nom)}
                  className="px-3 py-2 text-sm cursor-pointer"
                  style={{
                    borderRadius: "var(--ds-radius-pill)",
                    border: `1px solid ${nomEquipe === e.nom ? "var(--ds-accent)" : "var(--ds-border)"}`,
                    color: nomEquipe === e.nom ? "var(--ds-accent-300)" : "var(--ds-text)",
                  }}
                >
                  {e.nom}
                </button>
              ))}
            </div>
          ) : (
            <Field
              label="Nom de ton équipe"
              value={nomEquipe}
              onChange={(e) => setNomEquipe(e.target.value)}
              placeholder="Les Lions"
            />
          )}
          {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
        </div>
      )}

      <div className="flex gap-2.5 items-center">
        <button
          type="button"
          onClick={() => setFavori(basculerFavori(tournoiId))}
          className="flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer"
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${favori ? "var(--ds-accent)" : "var(--ds-border)"}`,
            color: favori ? "var(--ds-accent-300)" : "var(--ds-muted)",
          }}
          aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Bookmark size={18} strokeWidth={2} fill={favori ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => setNotifs(basculerNotifsTournoi(tournoiId))}
          className="flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer"
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`,
            color: notifs ? "var(--ds-accent-300)" : "var(--ds-muted)",
          }}
          aria-label={notifs ? "Désactiver les notifications" : "Activer les notifications"}
        >
          <Bell size={18} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
        </button>
        <Button
          variante="primary"
          bloc
          disabled={fermeInscriptions}
          onClick={choixEquipe ? validerEquipe : onClicInscription}
        >
          {fermeInscriptions ? "Inscriptions fermées" : choixEquipe ? "Continuer" : `S'inscrire · ${formatXof(fraisXof)}`}
        </Button>
      </div>

      <Modal ouvert={confirmationOuverte} titre="Confirmer l'inscription" onFermer={() => setConfirmationOuverte(false)}>
        <div className="flex flex-col gap-2 not-italic" style={{ whiteSpace: "normal" }}>
          <p><strong>{titre}</strong></p>
          <p>{jeuLabel} · {dateLabel}</p>
          {equipeEnAttente && <p>Équipe : {equipeEnAttente}</p>}
          <p style={{ color: "var(--ds-accent-300)" }}>Inscription gratuite — aucun paiement requis.</p>
        </div>
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setConfirmationOuverte(false)}
            className="flex-1 h-10 text-sm font-medium cursor-pointer"
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmerInscriptionGratuite}
            className="flex-[2] h-10 text-sm font-medium cursor-pointer"
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Confirmer mon inscription
          </button>
        </div>
      </Modal>
    </div>
  );
}
