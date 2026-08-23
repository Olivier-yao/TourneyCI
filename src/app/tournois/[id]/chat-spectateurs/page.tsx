"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, Eye, Hourglass } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { spectateursDerives } from "@/lib/mockBracket";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";
import { estConnecte } from "@/lib/mockAuth";
import { messagesChatSpectateursTournoi, envoyerMessageChatSpectateursTournoi, type MessageChat } from "@/lib/mockChat";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

// Filet de sécurité en complément du temps réel (Realtime), pas la source
// principale de rafraîchissement — couvre une reconnexion manquée.
const RAFRAICHISSEMENT_MS = 60_000;
const COOLDOWN_S = 10;
const REPONSES_RAPIDES = ["🔥", "GG !", "Allez !"];

function heure(horodatage: number): string {
  return new Date(horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).toUpperCase();
}

/** Tribune des spectateurs d'un tournoi en direct, accédée directement
 * depuis la fiche tournoi (pas depuis un match précis) — nécessaire quand
 * le tournoi est en direct mais qu'aucun match n'a encore été généré, ou
 * entre deux matchs. Même fil que /matches/[id]/chat (cf. le commentaire
 * de src/lib/server/chat.ts), juste un point d'entrée différent. */
export default function ChatSpectateursTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [pret, setPret] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [texte, setTexte] = useState("");
  const [secondesRestantes, setSecondesRestantes] = useState(0);
  const minuteurRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    async function charger() {
      const t = await tournoiParId(params.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTournoi(t);
      if (!t) {
        setPret(true);
        return;
      }
      setMessages(await messagesChatSpectateursTournoi(params.id));
      setPret(true);
      intervalId = setInterval(async () => setMessages(await messagesChatSpectateursTournoi(params.id)), RAFRAICHISSEMENT_MS);
    }
    charger();
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (minuteurRef.current) clearInterval(minuteurRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useRealtimeRefetch(
    [{ table: "messages_chat", filter: `tournoi_id=eq.${params.id},salon=eq.tribune` }],
    () => { messagesChatSpectateursTournoi(params.id).then(setMessages); },
    pret,
  );

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Tournoi introuvable.
      </div>
    );
  }

  const spectateurs = spectateursDerives(tournoi.id);

  async function envoyer(contenu: string) {
    const message = contenu.trim();
    if (!message || secondesRestantes > 0) return;
    if (!estConnecte()) {
      router.push("/verify");
      return;
    }
    await envoyerMessageChatSpectateursTournoi(params.id, message);
    setTexte("");
    setMessages(await messagesChatSpectateursTournoi(params.id));
    setSecondesRestantes(COOLDOWN_S);
    minuteurRef.current = setInterval(() => {
      setSecondesRestantes((s) => {
        if (s <= 1) {
          if (minuteurRef.current) clearInterval(minuteurRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-surface-2)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[42px] pb-3 flex items-center gap-2.5" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => router.push(`/tournois/${tournoi.id}`)}
          className={`flex items-center justify-center w-[30px] h-[30px] shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowDown size={14} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium">Tribune des spectateurs</div>
          <div className="text-[9px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.titre} · {spectateurs} EN LIGNE
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Eye size={13} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
          <span className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{spectateurs}</span>
        </div>
      </div>

      <div className="flex-1 px-5 pt-3 flex flex-col overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm py-2" style={{ color: "var(--ds-text-muted)" }}>
            Aucun message pour l&apos;instant — sois le premier à commenter.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="py-1.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium" style={{ color: m.role === "organisateur" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}>
                  {m.auteur}
                </span>
                {m.role === "organisateur" && (
                  <span className="px-1.5 py-px text-[8px] tracking-wide" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                    ORGANISATEUR
                  </span>
                )}
                <span className="ml-auto text-[9px]" style={{ color: "var(--ds-border-strong)", fontFamily: "var(--ds-font-mono)" }}>{heure(m.horodatage)}</span>
              </div>
              <div className="text-[13px] leading-relaxed" style={{ color: m.role === "organisateur" ? "var(--ds-text)" : "color-mix(in srgb, var(--ds-text) 78%, transparent)" }}>
                {m.texte}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-0 px-5 flex flex-col gap-2.5" style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)", paddingTop: 11, paddingBottom: 22 }}>
        <div className="flex gap-1.5">
          {REPONSES_RAPIDES.map((r) => (
            <button
              key={r}
              type="button"
              disabled={secondesRestantes > 0}
              onClick={() => envoyer(r)}
              className={`h-[30px] px-3 text-xs whitespace-nowrap disabled:opacity-40 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyer(texte)}
            disabled={secondesRestantes > 0}
            placeholder="Écrire en tant qu'invité…"
            className="flex-1 h-[42px] px-3.5 text-sm outline-none disabled:opacity-60"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          <button
            type="button"
            onClick={() => envoyer(texte)}
            disabled={secondesRestantes > 0 || !texte.trim()}
            className={`flex items-center justify-center w-[42px] h-[42px] shrink-0 disabled:opacity-70 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)", fontSize: 12 }}
            aria-label="Envoyer"
          >
            {secondesRestantes > 0 ? secondesRestantes : "↵"}
          </button>
        </div>
        {secondesRestantes > 0 && (
          <div className="flex items-center gap-2 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <Hourglass size={12} strokeWidth={2} />
            ENCORE {secondesRestantes} S AVANT TON PROCHAIN MESSAGE
          </div>
        )}
      </div>
    </div>
  );
}
