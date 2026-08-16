"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Send, Users, Lock as LockIcon } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId, inscriptionsFermees, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, libelleRound, type MatchTournoi } from "@/lib/mockBracket";
import { participantsBR } from "@/lib/mockBattleRoyale";
import { infosRoomDuTournoi, definirInfosRoom } from "@/lib/mockRoomInfo";
import { notifierParticipants } from "@/lib/mockNotifications";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";

/** Interface d'envoi des infos de room (point 121), accessible une fois les
 * inscriptions closes : lien + mot de passe modifiables, bracket ou liste de
 * participants selon le type de tournoi, envoi ciblé par duel (1v1/équipes)
 * ou à l'ensemble des inscrits. Mock mono-appareil : la notification "ciblée"
 * ne peut pas restreindre la réception à d'autres comptes, mais le geste et
 * le message envoyé sont bien distincts de l'envoi collectif. */
export default function RoomTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [lien, setLien] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [envoiConfirme, setEnvoiConfirme] = useState<string | null>(null);

  useEffect(() => {
    const t = tournoiParId(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournoi(t);
    setAutorise(t?.organisateur === nomOrganisateurActuel());
    const infos = infosRoomDuTournoi(params.id);
    setLien(infos.lien);
    setMotDePasse(infos.motDePasse);
    setPret(true);
  }, [params.id]);

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Tournoi introuvable.
      </div>
    );
  }

  if (!autorise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette page est réservée aux organisateurs.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  const cloture = inscriptionsFermees(tournoi);

  if (!cloture) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <LockIcon size={22} style={{ color: "var(--ds-muted)" }} />
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          Les infos de room ne peuvent être envoyées qu&apos;une fois les inscriptions closes.
        </p>
        <Link href={`/organisateur/${params.id}/gestion`} style={{ color: "var(--ds-accent-300)" }}>Retour à la gestion</Link>
      </div>
    );
  }

  function sauvegarder() {
    definirInfosRoom(params.id, { lien: lien.trim(), motDePasse: motDePasse.trim() });
  }

  function messageRoom(): string | null {
    if (!lien.trim()) return null;
    return motDePasse.trim()
      ? `Room disponible : ${lien.trim()} · mot de passe : ${motDePasse.trim()}`
      : `Room disponible : ${lien.trim()}`;
  }

  function envoyerATous() {
    const message = messageRoom();
    if (!message) return;
    sauvegarder();
    notifierParticipants(params.id, tournoi!.titre, message);
    setEnvoiConfirme("tous");
    setTimeout(() => setEnvoiConfirme(null), 2500);
  }

  function envoyerDuel(m: MatchTournoi) {
    const message = messageRoom();
    if (!message || !m.joueur1 || !m.joueur2) return;
    sauvegarder();
    notifierParticipants(params.id, tournoi!.titre, `${message} · pour ton match ${m.joueur1} vs ${m.joueur2}`);
    setEnvoiConfirme(m.id);
    setTimeout(() => setEnvoiConfirme(null), 2500);
  }

  const estBracket = tournoi.type !== "battle_royale";
  const matchsListe = estBracket ? matchsDuTournoi(params.id) : [];
  const totalRounds = matchsListe.length > 0 ? Math.max(...matchsListe.map((m) => m.round)) : 0;
  const participants = !estBracket ? participantsBR(params.id) : [];
  const messagePret = Boolean(lien.trim());

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Infos de room" onRetour={() => router.back()} />

      <div className="flex flex-col gap-3">
        <Field label="Lien ou code de la room" value={lien} onChange={(e) => setLien(e.target.value)} placeholder="Ex: room.tourney.gg/AB12" />
        <Field label="Mot de passe de la room (facultatif)" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Ex: 4821" />
      </div>

      <button
        type="button"
        onClick={envoyerATous}
        disabled={!messagePret}
        className={`h-[46px] flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-40 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
      >
        <Users size={16} strokeWidth={2} />
        {envoiConfirme === "tous" ? "Envoyé ✓" : "Envoyer à tous les participants"}
      </button>

      {estBracket ? (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Envoyer à un duel précis
          </div>
          {matchsListe.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucun match généré pour l&apos;instant.</p>
          ) : (
            matchsListe
              .sort((a, b) => a.round - b.round || a.position - b.position)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3"
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {libelleRound(m.round, totalRounds)}
                    </div>
                    <div className="text-sm truncate">{m.joueur1 ?? "À définir"} vs {m.joueur2 ?? "À définir"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => envoyerDuel(m)}
                    disabled={!messagePret || !m.joueur1 || !m.joueur2}
                    className={`flex items-center justify-center gap-1.5 px-3 h-9 text-xs font-medium shrink-0 disabled:opacity-40 ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                  >
                    <Send size={12} strokeWidth={2} />
                    {envoiConfirme === m.id ? "Envoyé ✓" : "Envoyer"}
                  </button>
                </div>
              ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Participants ({participants.length})
          </div>
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            En Battle Royale, les infos de room ne se envoient qu&apos;à l&apos;ensemble des participants (tout le monde joue la même partie).
          </p>
          <div className="flex flex-col gap-1.5">
            {participants.map((p) => (
              <div key={p.id} className="text-sm px-3 py-2" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface)" }}>
                {p.nom}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
