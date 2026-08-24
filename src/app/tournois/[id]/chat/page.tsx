"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";
import { estInscrit } from "@/lib/mockInscriptions";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { messagesChatTournoi, envoyerMessageChatTournoi, type MessageChat } from "@/lib/mockChat";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

// Filet de sécurité en complément du temps réel (Realtime), pas la source
// principale de rafraîchissement — couvre une reconnexion manquée.
const RAFRAICHISSEMENT_MS = 60_000;

function heure(horodatage: number): string {
  return new Date(horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatTournoiPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [texte, setTexte] = useState("");

  useEffect(() => {
    async function charger() {
      const t = await tournoiParId(params.id);
       
      setTournoi(t);
      const org = Boolean(t) && (await peutSuperviser(t!.organisateur, await nomOrganisateurActuel()));
      // Accessible dès l'inscription (pas besoin d'attendre la clôture des
      // inscriptions ni le début de la compétition).
      setAutorise((await estInscrit(params.id)) || org);
      setMessages(await messagesChatTournoi(params.id));
      setPret(true);
    }
    charger();
    const id = setInterval(async () => setMessages(await messagesChatTournoi(params.id)), RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, [params.id]);

  useRealtimeRefetch(
    [{ table: "messages_chat", filter: `tournoi_id=eq.${params.id},salon=eq.general` }],
    () => { messagesChatTournoi(params.id).then(setMessages); },
    pret,
  );

  if (!connecte) return null;

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Tournoi introuvable.
      </div>
    );
  }

  async function envoyer() {
    if (!texte.trim()) return;
    await envoyerMessageChatTournoi(params.id, texte);
    setTexte("");
    setMessages(await messagesChatTournoi(params.id));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <button type="button" onClick={() => router.back()} style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </button>
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.titre}</div>
          <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Chat
          </div>
        </div>
      </div>

      {!autorise ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <Lock size={22} style={{ color: "var(--ds-muted)" }} />
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Le chat est réservé aux inscrits et à l&apos;organisateur de ce tournoi.
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
                    alignSelf: m.role === "organisateur" ? "flex-start" : "flex-start",
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
