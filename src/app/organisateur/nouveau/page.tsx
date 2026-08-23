"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BannerCropper } from "@/components/ds/BannerCropper";
import { SelecteurSymbole } from "@/components/ds/SelecteurSymbole";
import { SYMBOLE_DEFAUT } from "@/lib/mockSymboles";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { SelecteurJeu } from "@/components/ds/SelecteurJeu";
import { PaiementFraisFixes } from "@/components/ds/PaiementFraisFixes";
import { Button } from "@/components/ds/Button";
import { lireSolde, debiter } from "@/lib/mockWallet";
import { peutCreerTournoiPayant, nomOrganisateurActuel, onboardingOrganisateurComplet, estCertifie, estOrganisateurCertifie, reglementCertifieAccepte } from "@/lib/mockOrganisateur";
import { AlerteVerificationIdentite } from "@/components/ds/AlerteVerificationIdentite";
import { MiniatureFormat } from "@/components/ds/MiniatureFormat";
import { formatXof } from "@/lib/formatXof";
import {
  JEUX,
  creerTournoi,
  commissionEstimee,
  capaciteLobbyMax,
  repartitionAutomatique,
  formatsDisponiblesPourJeu,
  COMMISSION_PCT,
  FRAIS_CREATION_TOURNOI_PAYANT_XOF,
  type TypeCompetition,
  type Modalite,
  type ModeEquipe,
  type EquipeSousType,
} from "@/lib/mockTournaments";

type ModeFinalistes = "1" | "3" | "perso";

/** Point 184 : le check-in ne peut jamais être fixé après ou au même moment
 * que le début du tournoi — 10 minutes est le minimum autorisé avant. */
const DELAI_CHECKIN_MIN_MS = 10 * 60 * 1000;
/** Point 201 : délai par défaut entre check-in et début, tant que
 * l'organisateur n'a pas ajusté l'heure de check-in lui-même. */
const DELAI_CHECKIN_DEFAUT_MIN = 15;
/** Marge par défaut avant le check-in à laquelle "Fin des inscriptions" se
 * cale automatiquement (modifiable dans la fenêtre autorisée — cf.
 * MARGE_MAX_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN et la validation dans
 * creer()). */
const MARGE_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN = 20;
/** Fenêtre autorisée pour "Fin des inscriptions" : à l'heure du check-in au
 * plus tard, jusqu'à 1h avant au plus tôt — jamais plus large, pour que les
 * inscriptions restent proches du moment où les joueurs se présentent. */
const MARGE_MAX_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN = 60;

function soustraireMinutes(heure: string, minutes: number): string {
  const [h, m] = (heure || "00:00").split(":").map(Number);
  const total = Math.max(0, (h || 0) * 60 + (m || 0) - minutes);
  const hh = Math.floor(total / 60).toString().padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

const TYPES: { id: TypeCompetition; label: string }[] = [
  { id: "1v1", label: "1v1" },
  { id: "equipes", label: "Équipes" },
  { id: "battle_royale", label: "Battle Royale" },
];

const SOUS_TYPES_BR: { id: "solo" | "duo" | "trio" | "squad"; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "duo", label: "Duo" },
  { id: "trio", label: "Trio" },
  { id: "squad", label: "Squad" },
];

const SOUS_TYPES_EQUIPE: { id: EquipeSousType; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "duo", label: "Duo" },
  { id: "trio", label: "Trio" },
  { id: "squad", label: "Squad" },
];

/** Best-of par match (1v1/Équipes) : uniquement des valeurs impaires, pour
 * toujours avoir un vainqueur majoritaire possible. */
const OPTIONS_BO: { id: "1" | "3" | "5" | "7"; label: string }[] = [
  { id: "1", label: "BO1" },
  { id: "3", label: "BO3" },
  { id: "5", label: "BO5" },
  { id: "7", label: "BO7" },
];

