"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Share2,
  GitBranch,
  Users,
  MessagesSquare,
  DoorOpen,
  Copy,
  Check,
  UserCheck,
  Flag,
  CheckCircle2,
  XCircle,
  HandMetal,
  ChevronRight,
  TreePine,
  Gavel,
  Swords,
  BadgeCheck,
  Radio,
  TrendingUp,
  Target,
} from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Avatar } from "@/components/ds/Avatar";
import { formatXof } from "@/lib/formatXof";
import { type Tournoi } from "@/lib/mockTournaments";
import { formatCompteARebours } from "@/lib/tournoiFormat";
import { matchsDuTournoi, codeRound, libelleRound, type MatchTournoi } from "@/lib/mockBracket";
import {
  classementCumuleBR,
  manchesBR,
  mancheEnCoursBR,
  pointsManche,
  LABEL_UNITE_BR,
  type LigneClassementBR,
  type MancheBR,
  type ResultatManche,
} from "@/lib/mockBattleRoyale";
import { inscriptionDe } from "@/lib/mockInscriptions";
import { lireProfil, attendreProfil, tagDeJoueur } from "@/lib/mockProfil";
import { presentsDuTournoi, confirmerMaPresence } from "@/lib/mockCheckin";
import { infosRoomDuTournoi, type InfosRoom } from "@/lib/mockRoomInfo";
import { notifsActivees, basculerNotifsTournoi } from "@/lib/mockNotifications";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const RAFRAICHISSEMENT_MS = 60_000;
// Check-in : pas de temps réel (la table inscriptions porte aussi le montant
// payé par chaque inscrit, qu'on ne veut pas diffuser à tous via Postgres
// Realtime) — un polling plus rapproché suffit pour un check-in "à peu près
// en direct" pour tout le monde.
const RAFRAICHISSEMENT_PRESENCE_MS = 30_000;

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

function ordinal(rang: number): string {
  return rang === 1 ? "1er" : `${rang}e`;
}

async function partager() {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ url, title: document.title });
      return;
    } catch {
      // annulé ou indisponible : on retombe sur la copie
    }
  }
  await navigator.clipboard.writeText(url).catch(() => undefined);
}

function copier(texte: string) {
  navigator.clipboard.writeText(texte).catch(() => undefined);
}

function Entete({ badge, droite }: { badge?: React.ReactNode; droite?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="relative flex items-center justify-between">
      <button
        type="button"
        onClick={() => router.back()}
        className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      >
        <ArrowLeft size={15} strokeWidth={2} />
      </button>
      {badge}
      <div className="flex items-center gap-1.5 shrink-0">{droite}</div>
    </div>
  );
}

