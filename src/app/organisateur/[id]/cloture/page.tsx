"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Radio, AlertTriangle, Trophy, Share2, Check } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { hexagoneStyle } from "@/components/ds/Palier";
import {
  tournoiParId,
  terminerTournoi,
  cashPrizeAffiche,
  repartitionAutomatique,
  commissionEstimee,
  paiementsEnAttente,
  type Tournoi,
} from "@/lib/mockTournaments";
import { classementFinalBracket, matchsDuTournoi, type MatchTournoi } from "@/lib/mockBracket";
import { classementFinalBR, manchesBR } from "@/lib/mockBattleRoyale";
import { nomOrganisateurActuel, estCertifie } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { demandeAnnulationPourTournoi, type DemandeAnnulation } from "@/lib/mockDemandesAnnulation";
import { mesLitiges } from "@/lib/mockLitige";
import { formatXof } from "@/lib/formatXof";

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
  const [demandeEnAttente, setDemandeEnAttente] = useState<DemandeAnnulation | undefined>(undefined);
  const [copie, setCopie] = useState(false);
  const [classement, setClassement] = useState<string[]>([]);
  const [matchsBracket, setMatchsBracket] = useState<MatchTournoi[]>([]);

  async function rafraichirTournoi() {
    setTournoi(await tournoiParId(params.id));
  }

  useEffect(() => {
    tournoiParId(params.id).then((t) => {
      setTournoi(t);
      setAutorise(Boolean(t) && peutSuperviser(t!.organisateur, nomOrganisateurActuel()));
      setEstProprietaire(t?.organisateur === nomOrganisateurActuel());
      setDemandeEnAttente(demandeAnnulationPourTournoi(params.id));
      setPret(true);
    });
  }, [params.id]);

  useEffect(() => {
    async function charger() {
      if (!tournoi) {
        setClassement([]);
        setMatchsBracket([]);
        return;
      }
      if (tournoi.type === "battle_royale") {
        setClassement(classementFinalBR(params.id, tournoi.brSousType ?? "solo"));
        setMatchsBracket([]);
      } else {
        setClassement(await classementFinalBracket(params.id));
        setMatchsBracket(await matchsDuTournoi(params.id));
      }
    }
    charger();
  }, [tournoi, params.id]);

  const manchesJouees = tournoi?.type === "battle_royale" ? manchesBR(params.id).length : 0;
  // Pour un Battle Royale, "prêt" attend le nombre de manches choisi par
  // l'organisateur à la création — pas juste la première manche jouée.
  const cloturePret = tournoi
    ? tournoi.type === "battle_royale"
      ? manchesJouees > 0 && manchesJouees >= (tournoi.manchesPrevues ?? 1)
      : classement.length > 0
    : false;

  // Matchs "réels" du bracket (les deux places remplies) : sert de base à la
  // barre d'avancement et exclut les places vides encore en attente de tour
  // précédent.
  const matchsBracketReels = matchsBracket.filter((m) => m.joueur1 && m.joueur2);
  const matchsBracketTermines = matchsBracketReels.filter((m) => m.statut === "termine").length;

  const pourcentAvancement = tournoi
    ? tournoi.type === "battle_royale"
      ? Math.min(100, Math.round((manchesJouees / (tournoi.manchesPrevues ?? 1)) * 100))
      : matchsBracketReels.length > 0
        ? Math.round((matchsBracketTermines / matchsBracketReels.length) * 100)
        : 0
    : 0;

  const litigesOuverts = tournoi ? mesLitiges().filter((l) => l.tournoiId === tournoi.id && l.statut === "en_attente").length : 0;
  const sequestreXof = tournoi ? cashPrizeAffiche(tournoi) : 0;
  const nbFinalistes = tournoi?.repartitionCashPrize?.length ?? 0;
  const previsionVersements = tournoi && nbFinalistes > 0 ? repartitionAutomatique(sequestreXof, nbFinalistes) : [];

  const checklist = tournoi
    ? [
        tournoi.type === "battle_royale"
          ? {
              label: "Manches jouées",
              valeur: `${manchesJouees} / ${tournoi.manchesPrevues ?? 1}`,
              ok: manchesJouees >= (tournoi.manchesPrevues ?? 1),
            }
          : {
              label: "Matchs du bracket joués",
              valeur: matchsBracketReels.length > 0 ? `${matchsBracketTermines} / ${matchsBracketReels.length}` : "—",
              ok: matchsBracketReels.length > 0 && matchsBracketTermines === matchsBracketReels.length,
            },
        {
          label: "Aucun litige ouvert",
          valeur: litigesOuverts > 0 ? `${litigesOuverts} ouvert${litigesOuverts > 1 ? "s" : ""}` : "OK",
          ok: litigesOuverts === 0,
        },
        { label: "Séquestre à provisionner", valeur: formatXof(sequestreXof), ok: true },
      ]
    : [];

  // Le gain en séquestre reste lisible même après un rechargement de page
  // (resultat, lui, ne survit pas au remount) tant qu'il n'a pas encore été
  // libéré par reevaluerPaiementsEnAttente().
  const gainSequestreXof = tournoi ? paiementsEnAttente().find((p) => p.tournoiId === tournoi.id)?.montantXof : undefined;
  const confirmationItems = tournoi
    ? [
        { label: "Points attribués", valeur: resultat ? `${resultat.pointsAttribues} pts` : "Attribués" },
        ...(gainSequestreXof ? [{ label: "Ton gain (en séquestre)", valeur: formatXof(gainSequestreXof) }] : []),
        ...(estProprietaire && tournoi.fraisXof > 0 && tournoi.commissionActivee && estCertifie()
          ? [{ label: "Commission organisateur", valeur: formatXof(commissionEstimee(tournoi.fraisXof, tournoi.placesInscrites)) }]
          : []),
        { label: "Scores", valeur: "Verrouillés définitivement" },
      ]
    : [];

  async function partager() {
    const url = window.location.origin + `/tournois/${params.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: tournoi?.titre });
        return;
      } catch {
        // annulé ou indisponible : on retombe sur la copie
      }
    }
    await navigator.clipboard.writeText(url);
    setCopie(true);
    setTimeout(() => setCopie(false), 1800);
  }

  useEffect(() => {
    if (tournoi && cloturePret && !tournoi.termine && !resultat) {
      terminerTournoi(params.id).then((r) => {
        setResultat(r);
        rafraichirTournoi();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloturePret, tournoi?.termine]);

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
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              ...hexagoneStyle,
              width: 72,
              height: 78,
              background: "var(--ds-accent-800)",
              boxShadow: "0 0 32px color-mix(in srgb, var(--ds-accent-500) 45%, transparent)",
            }}
          >
            <CheckCircle2 size={30} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-base font-semibold">Points attribués, gains versés</p>
            <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>{tournoi.titre}</p>
          </div>

          <div
            className="w-full flex flex-col gap-2 p-3.5"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            {confirmationItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--ds-text-muted)" }}>{item.label}</span>
                <span className="font-medium">{item.valeur}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-center max-w-xs" style={{ color: "var(--ds-muted)" }}>
            En cas de désaccord après clôture, seule l&apos;administration peut encore intervenir (litige post-clôture).
          </p>

          <div className="w-full flex gap-2 pt-1">
            <Link
              href="/classement"
              className={`flex-1 h-10 flex items-center justify-center text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
            >
              Classement
            </Link>
            <button
              type="button"
              onClick={partager}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
            >
              {copie ? <Check size={14} strokeWidth={2} /> : <Share2 size={14} strokeWidth={2} />}
              {copie ? "Copié" : "Partager"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className="flex flex-col gap-2.5 p-3.5"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
                {cloturePret ? (
                  <span className="flex items-center gap-1.5">
                    <Radio size={12} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-300)" }} />
                    Clôture automatique en cours
                  </span>
                ) : (
                  "Avancement"
                )}
              </span>
              <span className="text-xs" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{pourcentAvancement}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)" }}>
              <div
                className="h-full"
                style={{ width: `${pourcentAvancement}%`, background: "var(--ds-accent-400)", borderRadius: "var(--ds-radius-pill)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--ds-text-muted)" }}>
                    {item.ok ? (
                      <CheckCircle2 size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
                    ) : (
                      <Clock size={12} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                    )}
                    {item.label}
                  </span>
                  <span style={{ color: item.ok ? "var(--ds-accent-300)" : "var(--ds-text)" }}>{item.valeur}</span>
                </div>
              ))}
            </div>
          </div>

          {previsionVersements.length > 0 && (
            <div
              className="flex flex-col gap-2 p-3.5"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
                <Trophy size={12} strokeWidth={2} />
                Ce qui sera versé
              </span>
              <div className="flex flex-col gap-1.5">
                {previsionVersements.map((p) => (
                  <div key={p.label} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--ds-text-muted)" }}>{p.label}</span>
                    <span className="font-medium" style={{ color: "var(--ds-accent-300)" }}>{formatXof(p.montantXof)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {demandeEnAttente ? (
            <div className="flex items-center gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <Clock size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
              <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
                Demande d&apos;annulation envoyée à l&apos;administration, en attente d&apos;examen.
              </span>
            </div>
          ) : estProprietaire ? (
            <Link
              href={`/organisateur/${params.id}/cloture/annulation`}
              className={`self-start flex items-center gap-1.5 px-3 py-2 text-sm ${PRESS}`}
              style={{ color: "var(--ds-danger)" }}
            >
              <XCircle size={15} strokeWidth={2} />
              Demander l&apos;annulation du tournoi
            </Link>
          ) : (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Seul l&apos;organisateur propriétaire peut demander l&apos;annulation du tournoi.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
