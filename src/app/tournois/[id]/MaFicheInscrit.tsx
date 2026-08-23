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
  UserCheck,
  Flag,
  CheckCircle2,
  XCircle,
  HandMetal,
  ChevronRight,
  TreePine,
  Gavel,
  Swords,
} from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Avatar } from "@/components/ds/Avatar";
import { formatXof } from "@/lib/formatXof";
import { type Tournoi } from "@/lib/mockTournaments";
import { formatCompteARebours } from "@/lib/tournoiFormat";
import { matchsDuTournoi, codeRound, libelleRound, type MatchTournoi } from "@/lib/mockBracket";
import { inscriptionDe } from "@/lib/mockInscriptions";
import { lireProfil, attendreProfil, tagDeJoueur } from "@/lib/mockProfil";
import { presentsDuTournoi, confirmerMaPresence } from "@/lib/mockCheckin";
import { infosRoomDuTournoi, type InfosRoom } from "@/lib/mockRoomInfo";
import { notifsActivees, basculerNotifsTournoi } from "@/lib/mockNotifications";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const RAFRAICHISSEMENT_MS = 60_000;

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
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
          <button type="button" onClick={() => copier(room.lien)} aria-label="Copier le lien">
            <Copy size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
          </button>
        </div>
        {room.motDePasse.trim() && (
          <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
            <div className="w-14 shrink-0 text-[9px] tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>MDP</div>
            <div className="flex-1 min-w-0 text-[12px] truncate" style={{ fontFamily: "var(--ds-font-mono)" }}>{room.motDePasse}</div>
            <button type="button" onClick={() => copier(room.motDePasse)} aria-label="Copier le mot de passe">
              <Copy size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
            </button>
          </div>
        )}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: "var(--ds-muted)" }}>Reste affiché ici jusqu&apos;à la fin du tournoi.</div>
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
      setMonNom(inscription?.equipe ?? inscription?.tag ?? profil.pseudo);
      setMaPhoto(!inscription?.equipe ? profil.photoUrl : undefined);
      setNotifs(await notifsActivees(tournoi.id));
      const liste = await matchsDuTournoi(tournoi.id);
      if (!annule) setMatchs(liste);
      setPret(true);
    }
    charger();
    const id = setInterval(async () => {
      const liste = await matchsDuTournoi(tournoi.id);
      if (!annule) setMatchs(liste);
    }, RAFRAICHISSEMENT_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };
  }, [tournoi.id]);

  useRealtimeRefetch(
    [{ table: "matches", filter: `tournoi_id=eq.${tournoi.id}`, event: "*" }],
    () => { matchsDuTournoi(tournoi.id).then(setMatchs); },
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
    return () => {
      annule = true;
    };
     
  }, [tournoi.id, etat]);

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
                  <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>EN DIRECT</span>
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
          {matchEnCours ? (
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
          {room?.lien.trim() && (
            <div className="px-5 flex items-center gap-2 pb-2">
              <DoorOpen size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
              <div className="flex-1 min-w-0 text-[10px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                ROOM {room.lien}{room.motDePasse.trim() ? ` · MDP ${room.motDePasse}` : ""}
              </div>
              <button type="button" onClick={() => copier(`${room.lien}${room.motDePasse.trim() ? ` (${room.motDePasse})` : ""}`)} aria-label="Copier">
                <Copy size={13} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
