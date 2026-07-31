"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AppBar } from "@/components/ds/AppBar";
import { CarteTournoi, elementVariants } from "@/components/ds/CarteTournoi";
import { mesFavoris } from "@/lib/mockFavoris";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";

const conteneurVariants = {
  cache: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export default function FavorisPage() {
  const router = useRouter();
  const [tournois, setTournois] = useState<Tournoi[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournois(mesFavoris().map(tournoiParId).filter((t): t is Tournoi => Boolean(t)));
  }, []);

  return (
    <motion.div
      initial="cache"
      animate="visible"
      variants={conteneurVariants}
      className="min-h-screen flex flex-col px-5 pt-4 pb-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <AppBar retour titre="Mes favoris" onRetour={() => router.push("/profil")} />

      <div className="pt-4 flex-1 flex flex-col gap-3">
        {tournois.map((t) => (
          <CarteTournoi key={t.id} tournoi={t} />
        ))}

        {tournois.length === 0 && (
          <motion.p variants={elementVariants} className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun tournoi en favori pour l&apos;instant. Ajoute-en depuis la page d&apos;un tournoi.
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
