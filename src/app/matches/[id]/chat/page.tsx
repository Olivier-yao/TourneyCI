"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { matchParId } from "@/lib/mockBracket";
import { tournoiParId } from "@/lib/mockTournaments";
import { estInscrit } from "@/lib/mockInscriptions";
import { estOrganisateur } from "@/lib/mockAuth";
import { lireProfil } from "@/lib/mockProfil";
import { messagesChat, envoyerMessageChat, type MessageChat } from "@/lib/mockChat";

const RAFRAICHISSEMENT_MS = 8_000;
const COOLDOWN_MS = 10_000;
const REPONSES_RAPIDES = ["🔥", "GG !", "Allez !"];

function cleSpectateurs(matchId: string): string {
  return `${matchId}-spectateurs`;
}

function heure(horodatage: number): string {
  return new Date(horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Chat des spectateurs d'un match : ouvert à tout visiteur, même sans
 * compte (point 106) — jamais partagé avec le chat des inscrits, qui vit
 * sous une clé de stockage distincte (/matches/[id]/chat-inscrits). */
export default function ChatSpectateursMatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const match = matchParId(params.id);
  const tournoi = match ? tournoiParId(match.tournoiId) : undefined;
  const [inscrit, setInscrit] = useState(false);
  const [organisateur, setOrganisateur] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [texte, setTexte] = useState("");
  const [enCooldown, setEnCooldown] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInscrit(match ? estInscrit(match.tournoiId) : false);
    setOrganisateur(estOrganisateur());
    setMessages(messagesChat(cleSpectateurs(params.id)));
    const id = setInterval(() => setMessages(messagesChat(cleSpectateurs(params.id))), RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Match introuvable.
      </div>
    );
  }

  if (inscrit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          Tu es inscrit à ce tournoi — retrouve les autres participants dans le chat des inscrits.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}/chat-inscrits`)}
          className={`text-sm font-medium ${PRESS}`}
          style={{ color: "var(--ds-accent-300)" }}
        >
          Ouvrir le chat des inscrits →
        </button>
      </div>
    );
  }

  function envoyer(contenu: string) {
    const message = contenu.trim();
    if (!message || enCooldown) return;
    envoyerMessageChat(cleSpectateurs(params.id), lireProfil().pseudo || "Spectateur", message, organisateur ? "organisateur" : "participant");
    setTexte("");
    setMessages(messagesChat(cleSpectateurs(params.id)));
    setEnCooldown(true);
    setTimeout(() => setEnCooldown(false), COOLDOWN_MS);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <button type="button" onClick={() => router.push(`/matches/${params.id}`)} style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Chat du match
          </div>
          <div className="text-[10px] truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi?.titre ?? "Match"} · {match.joueur1} {match.score1 ?? "–"} — {match.score2 ?? "–"} {match.joueur2}
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun message pour l&apos;instant — sois le premier à commenter.
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

      <div className="sticky bottom-0 px-5 py-3 flex flex-col gap-2.5" style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}>
        <div className="flex gap-1.5">
          {REPONSES_RAPIDES.map((r) => (
            <button
              key={r}
              type="button"
              disabled={enCooldown}
              onClick={() => envoyer(r)}
              className={`h-7 px-3 text-[11px] whitespace-nowrap disabled:opacity-40 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyer(texte)}
            placeholder="Écrire en tant qu'invité..."
            className="flex-1 h-11 px-3.5 text-sm outline-none"
            style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          <button
            type="button"
            onClick={() => envoyer(texte)}
            disabled={enCooldown || !texte.trim()}
            className={`flex items-center justify-center w-11 h-11 shrink-0 disabled:opacity-40 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            aria-label="Envoyer"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
        <p className="text-[9px] text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {enCooldown ? "PATIENTE UN INSTANT AVANT LE PROCHAIN MESSAGE · " : ""}OUVERT SANS COMPTE · 1 MESSAGE / 10S · MODÉRÉ PAR L&apos;ORGANISATEUR
        </p>
      </div>
    </div>
  );
}
