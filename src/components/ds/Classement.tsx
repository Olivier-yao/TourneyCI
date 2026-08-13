"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Flame, Medal } from "lucide-react";
import { JEUX } from "@/lib/mockTournaments";
import { CLASSEMENTS, SAISON, SAISON_FIN_LABEL, VILLES, classementDuJeu, estActif, lireProfil, type ClassementEntree } from "@/lib/mockProfil";
import { Avatar } from "./Avatar";

const NB_AFFICHES = 5;

const JEUX_AVEC_CLASSEMENT = JEUX.filter((jeu) => CLASSEMENTS[jeu.id]);

const VILLES_CLASSEMENT = ["Toutes", ...VILLES];

const COULEURS_PODIUM = ["#e8c34a", "#c9ccd6", "#c98a4a"];

/** Un même joueur peut apparaître dans le classement de plusieurs jeux : on
 * fusionne par nom (somme des points) avant de trier et filtrer par ville,
 * sinon il apparaît en double dans le classement global/par ville. */
function construireClassement(villeActif: string): ClassementEntree[] {
  const base = JEUX_AVEC_CLASSEMENT.flatMap((j) => classementDuJeu(j.id));
  const parNom = new Map<string, ClassementEntree>();
  for (const entree of base) {
    const cle = entree.nom.toLowerCase();
    const existant = parNom.get(cle);
    if (existant) {
      existant.points += entree.points;
    } else {
      parNom.set(cle, { ...entree });
    }
  }
  const fusionne = Array.from(parNom.values());
  const filtre = villeActif === "Toutes" ? fusionne : fusionne.filter((e) => e.ville === villeActif);
  return [...filtre].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, position: i + 1 }));
}

function LigneClassement({ entree, monBadgeActif, monPhotoUrl }: { entree: ClassementEntree; monBadgeActif: boolean; monPhotoUrl?: string }) {
  const podium = entree.position <= 3 ? COULEURS_PODIUM[entree.position - 1] : undefined;
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
      <Link
        href={`/joueur/${encodeURIComponent(entree.nom)}`}
        className="flex items-center gap-3 py-2.5"
        style={{
          borderBottom: "1px solid var(--ds-border)",
          background: entree.moi ? "var(--ds-accent-900)" : "transparent",
          borderRadius: entree.moi || podium ? "var(--ds-radius-md)" : undefined,
          paddingLeft: entree.moi || podium ? 10 : 0,
          paddingRight: entree.moi || podium ? 10 : 0,
          borderLeft: podium ? `3px solid ${podium}` : undefined,
        }}
      >
        <div
          className="w-6 flex items-center justify-center text-[13px]"
          style={{ color: podium ?? (entree.moi ? "var(--ds-accent-300)" : "var(--ds-muted)"), fontFamily: "var(--ds-font-mono)" }}
        >
          {podium ? <Medal size={15} strokeWidth={2} style={{ color: podium }} /> : entree.position}
        </div>
        <Avatar initiales={entree.initiales} taille={podium ? 32 : 28} photoUrl={entree.moi ? monPhotoUrl : undefined} />
        <div className="flex-1 flex items-center gap-1.5 text-sm" style={{ fontWeight: entree.moi || podium ? 600 : 400 }}>
          {entree.nom}
          {entree.moi && monBadgeActif && <Flame size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} aria-label="Membre actif" />}
        </div>
        <div className="text-[13px]" style={{ color: podium ?? "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {entree.points.toLocaleString("fr-FR")}
        </div>
      </Link>
    </motion.div>
  );
}

export function Classement() {
  const [villeActif, setVilleActif] = useState<string>("Toutes");
  const [monBadgeActif, setMonBadgeActif] = useState(false);
  const [monPhotoUrl, setMonPhotoUrl] = useState<string | undefined>(undefined);
  const classement = construireClassement(villeActif);

  useEffect(() => {
    const profil = lireProfil();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonBadgeActif(estActif(profil.matchsJoues));
    setMonPhotoUrl(profil.photoUrl);
  }, []);

  const top = classement.slice(0, NB_AFFICHES);
  const moi = classement.find((e) => e.moi);
  const moiDansTop = top.some((e) => e.moi);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium">Classement</div>
        <div className="text-xs text-right" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          <div>{SAISON}</div>
          <div>{SAISON_FIN_LABEL}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={villeActif}
            onChange={(e) => setVilleActif(e.target.value)}
            className="w-full h-11 pl-3.5 pr-9 text-sm appearance-none cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-md)",
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              color: "var(--ds-text)",
              fontFamily: "var(--ds-font-body)",
            }}
          >
            {VILLES_CLASSEMENT.map((ville) => (
              <option key={ville} value={ville}>
                {ville}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--ds-muted)" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={villeActif}
          className="flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
        {top.map((entree) => (
          <LigneClassement key={entree.position} entree={entree} monBadgeActif={monBadgeActif} monPhotoUrl={monPhotoUrl} />
        ))}
        {!moiDansTop && moi && (
          <>
            <div className="text-center text-xs py-1" style={{ color: "var(--ds-muted)" }}>
              ···
            </div>
            <LigneClassement entree={moi} monBadgeActif={monBadgeActif} monPhotoUrl={monPhotoUrl} />
          </>
        )}
        {classement.length === 0 && (
          <p className="text-sm py-2" style={{ color: "var(--ds-text-muted)" }}>
            Pas encore de classement pour cette ville.
          </p>
        )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