function SegmentedControl<T extends string>({
  options,
  valeur,
  onChange,
  disabledIds,
}: {
  options: { id: T; label: string }[];
  valeur: T;
  onChange: (v: T) => void;
  disabledIds?: T[];
}) {
  return (
    <div
      className="flex p-[3px] gap-[3px]"
      style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
    >
      {options.map((o) => {
        const desactive = disabledIds?.includes(o.id) ?? false;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="flex-1 h-9 text-[13px] font-medium cursor-pointer transition-colors disabled:cursor-not-allowed"
            disabled={desactive && valeur !== o.id}
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: valeur === o.id ? "var(--ds-accent-900)" : "transparent",
              color: valeur === o.id ? "var(--ds-accent-300)" : desactive ? "color-mix(in srgb, var(--ds-muted) 55%, transparent)" : "var(--ds-muted)",
              fontFamily: "var(--ds-font-body)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function formatDateLabel(date: string, heure: string): string {
  if (!date) return "";
  const [annee, mois, jour] = date.split("-").map(Number);
  const d = new Date(annee, (mois || 1) - 1, jour || 1);
  const nomJour = d.toLocaleDateString("fr-FR", { weekday: "long" });
  const jourCapitalise = nomJour.charAt(0).toUpperCase() + nomJour.slice(1);
  const [h, m] = (heure || "00:00").split(":");
  const suffixe = m && m !== "00" ? `${h}h${m}` : `${h}h00`;
  return `${jourCapitalise} ${suffixe} GMT`;
}

export default function NouveauTournoiPage() {
  const router = useRouter();

  const [banniereUrl, setBanniereUrl] = useState<string | undefined>(undefined);
  const [symboleId, setSymboleId] = useState(SYMBOLE_DEFAUT);
  const [jeuId, setJeuId] = useState(JEUX[0].id);
  const [jeuPersonnalise, setJeuPersonnalise] = useState("");
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeCompetition>("1v1");
  const [brSousType, setBrSousType] = useState<"solo" | "duo" | "trio" | "squad">("solo");
  const [manchesPrevues, setManchesPrevues] = useState("3");
  const [manchesParMatch, setManchesParMatch] = useState<"1" | "3" | "5" | "7">("3");
  const [equipeSousType, setEquipeSousType] = useState<EquipeSousType>("squad");
  const [modalite, setModalite] = useState<Modalite>("presentiel");
  const [ville, setVille] = useState("");
  const [modeEquipe, setModeEquipe] = useState<ModeEquipe>("libre");
  const [nomsEquipes, setNomsEquipes] = useState("");
  const [placesTotal, setPlacesTotal] = useState("16");
  const [placesBR, setPlacesBR] = useState("50");
  const [payant, setPayant] = useState(true);
  const [commissionActivee, setCommissionActivee] = useState(true);
  const [financeParOrganisateur, setFinanceParOrganisateur] = useState(false);
  const [solde, setSolde] = useState(0);
  const [payantAutorise, setPayantAutorise] = useState(true);
  const [certifie, setCertifie] = useState(false);
  const [identiteVerifiee, setIdentiteVerifiee] = useState(false);
  const [alerteVerifOuverte, setAlerteVerifOuverte] = useState(false);
  const [onboardingOk, setOnboardingOk] = useState(false);

  useEffect(() => {
    async function verifier() {
      // Point 167 : un nom d'organisateur suffit pour créer un tournoi
      // gratuit, sans attendre la demande de statut certifié (point 146/158).
      if (!onboardingOrganisateurComplet()) {
        router.replace("/organisateur");
        return;
      }
      const estCert = await estOrganisateurCertifie();
      // Point 159 : le règlement organisateur certifié doit être accepté avant
      // le premier tournoi payant — un organisateur qui vient d'être certifié
      // mais n'est pas encore passé par cet écran y est renvoyé ici.
      if (estCert && !(await reglementCertifieAccepte())) {
        router.replace("/organisateur/reglement-certifie");
        return;
      }
      lireSolde().then(setSolde);
      // Un tournoi payant demande à la fois un compte en règle (anti-triche)
      // et le statut organisateur certifié complet (identité vérifiée +
      // demande validée + règlement accepté, points 158-159) — sans ça, seuls
      // les tournois gratuits (avec cash prize auto-financé possible) sont permis.
      const autorise = estCert && (await peutCreerTournoiPayant());
      setCertifie(estCert);
      setIdentiteVerifiee(await estCertifie());
      setPayantAutorise(autorise);
      if (!autorise) setPayant(false);
      setOnboardingOk(true);
    }
    verifier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [fraisXof, setFraisXof] = useState("1000");
  const [cashPrizeXof, setCashPrizeXof] = useState("0");
  const [modeFinalistes, setModeFinalistes] = useState<ModeFinalistes>("1");
  const [nbFinalistesPerso, setNbFinalistesPerso] = useState("5");
  const [dateJour, setDateJour] = useState("");
  const [dateHeure, setDateHeure] = useState("20:00");
  const [checkinHeure, setCheckinHeure] = useState(() => soustraireMinutes("20:00", DELAI_CHECKIN_DEFAUT_MIN));
  const [checkinAjusteManuellement, setCheckinAjusteManuellement] = useState(false);

  // Point 201 : le check-in suit automatiquement l'heure de début (15 min
  // avant) tant que l'organisateur ne l'a pas lui-même ajusté — dès qu'il le
  // fait, ses choix sont respectés même si la date/heure change ensuite.
  useEffect(() => {
    if (checkinAjusteManuellement) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckinHeure(soustraireMinutes(dateHeure, DELAI_CHECKIN_DEFAUT_MIN));
  }, [dateHeure, checkinAjusteManuellement]);
  const [finInscJour, setFinInscJour] = useState("");
  const [finInscHeure, setFinInscHeure] = useState("");
  const [finInscAjusteManuellement, setFinInscAjusteManuellement] = useState(false);
  const dateLabel = formatDateLabel(dateJour, dateHeure);

  function versTimestamp(jour: string, heure: string): number | undefined {
    if (!jour) return undefined;
    const [annee, mois, j] = jour.split("-").map(Number);
    const [h, m] = (heure || "00:00").split(":").map(Number);
    return new Date(annee, (mois || 1) - 1, j || 1, h || 0, m || 0).getTime();
  }

  function versJourHeure(ts: number): { jour: string; heure: string } {
    const d = new Date(ts);
    return {
      jour: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      heure: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    };
  }

  const debutTournoiTs = versTimestamp(dateJour, dateHeure);
  const checkinTs = versTimestamp(dateJour, checkinHeure);
  const finInscriptionsTs = versTimestamp(finInscJour, finInscHeure);
  const AUJOURDHUI = versJourHeure(Date.now()).jour;

  // La fin des inscriptions suit automatiquement l'heure de check-in (20 min
  // avant) tant que l'organisateur ne l'a pas lui-même ajustée — même
  // pattern que le check-in vs. l'heure de début ci-dessus. Ne doit jamais
  // dépasser le check-in (cf. validation dans creer()).
  useEffect(() => {
    if (finInscAjusteManuellement || checkinTs === undefined) return;
    const { jour, heure } = versJourHeure(checkinTs - MARGE_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN * 60 * 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFinInscJour(jour);
    setFinInscHeure(heure);
  }, [checkinTs, finInscAjusteManuellement]);
  const checkin = checkinHeure ? `${checkinHeure.replace(":", "h")}` : "";
  const [reglement, setReglement] = useState("");
  const [informations, setInformations] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [paiementFraisOuvert, setPaiementFraisOuvert] = useState(false);

  const jeu = JEUX.find((j) => j.id === jeuId);
  const jeuIdFinal = jeuId === "autre" ? jeuPersonnalise.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : jeuId;
  const jeuLabelFinal = jeuId === "autre" ? jeuPersonnalise.trim() : (jeu?.label ?? "");
  const capaciteMax = capaciteLobbyMax(jeuIdFinal);
  // Point 200 : formats réellement proposés pour ce jeu (ex. NBA 2K, genre
  // Sport, n'a pas de Battle Royale) — bascule automatiquement sur un format
  // valide si le jeu change et que le format sélectionné n'est plus proposé.
  const formatsAutorises = formatsDisponiblesPourJeu(jeuId);
  const typesDisponibles = TYPES.filter((t) => formatsAutorises.includes(t.id));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!formatsAutorises.includes(type)) setType(formatsAutorises[0] ?? "1v1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jeuId]);
  const places =
    type === "battle_royale" ? Math.min(Number(placesBR) || 0, capaciteMax) : Number(placesTotal) || 0;
  const commissionXof = payant && commissionActivee ? commissionEstimee(Number(fraisXof) || 0, places) : 0;
  // Cash prize d'un tournoi payant : plus de saisie manuelle (point 84) — la
  // cagnotte est entièrement dérivée des frais d'inscription collectés
  // (frais × places attendues), moins la commission de l'organisateur si
  // elle est activée. Se recalcule en temps réel à chaque changement.
  const poolBrut = payant ? (Number(fraisXof) || 0) * places : 0;
  const cashPrizeAutoPayant = Math.max(0, poolBrut - commissionXof);
  // Pour un tournoi gratuit financé par l'organisateur, il n'y a pas de
  // cagnotte à dériver de frais inexistants : ce montant reste une saisie
  // manuelle (ce que l'organisateur engage lui-même depuis son solde).
  const cashPrizeNum = Number(cashPrizeXof) || 0;
  const cashPrizeEffectif = payant ? cashPrizeAutoPayant : financeParOrganisateur ? cashPrizeNum : 0;
  const nbFinalistes = modeFinalistes === "1" ? 1 : modeFinalistes === "3" ? 3 : Math.max(1, Number(nbFinalistesPerso) || 1);
  const repartitionCalculee = repartitionAutomatique(cashPrizeEffectif, nbFinalistes);

  function creer(e: React.FormEvent) {
    e.preventDefault();
    if (jeuId === "autre" && !jeuPersonnalise.trim()) {
      setErreur("Précise le nom du jeu.");
      return;
    }
    if (!titre.trim()) {
      setErreur("Le titre est obligatoire.");
      return;
    }
    if (modalite === "presentiel" && !ville.trim()) {
      setErreur("Précise un lieu pour un tournoi présentiel.");
      return;
    }
    if (!dateLabel.trim()) {
      setErreur("La date est obligatoire.");
      return;
    }
    // Le tournoi et ses fenêtres d'inscription doivent se dérouler à partir
    // de maintenant, jamais dans le passé.
    if (debutTournoiTs !== undefined && debutTournoiTs < Date.now()) {
      setErreur("La date du tournoi ne peut pas être dans le passé.");
      return;
    }
    if (finInscriptionsTs !== undefined && finInscriptionsTs < Date.now()) {
      setErreur("La fin des inscriptions ne peut pas être dans le passé.");
      return;
    }
    if (finInscriptionsTs !== undefined && checkinTs !== undefined && finInscriptionsTs > checkinTs) {
      setErreur("La fin des inscriptions ne peut pas être après l'heure de check-in.");
      return;
    }
    if (
      finInscriptionsTs !== undefined &&
      checkinTs !== undefined &&
      finInscriptionsTs < checkinTs - MARGE_MAX_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN * 60 * 1000
    ) {
      setErreur("La fin des inscriptions ne peut pas être plus d'1h avant le check-in.");
      return;
    }
    if (!reglement.trim()) {
      setErreur("Le règlement est obligatoire.");
      return;
    }
    if (debutTournoiTs !== undefined) {
      if (checkinTs === undefined || debutTournoiTs - checkinTs < DELAI_CHECKIN_MIN_MS) {
        setErreur("Le check-in doit être fixé au moins 10 minutes avant le début du tournoi.");
        return;
      }
    }
    if (financeParOrganisateur && cashPrizeNum > 0 && cashPrizeNum > solde) {
      setErreur("Solde insuffisant pour financer ce cash prize.");
      return;
    }
    if (payant && !payantAutorise) {
      setErreur(
        !certifie
          ? "Deviens organisateur certifié pour pouvoir créer un tournoi payant."
          : "Compte suspendu pour les tournois payants (vérification anti-triche en cours).",
      );
      return;
    }
    setErreur(null);

    if (payant && Number(fraisXof) > 0) {
      // Frais de création bloquants (200 CFA), distincts de la commission :
      // le tournoi n'est créé qu'une fois ce paiement confirmé.
      setPaiementFraisOuvert(true);
      return;
    }

    finaliserCreation();
  }

  async function finaliserCreation() {
    if (debutTournoiTs === undefined) {
      setErreur("La date est invalide.");
      return;
    }
    if (checkinTs === undefined) {
      setErreur("L'heure de check-in est invalide.");
      return;
    }

    const resultat = await creerTournoi({
      jeuId: jeuIdFinal,
      jeuLabel: jeuLabelFinal,
      titre: titre.trim(),
      type,
      modalite,
      ville: modalite === "virtuel" ? undefined : ville.trim(),
      cashPrizeXof: cashPrizeEffectif,
      fraisXof: payant ? Number(fraisXof) || 0 : 0,
      financementCashPrize: financeParOrganisateur ? "organisateur" : "inscriptions",
      commissionActivee: payant && commissionActivee,
      placesTotal: places,
      checkinTs,
      reglement: reglement.trim(),
      informations: informations.trim() || undefined,
      banniereUrl,
      symboleId,
      debutTournoiTs,
      // Les inscriptions s'ouvrent dès la création du tournoi — pas de champ
      // "début des inscriptions" à saisir, contrairement à la fin qui reste
      // réglable (cf. finInscriptionsTs ci-dessous).
      debutInscriptionsTs: Date.now(),
      finInscriptionsTs,
      modeEquipe: type === "equipes" ? modeEquipe : undefined,
      brSousType: type === "battle_royale" ? brSousType : undefined,
      manchesPrevues: type === "battle_royale" ? Math.max(1, Number(manchesPrevues) || 1) : undefined,
      manchesParMatch: type !== "battle_royale" ? Number(manchesParMatch) : undefined,
      equipeSousType: type === "equipes" ? equipeSousType : undefined,
      repartitionCashPrize:
        (payant || financeParOrganisateur) && cashPrizeEffectif > 0 ? repartitionCalculee : undefined,
    });

    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Erreur lors de la création du tournoi.");
      return;
    }

    if (financeParOrganisateur && cashPrizeNum > 0) {
      await debiter(cashPrizeNum, `Cash prize · ${titre.trim()}`, "financement", resultat.tournoi.id);
    }

    router.push(`/tournois/${resultat.tournoi.id}`);
  }

  if (paiementFraisOuvert) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Frais de création" onRetour={() => setPaiementFraisOuvert(false)} />
        <div className="mt-4 max-w-sm">
          <PaiementFraisFixes
            montantXof={FRAIS_CREATION_TOURNOI_PAYANT_XOF}
            libelle={`Frais de création · ${titre.trim() || "tournoi payant"}`}
            onAnnuler={() => setPaiementFraisOuvert(false)}
            onValide={() => {
              setPaiementFraisOuvert(false);
              finaliserCreation();
            }}
          />
        </div>
      </div>
    );
  }

  if (!onboardingOk) return null;

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <AppBar retour titre="Créer un tournoi" onRetour={() => router.back()} />

      <form onSubmit={creer} className="flex flex-col gap-5 mt-4 max-w-sm pb-10">
        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Première décision : payant ou gratuit ?
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SegmentedControl
            options={[
              { id: "gratuit", label: "Gratuit" },
              { id: "payant", label: "Payant" },
            ]}
            valeur={payant ? "payant" : "gratuit"}
            onChange={(v) => {
              if (v === "payant" && !payantAutorise) {
                if (!identiteVerifiee) {
                  setAlerteVerifOuverte(true);
                  return;
                }
                if (!certifie) {
                  // Point 187 : l'identité est déjà vérifiée (étape 1) — au
                  // lieu de répéter le même message, on envoie directement
                  // vers la demande de certification (étape 2, point 181).
                  router.push("/organisateur?ouvrirCertification=1");
                  return;
                }
                setErreur("Ton compte organisateur est temporairement suspendu (vérification anti-triche en cours) : impossible de créer un tournoi payant.");
                return;
              }
              setErreur(null);
              setPayant(v === "payant");
            }}
          />
          <p className="text-xs leading-relaxed" style={{ color: "var(--ds-muted)" }}>
            Activé par défaut : chaque inscrit paie les frais que tu fixes ci-dessous, et la cagnotte devient
            automatiquement le cash prize. Ce n&apos;est pas obligatoire — désactive pour un tournoi gratuit à
            l&apos;inscription (voir « Financer un cash prize depuis mon solde » ci-dessous si tu veux quand même
            offrir un gain).
          </p>
          {!payantAutorise && (
            <p className="text-xs" style={{ color: "var(--ds-danger)" }}>
              {!identiteVerifiee
                ? "Organisateur standard : tournois gratuits uniquement pour l'instant (vérifie ton identité puis envoie une demande de statut certifié pour débloquer les tournois payants et ta commission)."
                : !certifie
                  ? "Identité vérifiée : envoie ta demande de statut organisateur certifié depuis ton tableau de bord pour débloquer les tournois payants."
                  : "Compte suspendu pour les tournois payants (vérification en cours). Tu peux toujours créer des tournois gratuits."}
            </p>
          )}

          {!payant && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={financeParOrganisateur}
                  onChange={(e) => setFinanceParOrganisateur(e.target.checked)}
                />
                Financer un cash prize depuis mon solde TourneyCard
              </label>
              {financeParOrganisateur && (
                <>
                  <Field label="Cash prize à engager (F)" type="number" min={0} value={cashPrizeXof} onChange={(e) => setCashPrizeXof(e.target.value)} />
                  <p className="text-xs" style={{ color: cashPrizeNum > solde ? "var(--ds-danger)" : "var(--ds-muted)" }}>
                    Solde disponible : {formatXof(solde)}. Ce montant est débité immédiatement à la création et devient le cash prize, inscription gratuite pour les participants.
                  </p>
                </>
              )}
            </div>
          )}

          {payant && (
            <>
              <Field label="Frais d'inscription (F)" type="number" min={0} value={fraisXof} onChange={(e) => setFraisXof(e.target.value)} />
              {Number(fraisXof) > 0 && (
                <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                  Des frais de création de {formatXof(FRAIS_CREATION_TOURNOI_PAYANT_XOF)} te seront demandés avant la publication (tournoi payant à l&apos;inscription).
                </p>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={commissionActivee}
                  onChange={(e) => setCommissionActivee(e.target.checked)}
                />
                Activer ma commission ({Math.round(COMMISSION_PCT * 100)} % des frais collectés)
              </label>

              {commissionActivee && (
                <div
                  className="p-3 text-xs font-medium"
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                >
                  Commission organisateur : {Math.round(COMMISSION_PCT * 100)} %
                </div>
              )}
            </>
          )}

          {((payant && Number(fraisXof) > 0 && places > 0) || (financeParOrganisateur && cashPrizeNum > 0)) && (
                <div className="flex flex-col gap-2">
                  <div
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
                  >
                    Répartition du cash prize
                  </div>
                  {payant && (
                    <div
                      className="p-3 flex flex-col gap-1 text-xs"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--ds-muted)" }}>Cagnotte maximale si {places} places sont prises ({formatXof(Number(fraisXof) || 0)}/joueur)</span>
                        <span style={{ fontFamily: "var(--ds-font-mono)" }}>{formatXof(poolBrut)}</span>
                      </div>
                      {commissionActivee && (
                        <div className="flex items-center justify-between">
                          <span style={{ color: "var(--ds-muted)" }}>Ta commission ({Math.round(COMMISSION_PCT * 100)} %)</span>
                          <span style={{ fontFamily: "var(--ds-font-mono)" }}>- {formatXof(commissionXof)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--ds-border)" }}>
                        <span>Cash prize maximal (pour les finalistes)</span>
                        <span style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{formatXof(cashPrizeEffectif)}</span>
                      </div>
                      <p className="mt-1" style={{ color: "var(--ds-muted)" }}>
                        Ce montant n&apos;est pas garanti : le cash prize réel se calcule sur les inscriptions effectivement reçues à la
                        clôture, pas sur cette capacité maximale — il sera affiché comme « estimé » sur la fiche du tournoi jusque-là.
                      </p>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                    Choisis combien de finalistes se partagent le cash prize — la répartition entre eux est calculée automatiquement (barème dégressif).
                  </p>
                  <SegmentedControl
                    options={[
                      { id: "1" as ModeFinalistes, label: "Vainqueur" },
                      { id: "3" as ModeFinalistes, label: "Top 3" },
                      { id: "perso" as ModeFinalistes, label: "Personnalisé" },
                    ]}
                    valeur={modeFinalistes}
                    onChange={setModeFinalistes}
                  />

                  {modeFinalistes === "perso" && (
                    <Field
                      label="Nombre de finalistes"
                      type="number"
                      min={1}
                      max={20}
                      value={nbFinalistesPerso}
                      onChange={(e) => setNbFinalistesPerso(e.target.value)}
                    />
                  )}

                  <div className="flex flex-col gap-1.5">
                    {repartitionCalculee.map((r) => (
                      <div key={r.label} className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--ds-muted)" }}>{r.label}</span>
                        <span style={{ fontFamily: "var(--ds-font-mono)" }}>{formatXof(r.montantXof)}</span>
                      </div>
                    ))}
                  </div>
                </div>
          )}
        </div>

        <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 24px, var(--ds-border) calc(100% - 24px), transparent)" }} />

        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Bannière
          </div>
          <BannerCropper banniereActuelle={banniereUrl} onValider={setBanniereUrl} />
        </div>

        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Symbole (onglet En direct)
          </div>
          <SelecteurSymbole symboleId={symboleId} onChange={setSymboleId} />
        </div>

        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Jeu
          </div>
          <SelecteurJeu jeuId={jeuId} onChange={setJeuId} />
          {jeuId === "autre" && (
            <div className="mt-2">
              <Field
                value={jeuPersonnalise}
                onChange={(e) => setJeuPersonnalise(e.target.value)}
                placeholder="Nom du jeu (ex: Bloodstrike)"
              />
            </div>
          )}
        </div>

        <Field label="Titre du tournoi" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Abidjan Cup #13" />

        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Format de compétition
          </div>
          <SegmentedControl options={typesDisponibles} valeur={type} onChange={setType} />
          {typesDisponibles.length < TYPES.length && (
            <p className="text-xs mt-1.5" style={{ color: "var(--ds-muted)" }}>
              Formats limités à ceux réellement proposés par {jeuLabelFinal || "ce jeu"}.
            </p>
          )}
        </div>

        <MiniatureFormat
          type={type}
          brSousType={type === "battle_royale" ? brSousType : undefined}
          equipeSousType={type === "equipes" ? equipeSousType : undefined}
        />

        {type === "equipes" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
                Taille d&apos;équipe
              </label>
              <SegmentedControl options={SOUS_TYPES_EQUIPE} valeur={equipeSousType} onChange={setEquipeSousType} />
            </div>
            <SegmentedControl
              options={[
                { id: "libre" as ModeEquipe, label: "Équipes libres" },
                { id: "predefinies" as ModeEquipe, label: "Équipes prédéfinies" },
              ]}
              valeur={modeEquipe}
              onChange={setModeEquipe}
            />
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              {modeEquipe === "libre"
                ? "Chaque participant indique le nom de son équipe à l'inscription."
                : "Les participants choisissent parmi les noms d'équipe ci-dessous."}
            </p>
            {modeEquipe === "predefinies" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
                  Noms d&apos;équipe (un par ligne)
                </label>
                <textarea
                  value={nomsEquipes}
                  onChange={(e) => setNomsEquipes(e.target.value)}
                  rows={3}
                  placeholder={"Les Lions\nLes Éléphants"}
                  className="px-3.5 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: "var(--ds-surface-2)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: "var(--ds-radius-input)",
                    color: "var(--ds-text)",
                    fontFamily: "var(--ds-font-mono)",
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Modalité
          </div>
          <SegmentedControl
            options={[
              { id: "presentiel" as Modalite, label: "Présentiel" },
              { id: "virtuel" as Modalite, label: "Virtuel" },
            ]}
            valeur={modalite}
            onChange={setModalite}
          />
        </div>

        {modalite === "presentiel" && (
          <Field label="Lieu" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Abidjan, Cocody" />
        )}

        {type !== "battle_royale" && (
          <>
            <Field
              label={type === "equipes" ? "Nombre d'équipes" : "Places"}
              type="number"
              min={2}
              value={placesTotal}
              onChange={(e) => setPlacesTotal(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
                Nombre de manches par match
              </label>
              <SegmentedControl options={OPTIONS_BO} valeur={manchesParMatch} onChange={setManchesParMatch} />
            </div>
          </>
        )}
        {type === "battle_royale" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
              Sous-type
            </label>
            <SegmentedControl options={SOUS_TYPES_BR} valeur={brSousType} onChange={setBrSousType} />
            <Field
              label={`Nombre de ${brSousType === "solo" ? "joueurs" : "places"}`}
              type="number"
              min={2}
              max={capaciteMax}
              value={placesBR}
              onChange={(e) => setPlacesBR(e.target.value)}
            />
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Capacité maximale de lobby pour ce jeu : {capaciteMax} joueurs.
            </p>
            <Field
              label="Nombre de manches"
              type="number"
              min={1}
              value={manchesPrevues}
              onChange={(e) => setManchesPrevues(e.target.value)}
            />
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Le tournoi se clôturera automatiquement une fois ce nombre de manches joué.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Date du tournoi" type="date" min={AUJOURDHUI} value={dateJour} onChange={(e) => setDateJour(e.target.value)} />
          <Field label="Heure du tournoi" type="time" value={dateHeure} onChange={(e) => setDateHeure(e.target.value)} />
        </div>
        <p className="text-xs -mt-3" style={{ color: "var(--ds-muted)" }}>
          C&apos;est la date et l&apos;heure auxquelles ton tournoi se déroulera — ne peut pas être dans le passé.
          {dateLabel && (
            <>
              {" "}
              Affiché comme : <span style={{ color: "var(--ds-accent-300)" }}>{dateLabel}</span>
            </>
          )}
        </p>
        <Field
          label="Heure de check-in"
          type="time"
          value={checkinHeure}
          onChange={(e) => {
            setCheckinHeure(e.target.value);
            setCheckinAjusteManuellement(true);
          }}
        />
        <p className="text-xs -mt-3" style={{ color: "var(--ds-muted)" }}>
          {checkinAjusteManuellement
            ? "Réglée manuellement — ne suit plus automatiquement l'heure de début."
            : `Synchronisée automatiquement (${DELAI_CHECKIN_DEFAUT_MIN} min avant le début).`}
        </p>
        {(() => {
          if (debutTournoiTs === undefined) return null;
          const invalide = checkinTs === undefined || debutTournoiTs - checkinTs < DELAI_CHECKIN_MIN_MS;
          return (
            <p className="text-xs -mt-3" style={{ color: invalide ? "var(--ds-danger)" : "var(--ds-muted)" }}>
              {invalide
                ? "Doit être au moins 10 minutes avant le début du tournoi."
                : "Au moins 10 minutes avant le début — tu peux choisir plus tôt."}
            </p>
          );
        })()}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Fin des inscriptions
          </label>
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            Les inscriptions s&apos;ouvrent dès la création du tournoi.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              type="date"
              min={AUJOURDHUI}
              value={finInscJour}
              onChange={(e) => {
                setFinInscJour(e.target.value);
                setFinInscAjusteManuellement(true);
              }}
            />
            <Field
              type="time"
              value={finInscHeure}
              onChange={(e) => {
                setFinInscHeure(e.target.value);
                setFinInscAjusteManuellement(true);
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            {finInscAjusteManuellement
              ? "Réglée manuellement — ne suit plus automatiquement le check-in."
              : `Synchronisée automatiquement (${MARGE_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN} min avant le check-in) — modifiable ci-dessus.`}
          </p>
          {finInscriptionsTs !== undefined && checkinTs !== undefined && finInscriptionsTs > checkinTs && (
            <p className="text-xs" style={{ color: "var(--ds-danger)" }}>
              Ne peut pas être après l&apos;heure de check-in.
            </p>
          )}
          {finInscriptionsTs !== undefined &&
            checkinTs !== undefined &&
            finInscriptionsTs < checkinTs - MARGE_MAX_FIN_INSCRIPTIONS_AVANT_CHECKIN_MIN * 60 * 1000 && (
              <p className="text-xs" style={{ color: "var(--ds-danger)" }}>
                Ne peut pas être plus d&apos;1h avant le check-in.
              </p>
            )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Règlement (obligatoire)
          </label>
          <textarea
            value={reglement}
            onChange={(e) => setReglement(e.target.value)}
            rows={3}
            placeholder="Élimination directe, score à signaler avec capture d'écran..."
            className="px-3.5 py-2.5 text-sm outline-none resize-none"
            style={{
              background: "var(--ds-surface-2)",
              border: "1px solid var(--ds-border)",
              borderRadius: "var(--ds-radius-input)",
              color: "var(--ds-text)",
              fontFamily: "var(--ds-font-mono)",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Informations (facultatif)
          </label>
          <textarea
            value={informations}
            onChange={(e) => setInformations(e.target.value)}
            rows={3}
            placeholder="Lieu précis, matériel fourni, contact sur place..."
            className="px-3.5 py-2.5 text-sm outline-none resize-none"
            style={{
              background: "var(--ds-surface-2)",
              border: "1px solid var(--ds-border)",
              borderRadius: "var(--ds-radius-input)",
              color: "var(--ds-text)",
              fontFamily: "var(--ds-font-mono)",
            }}
          />
        </div>

        {erreur && <p className="text-sm" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}

        <Button variante="primary" bloc type="submit">
          Créer le tournoi
        </Button>
      </form>

      <AlerteVerificationIdentite
        ouvert={alerteVerifOuverte}
        description="L'accès aux tournois payants nécessite d'abord de compléter la vérification d'identité (pièce d'identité + âge). Une fois validée, tu pourras envoyer ta demande de statut organisateur certifié."
        onFermer={() => setAlerteVerifOuverte(false)}
      />
    </div>
  );
}
