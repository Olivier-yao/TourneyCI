"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, ChevronRight, X, SlidersHorizontal } from "lucide-react";
import { Card, CardKicker, CardTitle } from "@/components/ds/Card";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { identifiantConnexion, consommerTransitionEntree } from "@/lib/mockAuth";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois, genreDuJeu, modeDuTournoi } from "@/lib/mockTournaments";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { mesNotifications, type NotificationApp } from "@/lib/mockNotifications";
import { CubeTransition } from "@/components/ds/CubeTransition";
import { FiltresTournois, FILTRES_VIDES, compterFiltresActifs, type FiltresValeur } from "@/components/ds/FiltresTournois";

const conteneurVariants = {
  cache: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const elementVariants = {
  cache: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AccueilV2Page() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [requete, setRequete] = useState("");
  const [notifOuvertes, setNotifOuvertes] = useState(false);
  const [notifications, setNotifications] = useState<NotificationApp[]>([]);
  const [transitionCube, setTransitionCube] = useState(false);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [filtres, setFiltres] = useState<FiltresValeur>(FILTRES_VIDES);
  const [utilisateur] = useState(() => {
    const identifiant = identifiantConnexion();
    const nom = identifiant?.includes("@") ? identifiant.split("@")[0] : "Joueur";
    return { nom, initiales: nom.slice(0, 2).toUpperCase() };
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications(mesNotifications());
    setTransitionCube(consommerTransitionEntree());
  }, []);

  if (!connecte) return null;

  function correspond(t: ReturnType<typeof tousLesTournois>[number], f: FiltresValeur) {
    if (f.jeux.length > 0 && !f.jeux.includes(t.jeuId)) return false;
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

  const tousFiltres = (f: FiltresValeur) =>
    tousLesTournois().filter(
      (t) =>
        correspond(t, f) &&
        (!requete ||
          t.titre.toLowerCase().includes(requete.toLowerCase()) ||
          (t.code ?? "").toLowerCase() === requete.trim().toLowerCase()),
    );

  const resultats = tousFiltres(filtres);
  const enDirect = resultats.filter((t) => t.enDirect);
  const prochains = resultats.filter((t) => !t.enDirect);
  const nbFiltresActifs = compterFiltresActifs(filtres);

  return (
    <>
      {transitionCube && <CubeTransition onTermine={() => setTransitionCube(false)} />}
      <motion.main
        initial="cache"
        animate="visible"
        variants={conteneurVariants}
        className="min-h-screen flex flex-col"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        <div
          className="sticky top-0 z-10 px-[20px] pt-[22px] pb-3 flex flex-col gap-3.5"
          style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}
        >
          <motion.div variants={elementVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-10 h-10 text-[14px] font-bold"
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
              >
                {utilisateur.initiales}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  Bonsoir
                </div>
                <div className="text-[15px] font-semibold capitalize">{utilisateur.nom}</div>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOuvertes((v) => !v)}
                className="relative flex items-center justify-center w-[38px] h-[38px] cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              >
                <Bell size={16} strokeWidth={2} />
                {notifications.length > 0 && (
                  <span className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full" style={{ background: "var(--ds-accent)" }} />
                )}
              </button>
              <AnimatePresence>
                {notifOuvertes && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-72 z-20 p-2"
                    style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", boxShadow: "var(--ds-shadow-lg)" }}
                  >
                    {notifications.length === 0 ? (
                      <p className="text-xs p-2" style={{ color: "var(--ds-muted)" }}>Aucune notification.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                          <div className="text-[13px]">{n.texte}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{n.temps}</div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={elementVariants} className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2.5 h-11 px-3.5"
              style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
            >
              <Search size={15} style={{ color: "var(--ds-muted)" }} />
              <input
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Chercher un tournoi"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--ds-text)" }}
              />
              {requete && (
                <button type="button" onClick={() => setRequete("")} style={{ color: "var(--ds-muted)" }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFiltresOuverts(true)}
              className="flex items-center gap-1.5 h-11 px-3.5 text-[13px] font-semibold cursor-pointer"
              style={{
                borderRadius: "var(--ds-radius-btn)",
                background: nbFiltresActifs > 0 ? "var(--ds-accent-900)" : "var(--ds-surface)",
                border: `1px solid ${nbFiltresActifs > 0 ? "var(--ds-accent)" : "var(--ds-border)"}`,
                color: nbFiltresActifs > 0 ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              <SlidersHorizontal size={14} strokeWidth={2} />
              Filtres
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

          <motion.div
            variants={elementVariants}
            className="flex p-[3px] gap-[3px]"
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
          >
            <div
              className="flex-1 h-8 flex items-center justify-center text-[13px] font-semibold"
              style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
            >
              Compétiteur
            </div>
            <button
              type="button"
              onClick={() => router.push("/en-direct")}
              className="flex-1 h-8 text-[13px] font-semibold cursor-pointer"
              style={{ borderRadius: "var(--ds-radius-sm)", color: "var(--ds-muted)" }}
            >
              En direct
            </button>
          </motion.div>
        </div>

        <div className="flex-1 px-[20px] pt-4 flex flex-col gap-3 pb-4">
          {enDirect.length > 0 && (
            <>
              <motion.div variants={elementVariants} className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                En direct maintenant · {enDirect.length}
              </motion.div>
              <motion.div variants={elementVariants} className="flex gap-2.5 overflow-x-auto pb-1 -mx-[20px] px-[20px]">
                {enDirect.map((t) => (
                  <Link key={t.id} href={`/tournois/${t.id}`} className="shrink-0" style={{ width: 258 }}>
                    <Card>
                      <div className="relative">
                        {t.banniereUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.banniereUrl} alt={t.titre} className="w-full object-cover" style={{ height: 100 }} />
                        ) : (
                          <ImagePlaceholder label="visuel tournoi" hauteur={100} />
                        )}
                        <div className="absolute top-2.5 left-2.5">
                          <LiveBadge />
                        </div>
                      </div>
                      <div className="p-3.5 flex flex-col gap-1.5">
                        <CardTitle>{t.titre}</CardTitle>
                        <CardKicker>{t.jeuLabel} · {t.format}</CardKicker>
                        <div className="flex items-end justify-between mt-1">
                          <div>
                            <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>Cash prize</div>
                            <div className="text-[15px] font-semibold" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                              {formatXof(t.cashPrizeXof)}
                            </div>
                          </div>
                          <span
                            className="h-8 px-3 flex items-center text-xs font-semibold"
                            style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", border: "var(--ds-btn-primary-border, 1px solid transparent)", color: "var(--ds-btn-primary-text)" }}
                          >
                            Suivre
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </motion.div>
            </>
          )}

          <motion.div variants={elementVariants} className="flex items-center justify-between mt-1">
            <div className="text-base font-medium">Cette semaine</div>
            <Link href="/tournois" className="text-[13px] font-semibold" style={{ color: "var(--ds-accent-300)" }}>
              Tout voir
            </Link>
          </motion.div>

          {resultats.length === 0 ? (
            <motion.div variants={elementVariants}>
              <EmptyState
                titre="Aucun tournoi"
                description="Reviens plus tard, ou ajuste ta recherche et tes filtres."
              />
            </motion.div>
          ) : prochains.length === 0 ? (
            <motion.p variants={elementVariants} className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
              Tous les résultats sont déjà en direct ci-dessus.
            </motion.p>
          ) : (
            <div className="flex flex-col gap-2 pb-4">
              {prochains.map((t) => (
                <motion.div key={t.id} variants={elementVariants}>
                  <Link href={`/tournois/${t.id}`}>
                    <div
                      className="flex items-center gap-3 p-3"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                    >
                      <div
                        className="flex items-center justify-center w-[42px] h-[42px] shrink-0"
                        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", color: "var(--ds-accent)" }}
                      >
                        ◆
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.titre}</div>
                        <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {t.dateLabel} · {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal} · {formatXof(t.fraisXof)}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <TabBar />
      </motion.main>

      <FiltresTournois
        ouvert={filtresOuverts}
        valeur={filtres}
        resultatsCount={(brouillon) => tousFiltres(brouillon).length}
        onFermer={() => setFiltresOuverts(false)}
        onAppliquer={setFiltres}
      />
    </>
  );
}
