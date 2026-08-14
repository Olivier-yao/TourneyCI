"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Crown, Flame, Medal } from "lucide-react";
import { JEUX } from "@/lib/mockTournaments";
import { CLASSEMENTS, classementDuJeu, estActif, lireProfil, palierParPoints, type ClassementEntree } from "@/lib/mockProfil";
import { PAYS, villesDuPays } from "@/lib/mockGeographie";
import { BadgePalier } from "./Palier";
import { Avatar } from "./Avatar";

const NB_AFFICHES = 8;

const JEUX_AVEC_CLASSEMENT = JEUX.filter((jeu) => CLASSEMENTS[jeu.id]);

const PAYS_TOUS = "tous";
const VILLE_TOUTES = "toutes";

/** Un même joueur peut apparaître dans le classement de plusieurs jeux : on
 * fusionne par nom (somme des points) avant de trier et filtrer, sinon il
 * apparaît en double dans le classement global/par ville — le tri final se
 * fait toujours après cette fusion pour garantir un ordre strictement
 * décroissant sans doublon de rang. */
function construireClassement(paysActif: string, villeActif: string): ClassementEntree[] {
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
  let fusionne = Array.from(parNom.values());
  if (villeActif !== VILLE_TOUTES) {
    fusionne = fusionne.filter((e) => e.ville === villeActif);
  } else if (paysActif !== PAYS_TOUS) {
    const villes = villesDuPays(paysActif);
    fusionne = fusionne.filter((e) => villes.includes(e.ville));
  }
  return [...fusionne].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, position: i + 1 }));
}

const HAUTEURS_MARCHE = [48, 64, 40];
const TAILLES_AVATAR = [48, 58, 48];
const ORDRE_PODIUM = [1, 0, 2];

