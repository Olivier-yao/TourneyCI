"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, ChevronRight, Trophy as TrophyIcon, Plus, X } from "lucide-react";
import { Tag } from "@/components/ds/Tag";
import { Button } from "@/components/ds/Button";
import { Card, CardKicker, CardTitle, CardMeta } from "@/components/ds/Card";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { AvatarPile } from "@/components/ds/Avatar";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { identifiantConnexion, rolePrefere, definirRole, type Role } from "@/lib/mockAuth";
import { formatXof } from "@/lib/formatXof";
import { JEUX, tousLesTournois, mesTournoisOrganises } from "@/lib/mockTournaments";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { mesNotifications, type NotificationApp } from "@/lib/mockNotifications";

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
  const [role, setRole] = useState<Role>(rolePrefere);
  const [jeuActif, setJeuActif] = useState<string | null>(null);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [requete, setRequete] = useState("");
  const [notifOuvertes, setNotifOuvertes] = useState(false);
  const [notifications, setNotifications] = useState<NotificationApp[]>([]);
  const [utilisateur] = useState(() => {
    const identifiant = identifiantConnexion();
    const nom = identifiant?.includes("@") ? identifiant.split("@")[0] : "Joueur";
    return { nom, initiales: nom.slice(0, 2).toUpperCase() };
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications(mesNotifications());
  }, []);

  function changerRole(r: Role) {
    setRole(r);
    definirRole(r);
  }

  if (!connecte) return null;

  const tournois = tousLesTournois();
  const vedette = tournois.find((t) => t.enDirect) ?? tournois[0];
  const prochains = tournois.filter(
    (t) =>
      t.id !== vedette.id &&
      (!jeuActif || t.jeuId === jeuActif) &&
      (!requete ||
        t.titre.toLowerCase().includes(requete.toLowerCase()) ||
        (t.code ?? "").toLowerCase() === requete.trim().toLowerCase()),
  );
  const tournoisOrganises = mesTournoisOrganises();

  return (
    <motion.main
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
        <motion.div variants={elementVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-9 h-9 text-[13px] font-semibold"
              style={{
                borderRadius: "var(--ds-radius-pill)",
                background: "var(--ds-accent-900)",
                border: "1px solid var(--ds-accent-600)",
                color: "var(--ds-accent-300)",
              }}
            >
              {utilisateur.initiales}
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Bonsoir
              </div>
              <div className="text-[15px] font-medium capitalize">{utilisateur.nom}</div>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button
              type="button"
              onClick={() => {
                setRechercheOuverte((v) => !v);
                setNotifOuvertes(false);
              }}
              className="flex items-center justify-center w-[34px] h-[34px] cursor-pointer"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            >
              <Search size={17} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => {
                setNotifOuvertes((v) => !v);
                setRechercheOuverte(false);
              }}
              className="relative flex items-center justify-center w-[34px] h-[34px] cursor-pointer"
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            >
              <Bell size={17} strokeWidth={2} />
              <span
                className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--ds-accent)" }}
              />
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
                  {notifications.length === 0 && (
                    <div className="p-2.5 text-[13px]" style={{ color: "var(--ds-text-muted)" }}>
                      Aucune notification pour l&apos;instant.
                    </div>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                      <div className="text-[13px]">{n.texte}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        {n.temps}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {rechercheOuverte && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
            >
              <Search size={16} className="ml-3 shrink-0" style={{ color: "var(--ds-muted)" }} />
              <input
                autoFocus
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Chercher un tournoi..."
                className="flex-1 h-10 bg-transparent outline-none text-sm"
                style={{ color: "var(--ds-text)" }}
              />
              {requete && (
                <button type="button" onClick={() => setRequete("")} className="pr-3 cursor-pointer" style={{ color: "var(--ds-muted)" }}>
                  <X size={15} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={elementVariants}
          className="flex p-[3px] gap-[3px]"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
        >
          {(["joueur", "organisateur"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => changerRole(r)}
              className="flex-1 h-8 text-[13px] font-medium cursor-pointer transition-colors"
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: role === r ? "var(--ds-accent-900)" : "transparent",
                color: role === r ? "var(--ds-accent-300)" : "var(--ds-muted)",
                fontFamily: "var(--ds-font-body)",
              }}
            >
              {r === "joueur" ? "Joueur" : "Organisateur"}
            </button>
          ))}
        </motion.div>
      </div>

      {role === "joueur" && (
        <motion.div
          variants={elementVariants}
          className="px-[22px] pt-3 flex gap-2 overflow-x-auto pb-1"
        >
          <Tag actif={jeuActif === null} onClick={() => setJeuActif(null)}>
            Tous
          </Tag>
          {JEUX.map((jeu) => (
            <Tag key={jeu.id} actif={jeuActif === jeu.id} onClick={() => setJeuActif(jeu.id)}>
              {jeu.label}
            </Tag>
          ))}
        </motion.div>
      )}

      <div className="flex-1 px-[22px] pt-4 pb-24 flex flex-col gap-3">
        {role === "organisateur" ? (
          <motion.div variants={elementVariants} className="flex flex-col gap-3">
            <Link href="/organisateur/nouveau">
              <Button variante="primary" bloc>
                <Plus size={17} strokeWidth={2} />
                Créer un tournoi
              </Button>
            </Link>

            {tournoisOrganises.length === 0 ? (
              <EmptyState
                titre="Aucun tournoi organisé"
                description="Crée ton premier tournoi pour le voir apparaître ici."
              />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-base font-medium">Mes tournois</div>
                {tournoisOrganises.map((t) => (
                  <Link key={t.id} href={`/tournois/${t.id}`}>
                    <div
                      className="flex items-center gap-3 p-3"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.titre}</div>
                        <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div variants={elementVariants}>
              <Card>
                <ImagePlaceholder label="visuel tournoi" hauteur={118} />
                <div className="p-[17px] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <CardKicker>Vedette · {vedette.dateLabel}</CardKicker>
                    {vedette.enDirect && <LiveBadge />}
                  </div>
                  <CardTitle>{vedette.titre}</CardTitle>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <CardMeta>Cash prize</CardMeta>
                      <div className="text-lg font-semibold" style={{ color: "var(--ds-accent-300)" }}>
                        {formatXof(vedette.cashPrizeXof)}
                      </div>
                    </div>
                    <Link href={`/tournois/${vedette.id}`}>
                      <Button variante="primary">Rejoindre</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={elementVariants} className="flex items-center justify-between mt-2">
              <div className="text-base font-medium">Prochains tournois</div>
            </motion.div>

            {prochains.length === 0 ? (
              <motion.div variants={elementVariants}>
                <EmptyState
                  titre="Aucun tournoi"
                  description="Reviens plus tard, change de jeu ou ajuste ta recherche."
                  action={
                    <Button
                      variante="secondary"
                      onClick={() => {
                        setJeuActif(null);
                        setRequete("");
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  }
                />
              </motion.div>
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
                          <TrophyIcon size={20} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{t.titre}</div>
                          <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                            {t.placesInscrites}/{t.placesTotal} · {formatXof(t.fraisXof)}
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div variants={elementVariants} className="flex items-center gap-2 mb-2">
              <AvatarPile initiales={vedette.inscrits} />
              <CardMeta>+{vedette.placesInscrites} inscrits sur le circuit</CardMeta>
            </motion.div>
          </>
        )}
      </div>

      <TabBar />
    </motion.main>
  );
}
