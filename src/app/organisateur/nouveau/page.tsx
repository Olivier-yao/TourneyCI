"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BannerCropper } from "@/components/ds/BannerCropper";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { SelecteurJeu } from "@/components/ds/SelecteurJeu";
import { PaiementFraisFixes } from "@/components/ds/PaiementFraisFixes";
import { Button } from "@/components/ds/Button";
import { lireSolde, debiter } from "@/lib/mockWallet";
import { peutCreerTournoiPayant, nomOrganisateurActuel, onboardingOrganisateurComplet } from "@/lib/mockOrganisateur";
import { formatXof } from "@/lib/formatXof";
import {
  JEUX,
  creerTournoi,
  decomposerCommission,
  tauxPlateformeSurCommission,
  capaciteLobbyMax,
  FRAIS_CREATION_TOURNOI_PAYANT_XOF,
  type TypeCompetition,
  type Modalite,
  type ModeEquipe,
  type RepartitionCashPrize,
} from "@/lib/mockTournaments";

type RepartitionMode = "vainqueur" | "top3" | "perso";

const TYPES: { id: TypeCompetition; label: string }[] = [
  { id: "1v1", label: "1v1" },
  { id: "equipes", label: "Équipes" },
  { id: "battle_royale", label: "Battle Royale" },
];

const SOUS_TYPES_BR: { id: "solo" | "duo" | "squad"; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "duo", label: "Duo" },
  { id: "squad", label: "Squad" },
];

