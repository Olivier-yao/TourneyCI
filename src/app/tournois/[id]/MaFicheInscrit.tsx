"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, GitBranch, Users, MessagesSquare, DoorOpen, Copy, Gamepad2, TreePine, CheckCircle2, XCircle, Clock, HandMetal } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Avatar } from "@/components/ds/Avatar";
import { formatXof } from "@/lib/formatXof";
import { type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, codeRound, libelleRound, type MatchTournoi } from "@/lib/mockBracket";
import { inscriptionDe } from "@/lib/mockInscriptions";
import { lireProfil, attendreProfil } from "@/lib/mockProfil";
import { presentsDuTournoi, confirmerMaPresence } from "@/lib/mockCheckin";
import { infosRoomDuTournoi, type InfosRoom } from "@/lib/mockRoomInfo";
import { notifsActivees, basculerNotifsTournoi } from "@/lib/mockNotifications";

const RAFRAICHISSEMENT_MS = 15_000;

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

function Entete({ titre, badge, droite }: { titre?: string; badge?: React.ReactNode; droite?: React.ReactNode }) {
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
      {titre && <div className="flex-1 min-w-0" />}
      <div className="flex items-center gap-1.5 shrink-0">{droite}</div>
    </div>
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
    <div className="mx-5 p-[14px] flex flex-col gap-2.5" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
      <div className="flex items-center gap-2">
        <DoorOpen size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
        <div className="flex-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Infos de room</div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
          <div className="w-14 shrink-0 text-[9px] tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>LIEN</div>
          <div className="flex-1 min-w-0 text-[12px] truncate" style={{ fontFamily: "var(--ds-font-mono)" }}>{room.lien}</div>
          <Copy size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
        </div>
        {room.motDePasse.trim() && (
          <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
            <div className="w-14 shrink-0 text-[9px] tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>MDP</div>
            <div className="flex-1 min-w-0 text-[12px] truncate" style={{ fontFamily: "var(--ds-font-mono)" }}>{room.motDePasse}</div>
            <Copy size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
          </div>
        )}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: "var(--ds-muted)" }}>Reste affiché ici jusqu&apos;à la fin du tournoi.</div>
    </div>
  );
}

/** Fiche tournoi pour un inscrit — remplace la fiche standard tant qu'il est
 * inscrit à ce tournoi précis (ni organisateur, ni simple spectateur).
 * Trois états : avant le check-in, check-in ouvert, en direct — même esprit
 * que FicheDirectSpectateur.tsx pour les spectateurs, adapté à quelqu'un qui
 * a des enjeux propres (son statut, son match, son adversaire). */
export function MaFicheInscrit({ tournoi }: { tournoi: Tournoi }) {
  const [monNom, setMonNom] = useState("");
  const [matchs, setMatchs] = useState<MatchTournoi[]>([]);
  const [presents, setPresents] = useState<string[]>([]);
  const [room, setRoom] = useState<InfosRoom | undefined>(undefined);
  const [notifs, setNotifs] = useState(false);
  const [pret, setPret] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    let annule = false;
    async function charger() {
      const [inscription] = await Promise.all([inscriptionDe(tournoi.id), attendreProfil()]);
      if (annule) return;
      setMonNom(inscription?.equipe ?? inscription?.tag ?? lireProfil().pseudo);
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

  const maintenant = Date.now();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const droiteNotif = (
    <button
      type="button"
      onClick={() => basculerNotifsTournoi(tournoi.id).then(setNotifs)}
      aria-label={notifs ? "Désactiver les notifications" : "Activer les notifications"}
      className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
      style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`, color: notifs ? "var(--ds-accent-300)" : "var(--ds-text)" }}
    >
      <Bell size={15} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div
        className="relative px-5 pt-[42px] pb-4"
        style={{ background: "radial-gradient(130% 140% at 50% 0%, var(--ds-accent-900) 0%, var(--ds-bg) 76%)" }}
      >
        <Entete droite={droiteNotif} />

        <div className="mt-4">
          <div className="text-[23px] font-medium leading-tight" style={{ fontFamily: "var(--ds-font-heading)" }}>{tournoi.titre}</div>
          <div className="mt-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.jeuLabel} · {tournoi.format} · CODE {tournoi.code}
          </div>
        </div>

        <div
          className="mt-4 p-3 flex items-center gap-2.5"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
        >
          <Avatar initiales={initiales(monNom)} taille={38} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
              <div className="text-sm font-medium truncate">Tu es inscrit</div>
            </div>
            <div className="mt-0.5 text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {monNom.toUpperCase()} · {tournoi.fraisXof > 0 ? formatXof(tournoi.fraisXof).toUpperCase() : "GRATUIT"}
            </div>
          </div>
        </div>
      </div>

      {etat === "avant_checkin" && (
        <div className="px-5">
          <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--ds-muted)" }} />
              <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Check-in pas encore ouvert</div>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <Clock size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
                <div className="flex-1 text-[12px]">Ouverture du check-in</div>
                <div className="text-[11px]" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.checkin}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <Gamepad2 size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                <div className="flex-1 text-[12px]">Début du tournoi</div>
                <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.dateLabel}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <Users size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                <div className="flex-1 text-[12px]">Places</div>
                <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.placesInscrites} / {tournoi.placesTotal}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {etat === "checkin_ouvert" && (
        <div className="px-5 flex flex-col gap-3">
          <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Confirme ta présence</div>
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
            <div className="mt-2.5 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {presents.length} / {tournoi.placesInscrites} PRÉSENTS
            </div>
          </div>
          {room && <RoomInfoBloc room={room} />}
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
            <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
              <div className="flex items-center gap-3">
                <XCircle size={26} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">Éliminé en {libelleRound(dernierTermine!.round, totalRounds)}</div>
                  <div className="mt-0.5 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {dernierTermine!.score1} — {dernierTermine!.score2}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
                Tu gardes l&apos;accès au chat des inscrits et au bracket jusqu&apos;à la clôture du tournoi.
              </p>
            </div>
          ) : (
            <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={26} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-[15px] font-medium">Tu es qualifié</div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--ds-text-muted)" }}>
                    {prochainMatch
                      ? `Prochain tour : ${libelleRound(prochainMatch.round, totalRounds)}`
                      : "En attente du prochain tour."}
                  </div>
                </div>
              </div>
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

          {room?.lien.trim() && (
            <div className="flex items-center gap-2 pb-2">
              <DoorOpen size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
              <div className="flex-1 min-w-0 text-[10px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                ROOM {room.lien}{room.motDePasse.trim() ? ` · MDP ${room.motDePasse}` : ""}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto">
        <BarreAcces tournoiId={tournoi.id} />
      </div>
    </div>
  );
}
