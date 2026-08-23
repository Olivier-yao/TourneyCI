"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, X, SlidersHorizontal, Play, Radio, Heart, VolumeX, ArrowRight, Crosshair, Swords, Goal, Users2, Gamepad2, Eye } from "lucide-react";
import { Card, CardKicker, CardTitle } from "@/components/ds/Card";
import { Avatar } from "@/components/ds/Avatar";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { PRESS } from "@/components/ds/Button";
import { consommerTransitionEntree } from "@/lib/mockAuth";
import { lireProfil } from "@/lib/mockProfil";
import { formatXof } from "@/lib/formatXof";
import { mesFavoris, basculerFavori } from "@/lib/mockFavoris";
import { tousLesTournois, genreDuJeu, modeDuTournoi, cashPrizeAffiche, type GenreJeu, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, type MatchTournoi } from "@/lib/mockBracket";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import { mesNotifications, nombreNonLues, marquerLue, type NotificationApp } from "@/lib/mockNotifications";
import { CubeTransition } from "@/components/ds/CubeTransition";
import { FiltresTournois, FILTRES_VIDES, compterFiltresActifs, type FiltresValeur } from "@/components/ds/FiltresTournois";
import { Modal } from "@/components/ds/Modal";

/** Nombre de spectateurs simulé, déterministe (pas de vrai suivi d'audience
 * dans ce mock) — stable entre le rendu serveur et client. */
function spectateurs(tournoi: Tournoi): number {
  let h = 0;
  for (let i = 0; i < tournoi.id.length; i++) h = (h * 31 + tournoi.id.charCodeAt(i)) >>> 0;
  return 80 + (h % 400) + tournoi.placesInscrites * 6;
}