function BoutonIcone({ onClick, actif, label, enfant }: { onClick: () => void; actif?: boolean; label: string; enfant: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
      style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`, color: actif ? "var(--ds-accent-300)" : "var(--ds-text)" }}
    >
      {enfant}
    </button>
  );
}

function BarreAcces({ tournoiId }: { tournoiId: string }) {
  return (
    <div className="px-5 py-3 grid grid-cols-3 gap-1.5">
      <Link
        href={`/tournois/${tournoiId}/bracket`}
        className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
      >
        <GitBranch size={15} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} />
        <span className="text-[10px] font-medium" style={{ color: "var(--ds-neutral-500)" }}>Bracket</span>
      </Link>
      <Link
        href={`/tournois/${tournoiId}/chat`}
        className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent-700)" }}
      >
        <MessagesSquare size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        <span className="text-[10px] font-medium" style={{ color: "var(--ds-accent-300)" }}>Chat</span>
      </Link>
      <Link
        href={`/tournois/${tournoiId}/chat-spectateurs`}
        className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
      >
        <MessagesSquare size={15} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} />
        <span className="text-[10px] font-medium" style={{ color: "var(--ds-neutral-500)" }}>Tribune</span>
      </Link>
    </div>
  );
}

function RoomInfoBloc({ room }: { room: InfosRoom }) {
  const [champCopie, setChampCopie] = useState<"lien" | "motDePasse" | null>(null);

  function copierEtConfirmer(texte: string, champ: "lien" | "motDePasse") {
    copier(texte);
    setChampCopie(champ);
    setTimeout(() => setChampCopie((c) => (c === champ ? null : c)), 1800);
  }

  if (!room.lien.trim()) return null;
  return (
    <div className="p-[14px] flex flex-col gap-2.5" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
      <div className="flex items-center gap-2">
        <DoorOpen size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
        <div className="flex-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Infos de room</div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
          <div className="w-14 shrink-0 text-[9px] tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>LIEN</div>
          <div className="flex-1 min-w-0 text-[12px] truncate" style={{ fontFamily: "var(--ds-font-mono)" }}>{room.lien}</div>
          <button type="button" onClick={() => copierEtConfirmer(room.lien, "lien")} aria-label="Copier le lien">
            {champCopie === "lien" ? (
              <Check size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
            ) : (
              <Copy size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
            )}
          </button>
        </div>
        {room.motDePasse.trim() && (
          <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
            <div className="w-14 shrink-0 text-[9px] tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>MDP</div>
            <div className="flex-1 min-w-0 text-[12px] truncate" style={{ fontFamily: "var(--ds-font-mono)" }}>{room.motDePasse}</div>
            <button type="button" onClick={() => copierEtConfirmer(room.motDePasse, "motDePasse")} aria-label="Copier le mot de passe">
              {champCopie === "motDePasse" ? (
                <Check size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
              ) : (
                <Copy size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
              )}
            </button>
          </div>
        )}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: "var(--ds-muted)" }}>
        {champCopie ? "Copié dans le presse-papier." : "Reste affiché ici jusqu'à la fin du tournoi."}
      </div>
    </div>
  );
}

type LigneEntrant = { nom: string; estMoi: boolean; present?: boolean };

function ListeEntrants({ titre, total, lignes, showTotVoir, tournoiId, photoDeMoi }: {
  titre: string;
  total: string;
  lignes: LigneEntrant[];
  showTotVoir?: boolean;
  tournoiId: string;
  photoDeMoi?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="text-[10px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{titre} · {total}</div>
        <div className="flex-1" />
        {showTotVoir && (
          <Link href={`/tournois/${tournoiId}/inscrits`} className="flex items-center gap-0.5 text-sm font-medium shrink-0" style={{ color: "var(--ds-accent-300)" }}>
            Tout voir
            <ChevronRight size={13} strokeWidth={2} />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {lignes.map((l) => (
          <div
            key={l.nom}
            className="flex items-center gap-2.5 px-2.5 py-2"
            style={{ borderRadius: "var(--ds-radius-md)", background: l.estMoi ? "var(--ds-surface)" : "transparent", boxShadow: l.estMoi ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)" }}
          >
            <Avatar initiales={initiales(l.nom)} photoUrl={l.estMoi ? photoDeMoi : undefined} taille={30} />
            <div className="flex-1 min-w-0 text-[13px] font-medium truncate">{l.nom}</div>
            {l.estMoi ? (
              <span className="px-2.5 py-0.5 text-[9px] whitespace-nowrap" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>TOI</span>
            ) : l.present !== undefined ? (
              l.present ? (
                <CheckCircle2 size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
              ) : (
                <span className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>EN ATTENTE</span>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fiche tournoi pour un inscrit — remplace la fiche standard tant qu'il est
 * inscrit à ce tournoi précis (ni organisateur, ni simple spectateur).
 * Trois états réels (avant le check-in, check-in ouvert, en direct), chacun
 * avec une seule action possible à la fois — même esprit que
 * FicheDirectSpectateur.tsx pour les spectateurs, adapté à quelqu'un qui a
 * des enjeux propres (son statut, son match, son adversaire). */
export function MaFicheInscrit({ tournoi }: { tournoi: Tournoi }) {
  const [monNom, setMonNom] = useState("");
  const [maPhoto, setMaPhoto] = useState<string | undefined>(undefined);
  const [matchs, setMatchs] = useState<MatchTournoi[]>([]);
  const [presents, setPresents] = useState<string[]>([]);
  const [room, setRoom] = useState<InfosRoom | undefined>(undefined);
  const [notifs, setNotifs] = useState(false);
  const [pret, setPret] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [classementBR, setClassementBR] = useState<LigneClassementBR[]>([]);
  const [manchesBRState, setManchesBRState] = useState<MancheBR[]>([]);
  const [mancheEnCoursState, setMancheEnCoursState] = useState<ResultatManche[]>([]);

  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let annule = false;
    async function charger() {
      const [inscription] = await Promise.all([inscriptionDe(tournoi.id), attendreProfil()]);
      if (annule) return;
      const profil = lireProfil();
      // Le bracket (tournoi.inscrits, matchsDuTournoi) identifie chaque
      // joueur par son pseudo (ou le nom d'équipe) — jamais par le TAG
      // saisi à l'inscription, qui est le pseudo IN-GAME communiqué à
      // l'organisateur, pas l'identité utilisée pour apparier les matchs.
      // Le prendre en compte ici empêchait de retrouver son propre match
      // dès que le TAG différait du pseudo (cas courant), affichant à tort
      // "Tu es qualifié" en boucle.
      setMonNom(inscription?.equipe ?? profil.pseudo);
      setMaPhoto(!inscription?.equipe ? profil.photoUrl : undefined);
      setNotifs(await notifsActivees(tournoi.id));
      // Battle Royale : pas de bracket, aucune ligne dans `matches` — inutile
      // d'interroger l'API (retournerait toujours [], ce qui déclencherait à
      // tort l'écran "Bracket en préparation" plus bas).
      const liste = tournoi.type === "battle_royale" ? [] : await matchsDuTournoi(tournoi.id);
      if (!annule) setMatchs(liste);
      setPret(true);
    }
    charger();
    const id =
      tournoi.type === "battle_royale"
        ? undefined
        : setInterval(async () => {
            const liste = await matchsDuTournoi(tournoi.id);
            if (!annule) setMatchs(liste);
          }, RAFRAICHISSEMENT_MS);
    return () => {
      annule = true;
      if (id) clearInterval(id);
    };
  }, [tournoi.id, tournoi.type]);

  useRealtimeRefetch(
    tournoi.type === "battle_royale" ? [] : [{ table: "matches", filter: `tournoi_id=eq.${tournoi.id}`, event: "*" }],
    () => { matchsDuTournoi(tournoi.id).then(setMatchs); },
  );

  // Battle Royale : classement cumulé par points sur plusieurs manches, à la
  // place des matchs 1v1 ci-dessus (table distincte, aucun bracket).
  useEffect(() => {
    if (tournoi.type !== "battle_royale") return;
    let annule = false;
    async function charger() {
      const [classement, manches, enCours] = await Promise.all([
        classementCumuleBR(tournoi.id, tournoi.brSousType ?? "solo"),
        manchesBR(tournoi.id),
        mancheEnCoursBR(tournoi.id),
      ]);
      if (!annule) {
        setClassementBR(classement);
        setManchesBRState(manches);
        setMancheEnCoursState(enCours);
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [tournoi.id, tournoi.type, tournoi.brSousType]);

  useRealtimeRefetch(
    tournoi.type === "battle_royale"
      ? [{ table: "manche_br_en_cours", filter: `tournoi_id=eq.${tournoi.id}` }, { table: "manches_br", filter: `tournoi_id=eq.${tournoi.id}` }]
      : [],
    () => {
      classementCumuleBR(tournoi.id, tournoi.brSousType ?? "solo").then(setClassementBR);
      manchesBR(tournoi.id).then(setManchesBRState);
      mancheEnCoursBR(tournoi.id).then(setMancheEnCoursState);
    },
  );

  const checkinOuvert = tournoi.checkinTs !== undefined && maintenant >= tournoi.checkinTs;
  const etat = tournoi.enDirect ? "en_direct" : checkinOuvert ? "checkin_ouvert" : "avant_checkin";

  useEffect(() => {
    if (etat === "avant_checkin") return;
    let annule = false;
    async function charger() {
      const [p, r] = await Promise.all([presentsDuTournoi(tournoi.id), infosRoomDuTournoi(tournoi.id)]);
      if (!annule) {
        setPresents(p);
        setRoom(r);
      }
    }
    charger();
    const id = setInterval(() => {
      presentsDuTournoi(tournoi.id).then((p) => { if (!annule) setPresents(p); });
    }, RAFRAICHISSEMENT_PRESENCE_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };

  }, [tournoi.id, etat]);

  // Infos de room : rien de sensible (lien/mot de passe) — vraie mise à jour
  // temps réel dès que l'organisateur les enregistre, contrairement au
  // check-in ci-dessus.
  useRealtimeRefetch(
    [{ table: "room_infos", filter: `tournoi_id=eq.${tournoi.id}`, event: "*" }],
    () => { infosRoomDuTournoi(tournoi.id).then(setRoom); },
  );

  if (!pret) return null;

  const jeSuisPresent = presents.includes(monNom);

  async function confirmerPresence() {
    setPresents(await confirmerMaPresence(tournoi.id));
    setConfirmation(true);
    setTimeout(() => setConfirmation(false), 2000);
  }

  const totalRounds = matchs.length > 0 ? Math.max(...matchs.map((m) => m.round)) : 0;
  const mesMatchs = matchs.filter((m) => m.joueur1 === monNom || m.joueur2 === monNom);
  const matchEnCours = mesMatchs.find((m) => m.statut === "en_cours");
  const mesMatchsTermines = mesMatchs.filter((m) => m.statut === "termine").sort((a, b) => a.round - b.round);
  const dernierTermine = mesMatchsTermines[mesMatchsTermines.length - 1];
  const jaiPerdu = (m: MatchTournoi) =>
    (m.joueur1 === monNom && (m.score1 ?? 0) < (m.score2 ?? 0)) || (m.joueur2 === monNom && (m.score2 ?? 0) < (m.score1 ?? 0));
  const estElimine = Boolean(dernierTermine && jaiPerdu(dernierTermine) && !matchEnCours);
  const prochainMatch = mesMatchs.find((m) => m.statut === "a_venir");
  // Un match "a_venir" dont les deux joueurs sont déjà connus n'attend plus
  // qu'un round adverse — il est prêt, seul le lancement par l'organisateur
  // manque (cf. demarrerMatch, point 150). Distinct du cas où un adversaire
  // reste à déterminer : c'est cette dernière situation, et seulement elle,
  // qui justifie l'écran "Tu es qualifié" ci-dessous.
  const matchPret = Boolean(prochainMatch && prochainMatch.joueur1 && prochainMatch.joueur2);
  // Le match qui déterminera mon prochain adversaire : l'autre demi
  // alimentant ma prochaine place dans l'arbre (position/2 du round
  // précédent), différente du match que je viens de gagner.
  const matchAdversaireAVenir = prochainMatch && !matchPret
    ? matchs.find(
        (m) =>
          m.round === prochainMatch.round - 1 &&
          (m.position === prochainMatch.position * 2 || m.position === prochainMatch.position * 2 + 1) &&
          m.id !== dernierTermine?.id,
      )
    : undefined;

  // Battle Royale : même esprit que "mon parcours" ci-dessus (dérivé de
  // classementCumuleBR/manchesBR plutôt que matchsDuTournoi). seuilQualifBR
  // reprend exactement la formule de classementCumuleBR (Math.ceil(N/2)),
  // pour que le libellé "LES X PREMIERS..." reste cohérent avec le badge
  // "qualifie" déjà calculé côté serveur.
  const seuilQualifBR = Math.ceil(classementBR.length / 2);
  const monIndexBR = classementBR.findIndex((l) => l.nom === monNom);
  const maLigneBR = monIndexBR >= 0 ? classementBR[monIndexBR] : undefined;
  const dernierQualifieBR = [...classementBR].reverse().find((l) => l.qualifie);
  const ecartQualifBR = dernierQualifieBR && maLigneBR ? Math.max(0, dernierQualifieBR.points - maLigneBR.points) : 0;
  const manchesPrevuesBR = tournoi.manchesPrevues ?? 1;
  const mancheEnCoursActiveBR = mancheEnCoursState.length > 0;
  const autourDeMoiBR = (() => {
    if (classementBR.length === 0) return [];
    const taille = Math.min(5, classementBR.length);
    const debutBrut = monIndexBR >= 0 ? monIndexBR - 2 : 0;
    const debut = Math.min(Math.max(0, debutBrut), Math.max(0, classementBR.length - taille));
    return classementBR.slice(debut, debut + taille);
  })();
  type LigneMancheBR = { numero: number; statut: "live" | "done" | "next"; resultat?: ResultatManche };
  const lignesManchesBR: LigneMancheBR[] = (() => {
    const lignes: LigneMancheBR[] = [];
    if (mancheEnCoursActiveBR) lignes.push({ numero: manchesBRState.length + 1, statut: "live" });
    for (const m of [...manchesBRState].sort((a, b) => b.numero - a.numero)) {
      lignes.push({ numero: m.numero, statut: "done", resultat: m.resultats.find((r) => r.participantId === monNom) });
    }
    const dernierNumero = manchesBRState.length + (mancheEnCoursActiveBR ? 1 : 0);
    for (let n = dernierNumero + 1; n <= manchesPrevuesBR; n++) lignes.push({ numero: n, statut: "next" });
    return lignes;
  })();

  const placesRestantes = Math.max(0, tournoi.placesTotal - tournoi.placesInscrites);
  const entrantsApercu: LigneEntrant[] = tournoi.inscrits.slice(0, 5).map((nom) => ({ nom, estMoi: nom === monNom }));
  const presentsApercu: LigneEntrant[] = tournoi.inscrits.slice(0, 5).map((nom) => ({ nom, estMoi: nom === monNom, present: presents.includes(nom) }));

  const droiteNotif = (
    <BoutonIcone onClick={() => basculerNotifsTournoi(tournoi.id).then(setNotifs)} actif={notifs} label={notifs ? "Désactiver les notifications" : "Activer les notifications"} enfant={<Bell size={15} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />} />
  );
  const droitePartager = <BoutonIcone onClick={partager} label="Partager" enfant={<Share2 size={14} strokeWidth={2} />} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div
        className="relative px-5 pt-[42px] pb-4"
        style={{ background: "radial-gradient(130% 140% at 50% 0%, var(--ds-accent-900) 0%, var(--ds-bg) 76%)" }}
      >
        {etat === "avant_checkin" && (
          <>
            <Entete droite={<>{droiteNotif}{droitePartager}</>} />
            <div className="mt-4">
              <div className="text-[23px] font-medium leading-tight" style={{ fontFamily: "var(--ds-font-heading)" }}>{tournoi.titre}</div>
              <div className="mt-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {tournoi.jeuLabel} · {tournoi.format} · CODE {tournoi.code}
              </div>
            </div>
          </>
        )}

        {etat === "checkin_ouvert" && (
          <>
            <Entete
              badge={
                <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent-700)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ds-accent-400)" }} />
                  <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>CHECK-IN OUVERT</span>
                </div>
              }
              droite={droiteNotif}
            />
            <div className="mt-3.5 flex items-center gap-2.5">
              <Avatar initiales={initiales(monNom)} photoUrl={maPhoto} taille={34} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate">{tournoi.titre}</div>
                <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>@{tagDeJoueur(monNom)} · {tournoi.format}</div>
              </div>
            </div>
          </>
        )}

        {etat === "en_direct" && (
          <>
            <Entete
              badge={
                <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 18px color-mix(in srgb, var(--ds-accent) 22%, transparent)" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />
                  <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                    {tournoi.type === "battle_royale" && mancheEnCoursActiveBR ? `MANCHE ${manchesBRState.length + 1} EN COURS` : "EN DIRECT"}
                  </span>
                </div>
              }
              droite={droiteNotif}
            />
            <div className="mt-3.5 flex items-center gap-2">
              <div className="text-[10px] tracking-wide uppercase truncate" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.titre}</div>
              <div className="flex-1 h-px" style={{ background: "var(--ds-accent-800)" }} />
              {matchEnCours ? (
                <div className="shrink-0 text-[10px] whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{codeRound(matchEnCours.round, totalRounds).toUpperCase()}</div>
              ) : dernierTermine ? (
                <div className="shrink-0 text-[10px] whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{codeRound(dernierTermine.round, totalRounds).toUpperCase()}</div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {etat === "avant_checkin" && (
        <>
          <div className="px-5">
            <div
              className="p-3 flex items-center gap-2.5"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
            >
              <Avatar initiales={initiales(monNom)} photoUrl={maPhoto} taille={38} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
                  <div className="text-sm font-medium truncate">Tu es inscrit</div>
                </div>
                <div className="mt-0.5 text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  @{tagDeJoueur(monNom)} · {tournoi.fraisXof > 0 ? formatXof(tournoi.fraisXof).toUpperCase() : "GRATUIT"}
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 mt-3">
            <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--ds-muted)" }} />
                <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Check-in fermé</div>
              </div>
              {tournoi.checkinTs !== undefined && (
                <div className="mt-3 text-center">
                  <div className="text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Ouverture du check-in dans</div>
                  <div className="mt-1.5 text-[38px] leading-none" style={{ fontFamily: "var(--ds-font-mono)", letterSpacing: "-0.02em", color: "var(--ds-accent-300)" }}>
                    {formatCompteARebours(tournoi.checkinTs - maintenant)}
                  </div>
                </div>
              )}
              <div className="mt-3.5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <UserCheck size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
                  <div className="flex-1 text-[12px]">Ouverture du check-in</div>
                  <div className="text-[11px] whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.checkin}</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Flag size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                  <div className="flex-1 text-[12px]">Premier tour</div>
                  <div className="text-[11px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.dateLabel}</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                  <div className="flex-1 text-[12px]">Places restantes</div>
                  <div className="text-[11px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{placesRestantes} sur {tournoi.placesTotal}</div>
                </div>
              </div>
            </div>
          </div>

          <BarreAcces tournoiId={tournoi.id} />

          <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

          <div className="px-5 pt-3.5 pb-6">
            <ListeEntrants titre="Inscrits" total={`${tournoi.placesInscrites} sur ${tournoi.placesTotal}`} lignes={entrantsApercu} showTotVoir tournoiId={tournoi.id} photoDeMoi={maPhoto} />
          </div>
        </>
      )}

      {etat === "checkin_ouvert" && (
        <div className="px-5 flex flex-col gap-3">
          <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Confirme ta présence</div>
              {tournoi.debutTournoiTs !== undefined && (
                <div className="text-[10px] whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>FERME DANS {formatCompteARebours(tournoi.debutTournoiTs - maintenant)}</div>
              )}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
              Indique que tu seras là à l&apos;heure du tournoi — l&apos;organisateur s&apos;en sert pour préparer le bracket.
            </p>
            <button
              type="button"
              onClick={confirmerPresence}
              disabled={jeSuisPresent}
              className={`mt-3 w-full h-12 flex items-center justify-center gap-2 text-[15px] font-medium disabled:cursor-default ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${jeSuisPresent ? "var(--ds-border)" : "var(--ds-accent)"}`, color: jeSuisPresent ? "var(--ds-muted)" : "var(--ds-accent-300)" }}
            >
              <HandMetal size={17} strokeWidth={2} />
              {jeSuisPresent ? (confirmation ? "Présence confirmée ✓" : "Tu es présent") : "Je suis présent"}
            </button>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--ds-surface-2)" }}>
                <div className="h-[3px] rounded-full" style={{ width: `${tournoi.placesInscrites > 0 ? Math.round((presents.length / tournoi.placesInscrites) * 100) : 0}%`, background: "linear-gradient(90deg, var(--ds-accent-700), var(--ds-accent-400))" }} />
              </div>
              <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {presents.length} / {tournoi.placesInscrites} PRÉSENTS
              </div>
            </div>
          </div>
          {room && <RoomInfoBloc room={room} />}
          <ListeEntrants titre="Présents" total={`${presents.length}`} lignes={presentsApercu} tournoiId={tournoi.id} photoDeMoi={maPhoto} />
        </div>
      )}

      {etat === "en_direct" && (
        <div className="px-5 flex flex-col gap-3">
          {tournoi.type === "battle_royale" ? (
            // Pas de bracket/match individuel en Battle Royale — le bracket
            // répond à "contre qui je joue", un Battle Royale répond à "où
            // j'en suis" : le héros montre mon rang et mes points cumulés
            // (classementCumuleBR) plutôt qu'un adversaire, et "Mon parcours"
            // devient le relevé de mes manches (manchesBR) plus bas.
            <>
              <Link
                href={`/tournois/${tournoi.id}/battle-royale`}
                className={`p-4 flex flex-col ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-lg)",
                  background: maLigneBR?.qualifie ? "linear-gradient(var(--ds-accent-900), var(--ds-surface))" : "var(--ds-surface)",
                  boxShadow: maLigneBR?.qualifie ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: maLigneBR?.qualifie ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    Ma position
                  </div>
                  {maLigneBR && (
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 shrink-0"
                      style={{
                        borderRadius: "var(--ds-radius-pill)",
                        background: maLigneBR.qualifie ? "var(--ds-accent-800)" : "transparent",
                        border: maLigneBR.qualifie ? "none" : "1px solid var(--ds-border)",
                      }}
                    >
                      {maLigneBR.qualifie ? (
                        <BadgeCheck size={13} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                      ) : (
                        <Target size={13} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                      )}
                      <span className="text-[9px] tracking-wide whitespace-nowrap" style={{ color: maLigneBR.qualifie ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        {maLigneBR.qualifie ? "QUALIFIÉ" : `HORS TOP ${seuilQualifBR}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex items-end gap-3.5">
                  <div className="shrink-0">
                    <div className="flex items-baseline gap-0.5">
                      <div className="text-[38px] leading-none" style={{ fontFamily: "var(--ds-font-mono)", letterSpacing: "-0.02em" }}>
                        {monIndexBR >= 0 ? monIndexBR + 1 : "—"}
                      </div>
                      {monIndexBR >= 0 && (
                        <div className="text-sm" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-neutral-600)" }}>{monIndexBR === 0 ? "er" : "e"}</div>
                      )}
                    </div>
                    <div className="mt-1 text-[9px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
                      sur {classementBR.length} {LABEL_UNITE_BR[tournoi.brSousType ?? "solo"].pluriel.toLowerCase()}
                    </div>
                  </div>
                  <div className="w-px h-10 shrink-0" style={{ background: "var(--ds-border)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl leading-none whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{maLigneBR?.points ?? 0} pts</div>
                    <div className="mt-1 text-[9px] tracking-wide uppercase truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
                      cumulés sur {maLigneBR?.manchesJouees ?? 0} manche{(maLigneBR?.manchesJouees ?? 0) > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs" style={{ color: "var(--ds-neutral-500)" }}>Manches jouées</div>
                    <div className="text-[10px]" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{manchesBRState.length} / {manchesPrevuesBR}</div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: manchesPrevuesBR }).map((_, i) => {
                      const live = mancheEnCoursActiveBR && i === manchesBRState.length;
                      const jouee = i < manchesBRState.length;
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full ${live ? "animate-pulse" : ""}`}
                          style={{ background: live ? "var(--ds-accent-400)" : jouee ? "var(--ds-accent-700)" : "var(--ds-neutral-900)" }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 flex items-start gap-2" style={{ borderTop: "1px solid var(--ds-border)" }}>
                  {mancheEnCoursActiveBR ? (
                    <Radio size={14} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0 mt-0.5" />
                  ) : !maLigneBR?.qualifie ? (
                    <Target size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0 mt-0.5" />
                  ) : (
                    <TrendingUp size={14} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                    {mancheEnCoursActiveBR
                      ? `La manche ${manchesBRState.length + 1} est lancée. Tes points s'ajouteront dès que l'organisateur aura saisi le classement.`
                      : manchesBRState.length >= manchesPrevuesBR
                        ? "Toutes les manches sont jouées — en attente de la clôture du tournoi."
                        : !maLigneBR?.qualifie
                          ? `Il te manque ${ecartQualifBR} point${ecartQualifBR > 1 ? "s" : ""} pour entrer dans le top ${seuilQualifBR}.`
                          : "La prochaine manche démarre dès que l'organisateur relance la room."}
                  </div>
                </div>
              </Link>

              {autourDeMoiBR.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Autour de moi</div>
                    <div className="flex-1 h-px" style={{ background: "var(--ds-neutral-900)" }} />
                    <Link href={`/tournois/${tournoi.id}/battle-royale`} className="flex items-center gap-0.5 text-sm font-medium shrink-0" style={{ color: "var(--ds-accent-300)" }}>
                      Tout voir
                      <ChevronRight size={13} strokeWidth={2} />
                    </Link>
                  </div>
                  <div className="flex flex-col gap-1">
                    {autourDeMoiBR.map((l) => {
                      const rang = classementBR.indexOf(l) + 1;
                      const estMoi = l.nom === monNom;
                      const ecart = maLigneBR ? l.points - maLigneBR.points : 0;
                      return (
                        <div
                          key={l.participantId}
                          className="flex items-center gap-2.5 px-2.5 py-2"
                          style={{ borderRadius: "var(--ds-radius-md)", background: estMoi ? "var(--ds-surface)" : "transparent", boxShadow: estMoi ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)" }}
                        >
                          <div className="w-5 shrink-0 text-xs text-center" style={{ fontFamily: "var(--ds-font-mono)", color: estMoi ? "var(--ds-accent-300)" : "var(--ds-neutral-600)" }}>{rang}</div>
                          <Avatar initiales={initiales(l.nom)} photoUrl={estMoi ? maPhoto : undefined} taille={28} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="text-[13px] font-medium truncate">{l.nom}</div>
                              {l.qualifie && <BadgeCheck size={12} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />}
                            </div>
                            <div className="text-[9px]" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
                              {l.manchesJouees} manche{l.manchesJouees > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[13px]" style={{ fontFamily: "var(--ds-font-mono)", color: estMoi ? "var(--ds-accent-300)" : "var(--ds-text)" }}>{l.points} pts</div>
                            {!estMoi && (
                              <div className="text-[8px]" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-neutral-600)" }}>{ecart > 0 ? `+${ecart}` : ecart}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <BadgeCheck size={13} strokeWidth={2} style={{ color: "var(--ds-neutral-600)" }} className="shrink-0" />
                    <div className="flex-1 text-[9px] tracking-wide truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
                      {!dernierQualifieBR || maLigneBR?.qualifie
                        ? `LES ${seuilQualifBR} PREMIERS SONT QUALIFIÉS`
                        : `${seuilQualifBR}E PLACE À ${dernierQualifieBR.points} PTS · IL TE MANQUE ${ecartQualifBR} PTS`}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : matchs.length === 0 ? (
            // Le tournoi est passé "en direct" (heure de début atteinte) mais
            // l'arbre n'a pas encore été généré (généré à la demande, au
            // premier visiteur de la page bracket) — sans ce cas distinct, le
            // fallback ci-dessous affichait à tort "Tu es qualifié" à un
            // inscrit qui n'a même pas encore de premier match.
            <div className="p-4 flex flex-col items-center text-center" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-border)" }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 60, height: 68, background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", clipPath: "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)" }}
              >
                <GitBranch size={24} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              </div>
              <div className="mt-3 text-[19px] font-medium" style={{ fontFamily: "var(--ds-font-heading)" }}>Bracket en préparation</div>
              <div className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                L&apos;arbre du tournoi n&apos;est pas encore généré — reviens dans un instant.
              </div>
            </div>
          ) : matchEnCours ? (
            <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
              <div className="text-center text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                C&apos;est ton tour · {libelleRound(matchEnCours.round, totalRounds)}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                <span className="font-medium">{matchEnCours.joueur1}</span>
                <span style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{matchEnCours.score1 ?? 0} — {matchEnCours.score2 ?? 0}</span>
                <span className="font-medium">{matchEnCours.joueur2}</span>
              </div>
              <Link
                href={`/matches/${matchEnCours.id}`}
                className={`mt-3 w-full h-12 flex items-center justify-center gap-2 text-[15px] font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
              >
                <TreePine size={17} strokeWidth={2} />
                Aller à mon match
              </Link>
            </div>
          ) : estElimine ? (
            <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", border: "1px solid var(--ds-border)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 46, height: 52, background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", clipPath: "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)" }}
                >
                  <XCircle size={20} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-medium">Éliminé en {libelleRound(dernierTermine!.round, totalRounds)}</div>
                  <div className="mt-0.5 text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    DÉFAITE {dernierTermine!.joueur1 === monNom ? dernierTermine!.score1 : dernierTermine!.score2} — {dernierTermine!.joueur1 === monNom ? dernierTermine!.score2 : dernierTermine!.score1} CONTRE {dernierTermine!.joueur1 === monNom ? dernierTermine!.joueur2 : dernierTermine!.joueur1}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                Tu gardes l&apos;accès au chat des inscrits et au bracket jusqu&apos;à la clôture du tournoi.
              </p>
              <div className="mt-3 flex gap-2">
                <Link href={`/tournois/${tournoi.id}/bracket`} className={`flex-1 h-10 flex items-center justify-center text-xs font-medium ${PRESS}`} style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}>
                  Suivre la suite
                </Link>
                <Link href={`/matches/${dernierTermine!.id}/litige`} className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-medium ${PRESS}`} style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}>
                  <Gavel size={13} strokeWidth={2} />
                  Signaler un litige
                </Link>
              </div>
            </div>
          ) : matchPret && prochainMatch ? (
            <div className="p-4 flex flex-col items-center text-center" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 60, height: 68, background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent)", clipPath: "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)" }}
              >
                <Swords size={24} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
              </div>
              <div className="mt-3 text-[19px] font-medium" style={{ fontFamily: "var(--ds-font-heading)" }}>
                {mesMatchsTermines.length > 0 ? "Ton prochain match arrive" : "Ton match arrive"}
              </div>
              <div className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                {libelleRound(prochainMatch.round, totalRounds)} · en attente que l&apos;organisateur le lance.
              </div>

              <div className="mt-3.5 w-full p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", boxShadow: "var(--ds-shadow-sm)" }}>
                <div className="flex items-center justify-center gap-2.5 text-[13px]">
                  <span className="font-medium">{prochainMatch.joueur1}</span>
                  <span style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>VS</span>
                  <span className="font-medium">{prochainMatch.joueur2}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center text-center" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 60, height: 68, background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent)", clipPath: "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)" }}
              >
                <CheckCircle2 size={26} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
              </div>
              <div className="mt-3 text-[19px] font-medium" style={{ fontFamily: "var(--ds-font-heading)" }}>Tu es qualifié</div>
              <div className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                {prochainMatch
                  ? `Ta ${libelleRound(prochainMatch.round, totalRounds).toLowerCase()} démarre quand l'autre tour sera terminé.`
                  : "En attente du prochain tour."}
              </div>

              {matchAdversaireAVenir && (
                <div className="mt-3.5 w-full p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", boxShadow: "var(--ds-shadow-sm)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-left text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Ton prochain adversaire</div>
                    <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{matchAdversaireAVenir.statut === "en_cours" ? "EN COURS" : "À VENIR"}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2.5 text-[13px]">
                    <span>{matchAdversaireAVenir.joueur1 ?? "?"}</span>
                    <span style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{matchAdversaireAVenir.score1 ?? 0} — {matchAdversaireAVenir.score2 ?? 0}</span>
                    <span>{matchAdversaireAVenir.joueur2 ?? "?"}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {room && <RoomInfoBloc room={room} />}

          {tournoi.type === "battle_royale" && lignesManchesBR.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Mes manches</div>
              {lignesManchesBR.map((l) => {
                const detail =
                  l.statut === "live"
                    ? "En cours"
                    : l.statut === "next"
                      ? "À venir"
                      : l.resultat
                        ? `${ordinal(l.resultat.placement)} · ${l.resultat.eliminations} élimination${l.resultat.eliminations > 1 ? "s" : ""}`
                        : "—";
                const pts = l.statut === "done" && l.resultat ? `+${pointsManche(l.resultat)}` : "—";
                return (
                  <div key={l.numero} className="flex items-center gap-2.5 py-2" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                    <div className="w-8 shrink-0 text-[9px]" style={{ color: l.statut === "live" ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>M{l.numero}</div>
                    <div className="flex-1 min-w-0 text-[12px] truncate" style={{ color: l.statut === "next" ? "var(--ds-muted)" : "var(--ds-text)" }}>{detail}</div>
                    <div className="text-[11px]" style={{ color: l.statut === "done" ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{pts}</div>
                  </div>
                );
              })}
            </div>
          )}

          {mesMatchsTermines.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Mon parcours</div>
              {[...mesMatchsTermines].reverse().map((m) => {
                const adversaire = m.joueur1 === monNom ? m.joueur2 : m.joueur1;
                const gagne = !jaiPerdu(m);
                return (
                  <div key={m.id} className="flex items-center gap-2.5 py-2" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                    <div className="w-11 shrink-0 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{codeRound(m.round, totalRounds)}</div>
                    <div className="flex-1 min-w-0 text-[12px] truncate">{gagne ? "Victoire" : "Défaite"} contre {adversaire ?? "?"}</div>
                    <div className="text-[11px]" style={{ color: gagne ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{m.score1} — {m.score2}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {etat !== "avant_checkin" && (
        <div className="mt-auto">
          <BarreAcces tournoiId={tournoi.id} />
        </div>
      )}
    </div>
  );
}
