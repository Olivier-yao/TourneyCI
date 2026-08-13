"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Flame } from "lucide-react";
import { JEUX } from "@/lib/mockTournaments";
import { CLASSEMENTS, SAISON, SAISON_FIN_LABEL, VILLES, classementDuJeu, estActif, lireProfil, type ClassementEntree } from "@/lib/mockProfil";
import { Avatar } from "./Avatar";

const NB_AFFICHES = 5;

const JEUX_AVEC_CLASSEMENT = JEUX.filter((jeu) => CLASSEMENTS[jeu.id]);

const VILLES_CLASSEMENT = ["Toutes", ...VILLES];

function construireClassement(villeActif: string): ClassementEntree[] {
  const base = JEUX_AVEC_CLASSEMENT.flatMap((j) => classementDuJeu(j.id));
  const filtre = villeActif === "Toutes" ? base : base.filter((e) => e.ville === villeActif);
  return [...filtre].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, position: i + 1 }));
}

function LigneClassement({ entree, monBadgeActif, monPhotoUrl }: { entree: ClassementEntree; monBadgeActif: boolean; monPhotoUrl?: string }) {
  return (
    <Link
      href={`/joueur/${encodeURIComponent(entree.nom)}`}
      className="flex items-center gap-3 py-2.5"
      style={{
        borderBottom: "1px solid var(--ds-border)",
        background: entree.moi ? "var(--ds-accent-900)" : "transparent",
        borderRadius: entree.moi ? "var(--ds-radius-md)" : undefined,
        paddingLeft: entree.moi ? 10 : 0,
        paddingRight: entree.moi ? 10 : 0,
      }}
    >
      <div
        className="w-6 text-[13px]"
        style={{ color: entree.moi ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
      >
        {entree.position}
      </div>
      <Avatar initiales={entree.initiales} taille={28} photoUrl={entree.moi ? monPhotoUrl : undefined} />
      <div className="flex-1 flex items-center gap-1.5 text-sm" style={{ fontWeight: entree.moi ? 600 : 400 }}>
        {entree.nom}
        {entree.moi && monBadgeActif && <Flame size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} aria-label="Membre actif" />}
      </div>
      <div className="text-[13px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        {entree.points.toLocaleString("fr-FR")}
      </div>
    </Link>
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

      <div className="flex flex-col">
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
      </div>
    </div>
  );
}