const ICONE_GENRE: Record<GenreJeu, typeof Gamepad2> = {
  FPS: Crosshair,
  TPS: Crosshair,
  Combat: Swords,
  Sport: Goal,
  "Battle Royale": Users2,
};

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
  const [notifDetail, setNotifDetail] = useState<NotificationApp | null>(null);
  const [notifications, setNotifications] = useState<NotificationApp[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [transitionCube, setTransitionCube] = useState(false);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [filtres, setFiltres] = useState<FiltresValeur>(FILTRES_VIDES);
  const [utilisateur, setUtilisateur] = useState({ nom: "Joueur", initiales: "JO", photoUrl: undefined as string | undefined, ville: "" });
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [streamOuvert, setStreamOuvert] = useState<Tournoi | null>(null);
  const [favoris, setFavoris] = useState<Set<string>>(new Set());
  const [pageDirect, setPageDirect] = useState(0);
  const [matchEnCoursStream, setMatchEnCoursStream] = useState<MatchTournoi | null>(null);

  useEffect(() => {
    if (!streamOuvert) {
      setMatchEnCoursStream(null);
      return;
    }
    async function charger() {
      const matches = await matchsDuTournoi(streamOuvert!.id);
      setMatchEnCoursStream(matches.find((m) => m.statut === "en_cours") ?? null);
    }
    charger();
  }, [streamOuvert]);

  useEffect(() => {
    // État dépendant du localStorage (tournois créés localement) : liste
    // vide au premier rendu serveur, synchronisée côté client une fois
    // montée, pour éviter un mismatch d'hydratation.
    async function charger() {
      const notifs = await mesNotifications();
      setNotifications(notifs);
      setNonLues(nombreNonLues(notifs));
      setFavoris(new Set(await mesFavoris()));
      setTransitionCube(consommerTransitionEntree());
      setTournois(await tousLesTournois());
      const profil = lireProfil();
      setUtilisateur({
        nom: profil.pseudo,
        initiales: profil.pseudo.split(" ").map((m) => m[0]).filter(Boolean).join("").slice(0, 2).toUpperCase(),
        photoUrl: profil.photoUrl,
        ville: profil.ville,
      });
    }
    charger();
  }, []);

  // Bascule en_direct/termine et disparition (fenêtre de grâce de 2 min
  // après clôture, cf. estEnDirect côté serveur) : rafraîchi séparément du
  // chargement initial ci-dessus pour ne pas relancer notifs/favoris/profil
  // à chaque changement de statut d'un tournoi.
  useEffect(() => {
    const id = setInterval(() => { tousLesTournois().then(setTournois); }, 60_000);
    return () => clearInterval(id);
  }, []);
  useRealtimeRefetch(
    [{ table: "tournois", event: "*" }],
    () => { tousLesTournois().then(setTournois); },
  );

  if (!connecte) return null;

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

  const tousFiltres = (f: FiltresValeur) =>
    tournois.filter(
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
            <div>
              <div
                className="text-[23px]"
                style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"], letterSpacing: "-.02em" }}
              >
                Salut {utilisateur.nom.split(" ")[0]}
              </div>
              <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Compétiteur{utilisateur.ville ? ` · ${utilisateur.ville.toLowerCase()}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOuvertes((v) => !v)}
                  className="relative flex items-center justify-center w-[34px] h-[34px] cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Bell size={16} strokeWidth={2} />
                  {nonLues > 0 && (
                    <span className="absolute top-[7px] right-[8px] w-1.5 h-1.5 rounded-full" style={{ background: "var(--ds-accent)" }} />
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
                        <>
                          {notifications.slice(0, 5).map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                marquerLue(n.id);
                                const misAJour = notifications.map((x) => (x.id === n.id ? { ...x, lue: true } : x));
                                setNotifications(misAJour);
                                setNonLues(nombreNonLues(misAJour));
                                setNotifOuvertes(false);
                                if (n.tournoiId) router.push(`/tournois/${n.tournoiId}`);
                                else setNotifDetail(n);
                              }}
                              className="w-full text-left p-2.5 cursor-pointer"
                              style={{ borderBottom: "1px solid var(--ds-border)" }}
                            >
                              <div className="text-[13px] line-clamp-2">{n.texte}</div>
                              <div className="text-[11px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{n.temps}</div>
                            </button>
                          ))}
                          <Link
                            href="/notifications"
                            onClick={() => setNotifOuvertes(false)}
                            className="block text-center text-xs font-medium p-2.5"
                            style={{ color: "var(--ds-accent-300)" }}
                          >
                            Voir tout →
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link href="/profil">
                <Avatar initiales={utilisateur.initiales} photoUrl={utilisateur.photoUrl} taille={34} />
              </Link>
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

        <div className="flex-1 px-[20px] pt-4 flex flex-col gap-3 pb-24">
          {enDirect.length > 0 && (
            <>
              <motion.div variants={elementVariants} className="flex items-center justify-between text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                <span>En direct maintenant</span>
                {enDirect.length > 1 && (
                  <span style={{ color: "var(--ds-accent-300)" }}>
                    {enDirect.length} tournois
                  </span>
                )}
              </motion.div>
              <motion.div
                variants={elementVariants}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const max = el.scrollWidth - el.clientWidth;
                  const ratio = max > 0 ? el.scrollLeft / max : 0;
                  setPageDirect(Math.min(2, Math.round(ratio * 2)));
                }}
                className="flex gap-3 overflow-x-auto pt-1 pb-1 -mx-[20px] px-[20px] snap-x snap-mandatory"
                style={{ scrollbarWidth: "none" }}
              >
                {enDirect.map((t) => {
                  const suivi = favoris.has(t.id);
                  return (
                    <Link key={t.id} href={`/tournois/${t.id}`} className="shrink-0 snap-center" style={{ width: "78%" }}>
                      <Card style={{ boxShadow: suivi ? "0 0 0 1px var(--ds-accent)" : undefined }}>
                        <div className="relative">
                          {t.banniereUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.banniereUrl} alt={t.titre} className="w-full object-cover" style={{ height: 116 }} />
                          ) : (
                            <ImagePlaceholder label="visuel tournoi" hauteur={116} />
                          )}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,.32) 40%, rgba(0,0,0,.08) 70%, transparent 100%)" }}
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <LiveBadge />
                          </div>
                          {t.streamActif && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setStreamOuvert(t);
                              }}
                              aria-label="Regarder le stream"
                              className="absolute bottom-2.5 right-2.5 flex items-center justify-center w-9 h-9 cursor-pointer"
                              style={{ borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.35)", color: "#fff" }}
                            >
                              <Play size={15} strokeWidth={2} fill="currentColor" />
                            </button>
                          )}
                        </div>
                        <div className="p-3.5 flex flex-col gap-1.5">
                          <CardTitle>{t.titre}</CardTitle>
                          <CardKicker>{t.jeuLabel} · {t.format}</CardKicker>
                          <div className="flex items-end justify-between mt-1">
                            <div>
                              <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>Cash prize</div>
                              <div className="text-[15px] font-semibold" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                                {formatXof(cashPrizeAffiche(t))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                basculerFavori(t.id).then((estFavori) => {
                                  setFavoris((prev) => {
                                    const suivant = new Set(prev);
                                    if (estFavori) suivant.add(t.id);
                                    else suivant.delete(t.id);
                                    return suivant;
                                  });
                                });
                              }}
                              className={`h-8 px-3 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${PRESS}`}
                              style={{
                                borderRadius: "var(--ds-radius-btn)",
                                border: `1px solid ${suivi ? "var(--ds-accent)" : "var(--ds-border)"}`,
                                color: suivi ? "var(--ds-accent-300)" : "var(--ds-muted)",
                              }}
                            >
                              <Heart size={13} strokeWidth={2} fill={suivi ? "currentColor" : "none"} />
                              {suivi ? "Suivi" : "Suivre"}
                            </button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </motion.div>
              {enDirect.length > 1 && (
                <motion.div variants={elementVariants} className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[3px] rounded-full"
                      style={{ width: i === pageDirect ? 18 : 7, background: i === pageDirect ? "var(--ds-accent)" : "var(--ds-border)" }}
                    />
                  ))}
                </motion.div>
              )}
            </>
          )}

          <motion.div variants={elementVariants} className="flex items-center justify-between mt-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <span>Bientôt · inscriptions ouvertes</span>
            <Link href="/tournois" className="text-[12px] font-semibold normal-case" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-body)" }}>
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
              {prochains.map((t) => {
                const IconeJeu = ICONE_GENRE[genreDuJeu(t.jeuId) as GenreJeu] ?? Gamepad2;
                return (
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
                          <IconeJeu size={18} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{t.titre}</div>
                          <div className="text-xs truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                            {t.jeuLabel} · {t.dateLabel} · {t.placesInscrites}/{t.placesTotal}
                          </div>
                        </div>
                        <div className="text-sm shrink-0" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                          {formatXof(cashPrizeAffiche(t))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
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

      <Modal ouvert={notifDetail !== null} titre="Notification" onFermer={() => setNotifDetail(null)}>
        {notifDetail && (
          <div className="flex flex-col gap-2" style={{ whiteSpace: "normal" }}>
            <p>{notifDetail.texte}</p>
            <p style={{ color: "var(--ds-muted)" }}>{notifDetail.temps}</p>
          </div>
        )}
      </Modal>

      {/* Aperçu du stream sans quitter l'accueil (point 131) — même
          emplacement visuel que le cadre de la fiche tournoi (backlog stream
          réel, CLAUDE.md point 110). */}
      <AnimatePresence>
        {streamOuvert && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,.6)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStreamOuvert(null)}
            />
            <motion.div
              className="relative flex flex-col gap-3.5 w-full sm:max-w-sm px-5 pt-3.5 pb-6"
              style={{ borderRadius: "var(--ds-radius-lg) var(--ds-radius-lg) 0 0", background: "color-mix(in srgb, var(--ds-surface) 92%, var(--ds-bg))", boxShadow: "var(--ds-shadow-lg)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="w-11 h-1 rounded-full mx-auto" style={{ background: "var(--ds-border)" }} />
              <div className="flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-medium truncate">{streamOuvert.titre}</div>
                  <div className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {streamOuvert.jeuLabel} · {streamOuvert.format}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStreamOuvert(null)}
                  className="flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                  aria-label="Fermer"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              <div
                className="relative w-full overflow-hidden"
                style={{ height: 178, borderRadius: "var(--ds-radius-md)", background: "radial-gradient(90% 120% at 50% 45%, var(--ds-accent-900), var(--ds-surface-2) 74%)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
              >
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage: "linear-gradient(var(--ds-accent) 1px, transparent 1px), linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-[50px] h-[50px]"
                    style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 30px color-mix(in srgb, var(--ds-accent) 26%, transparent)" }}
                  >
                    <Radio size={22} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                  </div>
                  <div className="text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    Aperçu · lecteur à venir
                  </div>
                </div>
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--ds-radius-pill)", background: "rgba(22,24,38,.82)", border: "1px solid var(--ds-accent)" }}>
                  <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: "var(--ds-accent-300)" }} />
                  <span className="text-[9px] tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>EN DIRECT</span>
                </div>
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--ds-radius-pill)", background: "rgba(22,24,38,.82)" }}>
                  <Eye size={11} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                  <span className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{spectateurs(streamOuvert)}</span>
                </div>
                {matchEnCoursStream && (
                  <div className="absolute left-2.5 right-2.5 bottom-2.5 flex items-center gap-2 px-2.5 py-2" style={{ borderRadius: "var(--ds-radius-sm)", background: "rgba(22,24,38,.82)" }}>
                    <div className="flex-1 min-w-0 text-xs truncate">
                      {matchEnCoursStream.joueur1} <span style={{ color: "var(--ds-muted)" }}>vs</span> {matchEnCoursStream.joueur2}
                    </div>
                    <div className="text-sm shrink-0" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                      {matchEnCoursStream.score1 ?? 0} — {matchEnCoursStream.score2 ?? 0}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  aria-label="Couper le son"
                  className="w-[52px] h-[46px] flex items-center justify-center shrink-0 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <VolumeX size={17} strokeWidth={2} />
                </button>
                <Link
                  href={`/tournois/${streamOuvert.id}`}
                  onClick={() => setStreamOuvert(null)}
                  className={`flex-1 h-[46px] flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                >
                  Ouvrir la fiche du tournoi
                  <ArrowRight size={15} strokeWidth={2} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
