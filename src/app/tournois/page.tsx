"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { CarteTournoi, elementVariants } from "@/components/ds/CarteTournoi";
import { genreDuJeu, modeDuTournoi, tousLesTournois, type Tournoi } from "@/lib/mockTournaments";
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

        {tournois.length === 0 && (
          <motion.p variants={elementVariants} className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            {onglet === "inscriptions" ? "Tu n'es inscrit à aucun tournoi pour l'instant." : "Aucun tournoi ne correspond à ta recherche."}
          </motion.p>
        )}
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
