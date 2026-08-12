"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Tag } from "@/components/ds/Tag";
import { Button } from "@/components/ds/Button";
import { lireProfil } from "@/lib/mockProfil";
import { formatXof } from "@/lib/formatXof";
import {
  JEUX,
  creerTournoi,
  commissionEstimee,
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
  const inputBanniereRef = useRef<HTMLInputElement>(null);

  const [banniereUrl, setBanniereUrl] = useState<string | undefined>(undefined);
  const [jeuId, setJeuId] = useState(JEUX[0].id);
  const [jeuPersonnalise, setJeuPersonnalise] = useState("");
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeCompetition>("1v1");
  const [modalite, setModalite] = useState<Modalite>("presentiel");
  const [ville, setVille] = useState("");
  const [modeEquipe, setModeEquipe] = useState<ModeEquipe>("libre");
  const [nomsEquipes, setNomsEquipes] = useState("");
  const [placesTotal, setPlacesTotal] = useState("16");
  const [payant, setPayant] = useState(false);
  const [fraisXof, setFraisXof] = useState("1000");
  const [cashPrizeXof, setCashPrizeXof] = useState("0");
  const [repartitionMode, setRepartitionMode] = useState<RepartitionMode>("vainqueur");
  const [repartitionPerso, setRepartitionPerso] = useState<RepartitionCashPrize[]>([
    { label: "1er", montantXof: 0 },
  ]);
  const [dateJour, setDateJour] = useState("");
  const [dateHeure, setDateHeure] = useState("20:00");
  const [checkinHeure, setCheckinHeure] = useState("19:30");
  const dateLabel = formatDateLabel(dateJour, dateHeure);
  const clotureInscriptionsTs = (() => {
    if (!dateJour) return undefined;
    const [annee, mois, jour] = dateJour.split("-").map(Number);
    const [h, m] = (dateHeure || "00:00").split(":").map(Number);
    return new Date(annee, (mois || 1) - 1, jour || 1, h || 0, m || 0).getTime();
  })();
  const checkin = checkinHeure ? `${checkinHeure.replace(":", "h")}` : "";
  const [reglement, setReglement] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const jeu = JEUX.find((j) => j.id === jeuId);
  const jeuIdFinal = jeuId === "autre" ? jeuPersonnalise.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : jeuId;
  const jeuLabelFinal = jeuId === "autre" ? jeuPersonnalise.trim() : (jeu?.label ?? "");
  const places = type === "battle_royale" ? 50 : Number(placesTotal) || 0;
  const commission = payant
    ? commissionEstimee(Number(fraisXof) || 0, places)
    : 0;
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
    setErreur(null);

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
      organisateur: lireProfil().pseudo,
      format: labelFormat(),
      type,
      modalite,
      ville: modalite === "virtuel" ? "En ligne" : ville.trim(),
      dateLabel: dateLabel.trim(),
      cashPrizeXof: cashPrizeNum,
      fraisXof: payant ? Number(fraisXof) || 0 : 0,
      placesTotal: places,
      checkin: checkin.trim(),
      enDirect: false,
      reglement: reglement.trim(),
      inscrits: [],
      banniereUrl,
      clotureInscriptionsTs,
      equipes,
      modeEquipe: type === "equipes" ? modeEquipe : undefined,
      repartitionCashPrize:
        payant && cashPrizeNum > 0 ? repartitionCalculee : undefined,
    });

    router.push(`/tournois/${tournoi.id}`);
  }

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
          <input
            ref={inputBanniereRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              if (!fichier) return;
              const lecteur = new FileReader();
              lecteur.onload = () => setBanniereUrl(lecteur.result as string);
              lecteur.readAsDataURL(fichier);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputBanniereRef.current?.click()}
            className="w-full h-[110px] flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden"
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border-strong)", background: "var(--ds-surface)" }}
          >
            {banniereUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banniereUrl} alt="Bannière du tournoi" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImagePlus size={20} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Ajouter une image</span>
              </>
            )}
          </button>
        </div>

        <div>
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Jeu
          </div>
          <div className="flex gap-2 flex-wrap">
            {JEUX.map((j) => (
              <Tag key={j.id} actif={jeuId === j.id} onClick={() => setJeuId(j.id)}>
                {j.label}
              </Tag>
            ))}
            <Tag actif={jeuId === "autre"} onClick={() => setJeuId("autre")}>
              Autre
            </Tag>
          </div>
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
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            50 joueurs par défaut pour un Battle Royale.
          </p>
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

        <div className="flex flex-col gap-3">
          <SegmentedControl
            options={[
              { id: "gratuit", label: "Gratuit" },
              { id: "payant", label: "Payant" },
            ]}
            valeur={payant ? "payant" : "gratuit"}
            onChange={(v) => setPayant(v === "payant")}
          />

          {payant && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Frais d'inscription (F)" type="number" min={0} value={fraisXof} onChange={(e) => setFraisXof(e.target.value)} />
                <Field label="Cash prize (F)" type="number" min={0} value={cashPrizeXof} onChange={(e) => setCashPrizeXof(e.target.value)} />
              </div>
              <div
                className="p-3 text-xs"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
              >
                Tu toucheras environ <strong>{formatXof(commission)}</strong> de
                commission (5 % des frais collectés) si le tournoi se remplit,
                en plus du cash prize versé aux finalistes.
              </div>

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

        {erreur && <p className="text-sm" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}

        <Button variante="primary" bloc type="submit">
          Créer le tournoi
        </Button>
      </form>
    </div>
  );
}