function SegmentedControl<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { id: T; label: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex p-[3px] gap-[3px]"
      style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className="flex-1 h-9 text-[13px] font-medium cursor-pointer transition-colors"
          style={{
            borderRadius: "var(--ds-radius-sm)",
            background: valeur === o.id ? "var(--ds-accent-900)" : "transparent",
            color: valeur === o.id ? "var(--ds-accent-300)" : "var(--ds-muted)",
            fontFamily: "var(--ds-font-body)",
          }}
        >
          {o.label}
        </button>
      ))}
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
  const [jeuId, setJeuId] = useState(JEUX[0].id);
  const [jeuPersonnalise, setJeuPersonnalise] = useState("");
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeCompetition>("1v1");
  const [brSousType, setBrSousType] = useState<"solo" | "duo" | "squad">("solo");
  const [modalite, setModalite] = useState<Modalite>("presentiel");
  const [ville, setVille] = useState("");
  const [modeEquipe, setModeEquipe] = useState<ModeEquipe>("libre");
  const [nomsEquipes, setNomsEquipes] = useState("");
  const [placesTotal, setPlacesTotal] = useState("16");
  const [placesBR, setPlacesBR] = useState("50");
  const [payant, setPayant] = useState(false);
  const [commissionActivee, setCommissionActivee] = useState(false);
  const [tauxPlateforme, setTauxPlateforme] = useState(0.2);
  const [financeParOrganisateur, setFinanceParOrganisateur] = useState(false);
  const [solde, setSolde] = useState(0);
  const [payantAutorise, setPayantAutorise] = useState(true);
  const [onboardingOk, setOnboardingOk] = useState(false);

  useEffect(() => {
    if (!onboardingOrganisateurComplet()) {
      router.replace("/organisateur");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolde(lireSolde());
    setPayantAutorise(peutCreerTournoiPayant(nomOrganisateurActuel()));
    setTauxPlateforme(tauxPlateformeSurCommission());
    setOnboardingOk(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [fraisXof, setFraisXof] = useState("1000");
  const [cashPrizeXof, setCashPrizeXof] = useState("0");
  const [repartitionMode, setRepartitionMode] = useState<RepartitionMode>("vainqueur");
  const [repartitionPerso, setRepartitionPerso] = useState<RepartitionCashPrize[]>([
    { label: "1er", montantXof: 0 },
  ]);
  const [dateJour, setDateJour] = useState("");
  const [dateHeure, setDateHeure] = useState("20:00");
  const [checkinHeure, setCheckinHeure] = useState("19:30");
  const [debutInscJour, setDebutInscJour] = useState("");
  const [debutInscHeure, setDebutInscHeure] = useState("");
  const [finInscJour, setFinInscJour] = useState("");
  const [finInscHeure, setFinInscHeure] = useState("");
  const dateLabel = formatDateLabel(dateJour, dateHeure);

  function versTimestamp(jour: string, heure: string): number | undefined {
    if (!jour) return undefined;
    const [annee, mois, j] = jour.split("-").map(Number);
    const [h, m] = (heure || "00:00").split(":").map(Number);
    return new Date(annee, (mois || 1) - 1, j || 1, h || 0, m || 0).getTime();
  }

  const debutTournoiTs = versTimestamp(dateJour, dateHeure);
  const debutInscriptionsTs = versTimestamp(debutInscJour, debutInscHeure);
  const finInscriptionsTs = versTimestamp(finInscJour, finInscHeure);
  const checkin = checkinHeure ? `${checkinHeure.replace(":", "h")}` : "";
  const [reglement, setReglement] = useState("");
  const [informations, setInformations] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [paiementFraisOuvert, setPaiementFraisOuvert] = useState(false);

  const jeu = JEUX.find((j) => j.id === jeuId);
  const jeuIdFinal = jeuId === "autre" ? jeuPersonnalise.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : jeuId;
  const jeuLabelFinal = jeuId === "autre" ? jeuPersonnalise.trim() : (jeu?.label ?? "");
  const capaciteMax = capaciteLobbyMax(jeuIdFinal);
  const places =
    type === "battle_royale" ? Math.min(Number(placesBR) || 0, capaciteMax) : Number(placesTotal) || 0;
  const commission = payant && commissionActivee ? decomposerCommission(Number(fraisXof) || 0, places) : { brute: 0, partPlateforme: 0, net: 0 };
  const cashPrizeNum = Number(cashPrizeXof) || 0;

  const repartitionCalculee: RepartitionCashPrize[] =
    repartitionMode === "vainqueur"
      ? [{ label: "Vainqueur", montantXof: cashPrizeNum }]
      : repartitionMode === "top3"
        ? [
            { label: "1er", montantXof: Math.round(cashPrizeNum * 0.5) },
            { label: "2e", montantXof: Math.round(cashPrizeNum * 0.3) },
            { label: "3e", montantXof: Math.round(cashPrizeNum * 0.2) },
          ]
        : repartitionPerso;

  function labelFormat(): string {
    if (type === "1v1") return "1v1";
    if (type === "equipes") return `Équipes${modeEquipe === "libre" ? " · libre" : ""}`;
    return `Battle Royale · ${places} joueurs`;
  }

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
    if (financeParOrganisateur && cashPrizeNum > 0 && cashPrizeNum > solde) {
      setErreur("Solde insuffisant pour financer ce cash prize.");
      return;
    }
    if (payant && !payantAutorise) {
      setErreur("Compte suspendu pour les tournois payants (vérification anti-triche en cours).");
      return;
    }
    setErreur(null);

    if (payant && Number(fraisXof) > 0) {
      // Frais de création bloquants (150F), distincts de la commission :
      // le tournoi n'est créé qu'une fois ce paiement confirmé.
      setPaiementFraisOuvert(true);
      return;
    }

    finaliserCreation();
  }

  function finaliserCreation() {
    if (financeParOrganisateur && cashPrizeNum > 0) {
      debiter(cashPrizeNum, `Cash prize · ${titre.trim()}`, "financement");
    }

    const equipes =
      type === "equipes" && modeEquipe === "predefinies"
        ? nomsEquipes
            .split("\n")
            .map((n) => n.trim())
            .filter(Boolean)
            .map((nom, i) => ({ id: `equipe-${i}`, nom }))
        : undefined;

    const tournoi = creerTournoi({
      jeuId: jeuIdFinal,
      jeuLabel: jeuLabelFinal,
      titre: titre.trim(),
      organisateur: nomOrganisateurActuel(),
      format: labelFormat(),
      type,
      modalite,
      ville: modalite === "virtuel" ? "En ligne" : ville.trim(),
      dateLabel: dateLabel.trim(),
      cashPrizeXof: cashPrizeNum,
      fraisXof: payant ? Number(fraisXof) || 0 : 0,
      financementCashPrize: financeParOrganisateur ? "organisateur" : "inscriptions",
      commissionActivee: payant && commissionActivee,
      placesTotal: places,
      checkin: checkin.trim(),
      enDirect: false,
      reglement: reglement.trim(),
      informations: informations.trim() || undefined,
      inscrits: [],
      banniereUrl,
      debutTournoiTs,
      debutInscriptionsTs,
      finInscriptionsTs,
      equipes,
      modeEquipe: type === "equipes" ? modeEquipe : undefined,
      brSousType: type === "battle_royale" ? brSousType : undefined,
      repartitionCashPrize:
        (payant || financeParOrganisateur) && cashPrizeNum > 0 ? repartitionCalculee : undefined,
    });

    router.push(`/tournois/${tournoi.id}`);
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
      <AppBar retour titre="Créer un tournoi" onRetour={() => router.push("/accueil")} />

      <form onSubmit={creer} className="flex flex-col gap-5 mt-4 max-w-sm pb-10">
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
          <SegmentedControl options={TYPES} valeur={type} onChange={setType} />
        </div>

        {type === "equipes" && (
          <div className="flex flex-col gap-3">
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
          <Field
            label={type === "equipes" ? "Nombre d'équipes" : "Places"}
            type="number"
            min={2}
            value={placesTotal}
            onChange={(e) => setPlacesTotal(e.target.value)}
          />
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Date" type="date" value={dateJour} onChange={(e) => setDateJour(e.target.value)} />
          <Field label="Heure" type="time" value={dateHeure} onChange={(e) => setDateHeure(e.target.value)} />
        </div>
        {dateLabel && (
          <p className="text-xs -mt-3" style={{ color: "var(--ds-muted)" }}>
            Affiché comme : <span style={{ color: "var(--ds-accent-300)" }}>{dateLabel}</span>
          </p>
        )}
        <Field label="Heure de check-in" type="time" value={checkinHeure} onChange={(e) => setCheckinHeure(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Début des inscriptions (facultatif)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <Field type="date" value={debutInscJour} onChange={(e) => setDebutInscJour(e.target.value)} />
            <Field type="time" value={debutInscHeure} onChange={(e) => setDebutInscHeure(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Fin des inscriptions (facultatif)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <Field type="date" value={finInscJour} onChange={(e) => setFinInscJour(e.target.value)} />
            <Field type="time" value={finInscHeure} onChange={(e) => setFinInscHeure(e.target.value)} />
          </div>
          {!finInscJour && (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Non renseigné : les inscriptions se fermeront automatiquement 10 à 15 minutes avant le début du tournoi.
            </p>
          )}
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
                setErreur("Ton compte organisateur est temporairement suspendu (vérification anti-triche en cours) : impossible de créer un tournoi payant.");
                return;
              }
              setErreur(null);
              setPayant(v === "payant");
            }}
          />
          {!payantAutorise && (
            <p className="text-xs" style={{ color: "var(--ds-danger)" }}>
              Compte suspendu pour les tournois payants (vérification en cours). Tu peux toujours créer des tournois gratuits.
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
              <div className="grid grid-cols-2 gap-2">
                <Field label="Frais d'inscription (F)" type="number" min={0} value={fraisXof} onChange={(e) => setFraisXof(e.target.value)} />
                <Field label="Cash prize (F)" type="number" min={0} value={cashPrizeXof} onChange={(e) => setCashPrizeXof(e.target.value)} />
              </div>
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
                Activer ma commission (5 % des frais collectés)
              </label>

              {commissionActivee && (
                <div
                  className="p-3 flex flex-col gap-1 text-xs"
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                >
                  <div className="flex items-center justify-between">
                    <span>Commission brute (5 %)</span>
                    <span style={{ fontFamily: "var(--ds-font-mono)" }}>{formatXof(commission.brute)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Part plateforme ({Math.round(tauxPlateforme * 100)} %)</span>
                    <span style={{ fontFamily: "var(--ds-font-mono)" }}>- {formatXof(commission.partPlateforme)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--ds-accent-600)" }}>
                    <span>Net perçu (si le tournoi se remplit)</span>
                    <span style={{ fontFamily: "var(--ds-font-mono)" }}>{formatXof(commission.net)}</span>
                  </div>
                  <p className="mt-1" style={{ color: "var(--ds-muted)" }}>
                    Prélevé uniquement au versement, en plus du cash prize destiné aux finalistes.
                  </p>
                </div>
              )}
            </>
          )}

          {(payant || financeParOrganisateur) && (
            <>
              {cashPrizeNum > 0 && (
                <div className="flex flex-col gap-2">
                  <div
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
                  >
                    Répartition du cash prize
                  </div>
                  <SegmentedControl
                    options={[
                      { id: "vainqueur" as RepartitionMode, label: "Vainqueur" },
                      { id: "top3" as RepartitionMode, label: "Top 3" },
                      { id: "perso" as RepartitionMode, label: "Personnalisée" },
                    ]}
                    valeur={repartitionMode}
                    onChange={setRepartitionMode}
                  />

                  {repartitionMode === "perso" ? (
                    <div className="flex flex-col gap-2">
                      {repartitionPerso.map((r, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={r.label}
                            onChange={(e) => {
                              const copie = [...repartitionPerso];
                              copie[i] = { ...copie[i], label: e.target.value };
                              setRepartitionPerso(copie);
                            }}
                            placeholder="Ex: 3e"
                            className="w-20 h-10 px-2.5 text-sm outline-none"
                            style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)" }}
                          />
                          <input
                            type="number"
                            min={0}
                            value={r.montantXof}
                            onChange={(e) => {
                              const copie = [...repartitionPerso];
                              copie[i] = { ...copie[i], montantXof: Number(e.target.value) || 0 };
                              setRepartitionPerso(copie);
                            }}
                            className="flex-1 h-10 px-2.5 text-sm outline-none"
                            style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
                          />
                          {repartitionPerso.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRepartitionPerso(repartitionPerso.filter((_, j) => j !== i))}
                              className="text-xs cursor-pointer"
                              style={{ color: "var(--ds-danger)" }}
                            >
                              Retirer
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setRepartitionPerso([
                            ...repartitionPerso,
                            { label: `${repartitionPerso.length + 1}e`, montantXof: 0 },
                          ])
                        }
                        className="text-xs font-medium text-left cursor-pointer"
                        style={{ color: "var(--ds-accent-300)" }}
                      >
                        + Ajouter une place
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {repartitionCalculee.map((r) => (
                        <div key={r.label} className="flex items-center justify-between text-sm">
                          <span style={{ color: "var(--ds-muted)" }}>{r.label}</span>
                          <span style={{ fontFamily: "var(--ds-font-mono)" }}>{formatXof(r.montantXof)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>
            Règlement
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
    </div>
  );
}
