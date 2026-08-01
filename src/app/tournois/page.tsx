"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, Search, X } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { CarteTournoi, elementVariants } from "@/components/ds/CarteTournoi";
import { JEUX, tousLesTournois } from "@/lib/mockTournaments";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

const conteneurVariants = {
  cache: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export default function TournoisPage() {
  const connecte = useExigerConnexion();
  const [jeuActif, setJeuActif] = useState<string | null>(null);
  const [requete, setRequete] = useState("");

  const tournois = tousLesTournois().filter(
    (t) =>
      (!jeuActif || t.jeuId === jeuActif) &&
      (!requete ||
        t.titre.toLowerCase().includes(requete.toLowerCase()) ||
        (t.code ?? "").toLowerCase() === requete.trim().toLowerCase()),
  );

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

          <div className="relative w-[150px] shrink-0">
            <select
              value={jeuActif ?? ""}
              onChange={(e) => setJeuActif(e.target.value || null)}
              className="w-full h-11 pl-3.5 pr-9 text-sm appearance-none cursor-pointer"
              style={{
                borderRadius: "var(--ds-radius-md)",
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                color: "var(--ds-text)",
                fontFamily: "var(--ds-font-body)",
              }}
            >
              <option value="">Tous les jeux</option>
              {JEUX.map((jeu) => (
                <option key={jeu.id} value={jeu.id}>
                  {jeu.label}
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
        </motion.div>
      </div>

      <div className="px-[22px] pt-4 flex-1 flex flex-col gap-3 pb-24">
        {tournois.map((t) => (
          <CarteTournoi key={t.id} tournoi={t} />
        ))}

        {tournois.length === 0 && (
          <motion.p variants={elementVariants} className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun tournoi ne correspond à ta recherche.
          </motion.p>
        )}
      </div>

      <TabBar />
    </motion.div>
  );
}
