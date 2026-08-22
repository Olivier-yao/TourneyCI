"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, Send, LockKeyholeOpen, Lock, CheckCircle2, XCircle } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { CLIP_HEXAGONE } from "@/components/ds/Palier";
import { matchParId, type MatchTournoi } from "@/lib/mockBracket";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";
import { estInscrit } from "@/lib/mockInscriptions";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { lireProfil } from "@/lib/mockProfil";
import { presentsDuTournoi } from "@/lib/mockCheckin";
import { messagesChat, envoyerMessageChat, type MessageChat } from "@/lib/mockChat";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

const RAFRAICHISSEMENT_MS = 8_000;

function cleInscrits(matchId: string): string {
  return `${matchId}-inscrits`;
}

function heure(horodatage: number): string {
  return new Date(horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).toUpperCase();
}

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

/** Chat réservé aux inscrits du tournoi — le "salon"/vestiaire (design v5,
 * écran I3) : fond teinté accent, bulles, ligne de présence. Clé de stockage
 * entièrement distincte du chat spectateurs (/matches/[id]/chat) — les deux
 * ne se croisent jamais, ni en lecture ni en écriture. Si l'accès est refusé,
 * écran verrouillé avec la checklist des trois conditions (I4). */
export default function ChatInscritsMatchPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchTournoi | undefined>(undefined);
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [inscritMoi, setInscritMoi] = useState(false);
  const [organisateur, setOrganisateur] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [presents, setPresents] = useState<string[]>([]);
  const [monPseudo, setMonPseudo] = useState("");
  const [texte, setTexte] = useState("");

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    async function charger() {
      const m = await matchParId(params.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatch(m);
      if (!m) {
        setPret(true);
        return;
      }
      const t = await tournoiParId(m.tournoiId);
      const estOrg = Boolean(t) && (await peutSuperviser(t!.organisateur, nomOrganisateurActuel()));
      const suisInscrit = await estInscrit(m.tournoiId);
      setTournoi(t);
      setOrganisateur(estOrg);
      setInscritMoi(suisInscrit);
      setAutorise(suisInscrit || estOrg);
      setMonPseudo(lireProfil().pseudo);
      setPresents(presentsDuTournoi(m.tournoiId));
      setMessages(messagesChat(cleInscrits(params.id)));
      setPret(true);
      intervalId = setInterval(() => setMessages(messagesChat(cleInscrits(params.id))), RAFRAICHISSEMENT_MS);
    }
    charger();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!connecte) return null;

  if (!pret) return null;

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Match introuvable.
      </div>
    );
  }

  function envoyer() {
    if (!texte.trim()) return;
    envoyerMessageChat(cleInscrits(params.id), monPseudo, texte, organisateur ? "organisateur" : "participant");
    setTexte("");
    setMessages(messagesChat(cleInscrits(params.id)));
  }

  const inscrits = tournoi?.placesInscrites ?? 0;
  const presentsVisibles = presents.slice(0, 6);
  const presentsSupplementaires = Math.max(0, presents.length - presentsVisibles.length);

  if (!autorise) {
    const lignes = [
      { label: "Connecté à ton compte", ok: true },
      { label: "Inscrit à ce tournoi", ok: inscritMoi },
      { label: "Organisateur du tournoi", ok: organisateur },
    ];
    return (
      <div className="min-h-screen flex flex-col relative" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(120% 60% at 50% 0%, var(--ds-accent-900), transparent 70%)" }} />
        <div className="relative px-5 pt-[42px] pb-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
          <button
            type="button"
            onClick={() => router.push(`/matches/${match.id}`)}
            className={`flex items-center justify-center w-[30px] h-[30px] shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            <ArrowDown size={14} strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Lock size={12} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              <div className="text-[14px] font-medium">Salon des inscrits</div>
            </div>
            <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>ACCÈS RÉSERVÉ</div>
          </div>
        </div>

        <div className="relative flex-1 px-6 flex flex-col items-start justify-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{ width: 62, height: 70, background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", clipPath: CLIP_HEXAGONE }}
          >
            <Lock size={26} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
          </div>
          <div>
            <div className="text-[23px] leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              Salon réservé aux inscrits
            </div>
            <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 58%, transparent)" }}>
              Seuls les {inscrits} joueurs inscrits à {tournoi?.titre ?? "ce tournoi"} et l&apos;organisateur peuvent lire et écrire ici.
            </p>
          </div>
          <div className="self-stretch flex flex-col gap-2">
            {lignes.map((l) => (
              <div key={l.label} className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
                {l.ok ? (
                  <CheckCircle2 size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
                ) : (
                  <XCircle size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                )}
                <div className="flex-1 text-xs" style={{ color: l.ok ? "var(--ds-text)" : "var(--ds-muted)" }}>{l.label}</div>
                <div className="text-[9px]" style={{ color: l.ok ? "var(--ds-accent-400)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {l.ok ? "OK" : "NON"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-5 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, paddingBottom: 22 }}>
          <button
            type="button"
            onClick={() => router.push(`/tournois/${match.tournoiId}`)}
            className={`h-[46px] flex items-center justify-center text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            S&apos;inscrire au tournoi
          </button>
          <button
            type="button"
            onClick={() => router.push(`/matches/${match.id}/chat`)}
            className={`h-10 flex items-center justify-center gap-2 text-[13px] font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Rejoindre la tribune
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, var(--ds-accent-900), transparent 70%)" }} />
      <div className="relative px-5 pt-[42px] pb-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--ds-accent-700)" }}>
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}`)}
          className={`flex items-center justify-center w-[30px] h-[30px] shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent-700)", color: "var(--ds-accent-300)" }}
        >
          <ArrowDown size={14} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <LockKeyholeOpen size={12} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
            <div className="text-[14px] font-medium">Salon des inscrits</div>
          </div>
          <div className="text-[9px]" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{inscrits} INSCRITS · PRIVÉ</div>
        </div>
      </div>

      <div className="relative px-5 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--ds-border)" }}>
        <div className="flex flex-1">
          {presentsVisibles.map((p, i) => (
            <div
              key={p}
              className="flex items-center justify-center shrink-0 font-medium text-[9px]"
              style={{ width: 26, height: 26, marginLeft: i ? -8 : 0, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)", boxShadow: "0 0 0 2px var(--ds-bg)" }}
            >
              {initiales(p)}
            </div>
          ))}
        </div>
        {presentsSupplementaires > 0 && (
          <div className="text-[9px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            +{presentsSupplementaires} PRÉSENTS
          </div>
        )}
      </div>

      <div className="relative flex-1 px-5 pt-3 flex flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun message pour l&apos;instant.
          </p>
        ) : (
          messages.map((m, i) => {
            const mine = m.auteur === monPseudo;
            const precedent = messages[i - 1];
            const meme = precedent && precedent.auteur === m.auteur;
            return (
              <div key={m.id} className="flex gap-2.5 max-w-[88%]" style={{ alignSelf: mine ? "flex-end" : "flex-start" }}>
                {!mine && !meme && (
                  <div
                    className="flex items-center justify-center shrink-0 font-medium text-[10px]"
                    style={{ width: 28, height: 28, borderRadius: "var(--ds-radius-pill)", background: m.role === "organisateur" ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: m.role === "organisateur" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                  >
                    {initiales(m.auteur)}
                  </div>
                )}
                <div className="min-w-0">
                  {!meme && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium" style={{ color: m.role === "organisateur" ? "var(--ds-accent-300)" : "var(--ds-text)" }}>{mine ? "Toi" : m.auteur}</span>
                      {m.role === "organisateur" && (
                        <span className="px-1.5 py-px text-[8px] tracking-wide" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                          ORGANISATEUR
                        </span>
                      )}
                      <span className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{heure(m.horodatage)}</span>
                    </div>
                  )}
                  <div
                    className="px-3 py-2 text-[13px] leading-relaxed"
                    style={{
                      borderRadius: "var(--ds-radius-md)",
                      background: mine ? "var(--ds-accent-900)" : "var(--ds-surface)",
                      boxShadow: mine ? "0 0 0 1px var(--ds-accent-700)" : "var(--ds-shadow-sm, 0 1px 2px rgba(0,0,0,.3))",
                    }}
                  >
                    {m.texte}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="relative px-5 flex items-center gap-2.5" style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, paddingBottom: 22 }}>
        <div
          className="flex items-center justify-center shrink-0 font-medium text-[10px]"
          style={{ width: 30, height: 30, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
        >
          {initiales(monPseudo || "?")}
        </div>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          placeholder="Message aux inscrits…"
          className="flex-1 h-11 px-3.5 text-sm outline-none"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-accent-700)", color: "var(--ds-text)" }}
        />
        <button
          type="button"
          onClick={envoyer}
          className={`flex items-center justify-center w-11 h-11 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          aria-label="Envoyer"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
