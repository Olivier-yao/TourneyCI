"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Search, X, SlidersHorizontal, Ticket, Flame, Bell, XCircle, Compass, RotateCcw, ChevronRight } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { CarteTournoi, elementVariants } from "@/components/ds/CarteTournoi";
import { genreDuJeu, modeDuTournoi, tousLesTournois, JEUX, type Tournoi } from "@/lib/mockTournaments";
import { mesInscriptions } from "@/lib/mockInscriptions";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { FiltresTournois, FILTRES_VIDES, compterFiltresActifs, type FiltresValeur } from "@/components/ds/FiltresTournois";

const conteneurVariants = {
  cache: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

type Onglet = "tous" | "inscriptions";

export default function TournoisPage() {
  const connecte = useExigerConnexion();
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [filtres, setFiltres] = useState<FiltresValeur>(FILTRES_VIDES);
  const [requete, setRequete] = useState("");
  const [tousLesTournoisState, setTousLesTournoisState] = useState<Tournoi[]>([]);
  const [idsInscrits, setIdsInscrits] = useState<Set<string>>(new Set());

  useEffect(() => {
    // État dépendant du localStorage : liste vide au premier rendu serveur,
    // synchronisée côté client une fois montée (évite un mismatch d'hydratation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTousLesTournoisState(tousLesTournois());
    setIdsInscrits(new Set(mesInscriptions().map((i) => i.tournoiId)));
  }, []);

  function correspond(t: Tournoi, f: FiltresValeur) {
    const jeuLibreActif = Boolean(f.jeuLibre?.trim());
    if (f.jeux.length > 0 || jeuLibreActif) {
      const matchCatalogue = f.jeux.includes(t.jeuId);
      const matchLibre = jeuLibreActif && t.jeuLabel.toLowerCase().includes(f.jeuLibre!.trim().toLowerCase());
      if (!matchCatalogue && !matchLibre) return false;
    }
    if (f.genres.length > 0) {
      const genre = genreDuJeu(t.jeuId);
      if (!genre || !f.genres.includes(genre)) return false;
    }
    if (f.modes.length > 0) {
      const mode = modeDuTournoi(t);
      if (!mode || !f.modes.includes(mode)) return false;
    }
    return true;
  }

  const base = onglet === "inscriptions" ? tousLesTournoisState.filter((t) => idsInscrits.has(t.id)) : tousLesTournoisState;

  const tousFiltres = (f: FiltresValeur) =>
    base.filter(
      (t) =>
        correspond(t, f) &&
        (!requete ||
          t.titre.toLowerCase().includes(requete.toLowerCase()) ||
          (t.code ?? "").toLowerCase() === requete.trim().toLowerCase()),
    );

  const tournois = tousFiltres(filtres);
  const nbFiltresActifs = compterFiltresActifs(filtres);
  const nbEnDirect = tousLesTournoisState.filter((t) => t.enDirect).length;

  /** Premier filtre actif à proposer de retirer dans l'état vide "recherche
   * sans résultat" (point 134 / v7 L5b) — un seul suffit à réamorcer la
   * recherche, pas la peine de tous les lister. */
  function premierFiltreActif(): { label: string; retirer: () => void } | null {
    if (filtres.jeuLibre?.trim()) {
      const valeur = filtres.jeuLibre;
      return { label: valeur, retirer: () => setFiltres((f) => ({ ...f, jeuLibre: undefined })) };
    }
    if (filtres.jeux.length > 0) {
      const id = filtres.jeux[0];
      const label = JEUX.find((j) => j.id === id)?.label ?? id;
      return { label, retirer: () => setFiltres((f) => ({ ...f, jeux: f.jeux.filter((j) => j !== id) })) };
    }
    if (filtres.genres.length > 0) {
      const genre = filtres.genres[0];
      return { label: genre, retirer: () => setFiltres((f) => ({ ...f, genres: f.genres.filter((g) => g !== genre) })) };
    }
    if (filtres.modes.length > 0) {
      const mode = filtres.modes[0];
      return { label: mode, retirer: () => setFiltres((f) => ({ ...f, modes: f.modes.filter((m) => m !== mode) })) };
    }
    return null;
  }

  if (!connecte) return null;

  return (
    <motion.div
      initial="cache"
      animate="visible"
      variants={conteneurVariants}
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div
        className="sticky top-0 z-10 px-[22px] pt-[22px] pb-3 flex flex-col gap-4"
        style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}
      >
        <motion.h1
          variants={elementVariants}
          className="text-2xl"
          style={{
            fontFamily: "var(--ds-font-heading)",
            fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
          }}
        >
          Tournois
        </motion.h1>

        <motion.div
          variants={elementVariants}
          className="flex p-[3px] gap-[3px]"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
        >
          <button
            type="button"
            onClick={() => setOnglet("tous")}
            className="flex-1 h-8 text-[13px] font-semibold cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "tous" ? "var(--ds-accent-900)" : "transparent",
              color: onglet === "tous" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            Tous les tournois
          </button>
          <button
            type="button"
            onClick={() => setOnglet("inscriptions")}
            className="flex-1 h-8 text-[13px] font-semibold cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "inscriptions" ? "var(--ds-accent-900)" : "transparent",
              color: onglet === "inscriptions" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            Mes inscriptions
          </button>
        </motion.div>

        <motion.div variants={elementVariants} className="flex items-center gap-2">
          <div
            className="relative flex-1 flex items-center"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <Search size={15} className="ml-3 shrink-0" style={{ color: "var(--ds-muted)" }} />
            <input
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              placeholder="Titre ou code du tournoi..."
              className="flex-1 h-11 bg-transparent outline-none text-sm px-2.5"
              style={{ color: "var(--ds-text)" }}
            />
            {requete && (
              <button type="button" onClick={() => setRequete("")} className="pr-3 cursor-pointer" style={{ color: "var(--ds-muted)" }}>
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFiltresOuverts(true)}
            className="flex items-center gap-1.5 h-11 px-3.5 text-[13px] font-semibold cursor-pointer shrink-0"
            style={{
              borderRadius: "var(--ds-radius-btn)",
              background: nbFiltresActifs > 0 ? "var(--ds-accent-900)" : "var(--ds-surface)",
              border: `1px solid ${nbFiltresActifs > 0 ? "var(--ds-accent)" : "var(--ds-border)"}`,
              color: nbFiltresActifs > 0 ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            Filtre
            {nbFiltresActifs > 0 && (
              <span
                className="min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[10px]"
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent)", color: "var(--ds-bg)", fontFamily: "var(--ds-font-mono)" }}
              >
                {nbFiltresActifs}
              </span>
            )}
          </button>
        </motion.div>
      </div>

      <div className="px-[22px] pt-4 flex-1 flex flex-col gap-3 pb-24">
        {tournois.map((t) => (
          <CarteTournoi key={t.id} tournoi={t} />
        ))}

        {tournois.length === 0 && onglet === "inscriptions" && (
          <motion.div variants={elementVariants} className="flex flex-col items-start gap-4 pt-6">
            <div
              className="flex items-center justify-center"
              style={{ width: 62, height: 70, background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent-700)", clipPath: "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)" }}
            >
              <Ticket size={26} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            </div>
            <div>
              <div
                className="text-[22px] leading-tight"
                style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
              >
                Tu n&apos;es inscrit à aucun<br />tournoi pour l&apos;instant
              </div>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                Tes inscriptions apparaîtront ici dès que tu auras rejoint un tournoi — avec ton heure de check-in et ton bracket.
              </p>
            </div>
            <div className="self-stretch flex flex-col gap-2">
              <Link
                href="/en-direct"
                className="flex items-center gap-2.5 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
              >
                <Flame size={16} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">{nbEnDirect} tournoi{nbEnDirect > 1 ? "s" : ""} en direct maintenant</div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
              </Link>
              <Link
                href="/notifications"
                className="flex items-center gap-2.5 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
              >
                <Bell size={16} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">Voir mes notifications</div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setOnglet("tous")}
              className="self-stretch h-[46px] flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              <Compass size={16} strokeWidth={2} />
              Parcourir les tournois
            </button>
          </motion.div>
        )}

        {tournois.length === 0 && onglet === "tous" && (() => {
          const filtre = premierFiltreActif();
          return (
            <motion.div variants={elementVariants} className="flex flex-col items-start gap-4 pt-6">
              <div
                className="flex items-center justify-center"
                style={{ width: 62, height: 70, background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", clipPath: "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)" }}
              >
                <Search size={26} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              </div>
              <div>
                <div
                  className="text-[22px] leading-tight"
                  style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
                >
                  {requete ? <>Aucun résultat pour<br />« {requete} »</> : "Aucun tournoi ne correspond"}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                  {nbFiltresActifs > 0
                    ? `Aucun tournoi ne correspond à cette recherche avec ${nbFiltresActifs} filtre${nbFiltresActifs > 1 ? "s" : ""} actif${nbFiltresActifs > 1 ? "s" : ""}. Élargis la recherche ou retire un filtre.`
                    : "Essaie un autre titre ou un autre code de tournoi."}
                </p>
              </div>
              <div className="self-stretch flex flex-col gap-2">
                {filtre && (
                  <button
                    type="button"
                    onClick={filtre.retirer}
                    className="flex items-center gap-2.5 p-3 cursor-pointer text-left"
                    style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
                  >
                    <XCircle size={16} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] truncate">Retirer le filtre « {filtre.label} »</div>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                  </button>
                )}
                {requete && (
                  <button
                    type="button"
                    onClick={() => setRequete("")}
                    className="flex items-center gap-2.5 p-3 cursor-pointer text-left"
                    style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
                  >
                    <X size={16} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px]">Effacer le texte recherché</div>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequete("");
                  setFiltres(FILTRES_VIDES);
                }}
                className="self-stretch h-[46px] flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
              >
                <RotateCcw size={16} strokeWidth={2} />
                Réinitialiser la recherche
              </button>
            </motion.div>
          );
        })()}
      </div>

      <TabBar />

      <FiltresTournois
        ouvert={filtresOuverts}
        valeur={filtres}
        resultatsCount={(brouillon) => base.filter((t) => correspond(t, brouillon)).length}
        onFermer={() => setFiltresOuverts(false)}
        onAppliquer={setFiltres}
      />
    </motion.div>
  );
}
