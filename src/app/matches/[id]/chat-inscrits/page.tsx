"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { matchParId } from "@/lib/mockBracket";
import { tournoiParId } from "@/lib/mockTournaments";
import { estInscrit } from "@/lib/mockInscriptions";
import { estOrganisateur } from "@/lib/mockAuth";
import { lireProfil } from "@/lib/mockProfil";
import { messagesChat, envoyerMessageChat, type MessageChat } from "@/lib/mockChat";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

const RAFRAICHISSEMENT_MS = 8_000;

function cleInscrits(matchId: string): string {
  return `${matchId}-inscrits`;
}

function heure(horodatage: number): string {
  return new Date(horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Chat réservé aux inscrits du tournoi : clé de stockage entièrement
 * distincte du chat spectateurs (/matches/[id]/chat) — les deux ne se
 * croisent jamais, ni en lecture ni en écriture (point 106). */
export default function ChatInscritsMatchPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const match = matchParId(params.id);
  const tournoi = match ? tournoiParId(match.tournoiId) : undefined;
  const [autorise, setAutorise] = useState(false);
  const [organisateur, setOrganisateur] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [texte, setTexte] = useState("");

  useEffect(() => {
    if (!match) return;
    const estOrg = estOrganisateur();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateur(estOrg);
    setAutorise(estInscrit(match.tournoiId) || estOrg);
    setMessages(messagesChat(cleInscrits(params.id)));
    const id = setInterval(() => setMessages(messagesChat(cleInscrits(params.id))), RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!connecte) return null;

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Match introuvable.
      </div>
    );
  }

  function envoyer() {
    if (!texte.trim()) return;
    envoyerMessageChat(cleInscrits(params.id), lireProfil().pseudo, texte, organisateur ? "organisateur" : "participant");
    setTexte("");
    setMessages(messagesChat(cleInscrits(params.id)));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <button type="button" onClick={() => router.push(`/matches/${params.id}`)} style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </button>
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi?.titre ?? "Match"} · {match.joueur1} vs {match.joueur2}
          </div>
          <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Chat des inscrits
          </div>
        </div>
      </div>

      {!autorise ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <Lock size={22} style={{ color: "var(--ds-muted)" }} />
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Ce chat est réservé aux inscrits de ce tournoi.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 px-5 py-4 flex flex-col gap-2.5 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
                Aucun message pour l&apos;instant.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-0.5 p-2.5 max-w-[85%]"
                  style={{
                    borderRadius: "var(--ds-radius-md)",
                    background: m.role === "organisateur" ? "var(--ds-accent-900)" : "var(--ds-surface)",
                    border: "1px solid var(--ds-border)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold" style={{ color: m.role === "organisateur" ? "var(--ds-accent-300)" : "var(--ds-text)" }}>
                      {m.auteur}{m.role === "organisateur" ? " · Organisateur" : ""}
                    </span>
                    <span style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{heure(m.horodatage)}</span>
                  </div>
                  <p className="text-sm">{m.texte}</p>
                </div>
              ))
            )}
          </div>
          <div className="sticky bottom-0 px-5 py-3 flex items-center gap-2" style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}>
            <input
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyer()}
              placeholder="Écrire un message..."
              className="flex-1 h-11 px-3.5 text-sm outline-none"
              style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
            />
            <button
              type="button"
              onClick={envoyer}
              className="flex items-center justify-center w-11 h-11 shrink-0 cursor-pointer"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
              aria-label="Envoyer"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