function Podium({ top3, monPhotoUrl }: { top3: ClassementEntree[]; monPhotoUrl?: string }) {
  if (top3.length === 0) return null;
  return (
    <div
      className="relative overflow-hidden px-3 pt-4"
      style={{ borderRadius: "var(--ds-radius-lg)", background: "radial-gradient(120% 140% at 50% 0%, var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
    >
      <div className="grid grid-cols-3 items-end gap-2">
        {ORDRE_PODIUM.map((i, colonne) => {
          const entree = top3[i];
          if (!entree) return <div key={`vide-${i}`} />;
          const or = entree.position === 1;
          return (
            <Link key={`podium-${entree.position}`} href={`/joueur/${encodeURIComponent(entree.nom)}`} className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar initiales={entree.initiales} taille={TAILLES_AVATAR[colonne]} photoUrl={entree.moi ? monPhotoUrl : undefined} />
                <div
                  className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                  style={{
                    bottom: -7,
                    width: 20,
                    height: 20,
                    borderRadius: "var(--ds-radius-pill)",
                    background: or ? "var(--ds-btn-primary-bg)" : "var(--ds-surface-2)",
                    border: `1px solid ${or ? "var(--ds-btn-primary-bg)" : "var(--ds-border)"}`,
                    color: or ? "var(--ds-btn-primary-text)" : "var(--ds-muted)",
                    boxShadow: or ? "0 0 10px color-mix(in srgb, var(--ds-accent) 55%, transparent)" : undefined,
                  }}
                >
                  {or ? <Crown size={10} strokeWidth={2} /> : <Medal size={10} strokeWidth={2} />}
                </div>
              </div>
              <div className="text-center min-w-0 w-full mt-1">
                <div className="text-xs font-medium truncate">{entree.nom}</div>
                <div className="text-[11px]" style={{ color: or ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {entree.points.toLocaleString("fr-FR")}
                </div>
              </div>
              <div
                className="w-full flex items-start justify-center pt-1.5"
                style={{
                  height: HAUTEURS_MARCHE[colonne],
                  borderRadius: "var(--ds-radius-sm) var(--ds-radius-sm) 0 0",
                  background: or ? "var(--ds-accent-900)" : "transparent",
                  border: `1px solid ${or ? "var(--ds-accent-700)" : "var(--ds-border)"}`,
                  borderBottom: 0,
                }}
              >
                <span className="text-sm" style={{ color: or ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {entree.position}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function LigneClassement({ entree, monBadgeActif, monPhotoUrl }: { entree: ClassementEntree; monBadgeActif: boolean; monPhotoUrl?: string }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
      <Link
        href={`/joueur/${encodeURIComponent(entree.nom)}`}
        className="flex items-center gap-3 py-2.5 px-2.5 -mx-2.5"
        style={{
          borderRadius: "var(--ds-radius-md)",
          background: entree.moi ? "var(--ds-accent-900)" : "transparent",
          boxShadow: entree.moi ? "0 0 0 1px var(--ds-accent)" : "0 1px 0 var(--ds-border)",
        }}
      >
        <div
          className="w-5 text-[12px]"
          style={{ color: entree.moi ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          {entree.position}
        </div>
        <Avatar initiales={entree.initiales} taille={28} photoUrl={entree.moi ? monPhotoUrl : undefined} />
        <div className="flex-1 flex items-center gap-1.5 text-sm min-w-0" style={{ fontWeight: entree.moi ? 600 : 400 }}>
          <span className="truncate">{entree.nom}</span>
          <BadgePalier palier={palierParPoints(entree.points)} taille="sm" masquerCouronne={entree.position > 3} />
          {entree.moi && monBadgeActif && <Flame size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} aria-label="Membre actif" />}
        </div>
        <div className="text-[13px]" style={{ color: entree.moi ? "var(--ds-accent-300)" : "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}>
          {entree.points.toLocaleString("fr-FR")}
        </div>
      </Link>
    </motion.div>
  );
}

export function Classement() {
  const [paysActif, setPaysActif] = useState<string>(PAYS_TOUS);
  const [villeActif, setVilleActif] = useState<string>(VILLE_TOUTES);
  const [monBadgeActif, setMonBadgeActif] = useState(false);
  const [monPhotoUrl, setMonPhotoUrl] = useState<string | undefined>(undefined);
  const classement = construireClassement(paysActif, villeActif);
  const villesDisponibles = paysActif === PAYS_TOUS ? PAYS.flatMap((p) => p.villes) : villesDuPays(paysActif);

  useEffect(() => {
    const profil = lireProfil();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonBadgeActif(estActif(profil.matchsJoues));
    setMonPhotoUrl(profil.photoUrl);
  }, []);

  const top3 = classement.slice(0, 3);
  const reste = classement.slice(3, NB_AFFICHES);
  const moi = classement.find((e) => e.moi);
  const moiVisible = classement.slice(0, NB_AFFICHES).some((e) => e.moi);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={paysActif}
            onChange={(e) => {
              setPaysActif(e.target.value);
              setVilleActif(VILLE_TOUTES);
            }}
            className="w-full h-11 pl-3.5 pr-9 text-sm appearance-none cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-md)",
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              color: "var(--ds-text)",
              fontFamily: "var(--ds-font-body)",
            }}
          >
            <option value={PAYS_TOUS}>Tous les pays</option>
            {PAYS.map((pays) => (
              <option key={pays.id} value={pays.id}>
                {pays.nom}
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
            <option value={VILLE_TOUTES}>Toutes les villes</option>
            {villesDisponibles.map((ville) => (
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
          key={`${paysActif}-${villeActif}`}
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          <Podium top3={top3} monPhotoUrl={monPhotoUrl} />

          <div className="flex flex-col">
            {reste.map((entree) => (
              <LigneClassement key={entree.position} entree={entree} monBadgeActif={monBadgeActif} monPhotoUrl={monPhotoUrl} />
            ))}
            {!moiVisible && moi && (
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
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
