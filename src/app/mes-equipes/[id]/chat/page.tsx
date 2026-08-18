"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, Send, Users } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { EcussonEquipe } from "@/components/ds/Palier";
import { lireProfil } from "@/lib/mockProfil";
import { equipeProfilParId, type EquipeProfil } from "@/lib/mockEquipesProfil";
import { messagesChatEquipe, envoyerMessageChatEquipe, type MessageChatEquipe } from "@/lib/mockChatEquipe";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

const RAFRAICHISSEMENT_MS = 8_000;

function heure(horodatage: number): string {
  return new Date(horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).toUpperCase();
}

/** Chat d'équipe (design v8, écran N1) — scope par équipe pré-créée, pas par
 * tournoi : tous les membres à égalité, juste une couronne discrète sur le
 * chef, contrairement aux chats de tournoi qui distinguent organisateur. */
export default function ChatEquipePage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [equipe, setEquipe] = useState<EquipeProfil | undefined>(undefined);
  const [moi, setMoi] = useState("");
  const [messages, setMessages] = useState<MessageChatEquipe[]>([]);
  const [texte, setTexte] = useState("");

  useEffect(() => {
    const e = equipeProfilParId(params.id);
    const p = lireProfil().pseudo;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEquipe(e);
    setMoi(p);
    setMessages(messagesChatEquipe(params.id));
    setPret(true);
    const id = setInterval(() => setMessages(messagesChatEquipe(params.id)), RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, [params.id]);

  if (!connecte || !pret) return null;

  if (!equipe || !equipe.membres.includes(moi)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Équipe introuvable.</p>
        <Link href="/mes-equipes" style={{ color: "var(--ds-accent-300)" }}>Retour à mes équipes</Link>
      </div>
    );
  }

  function envoyer() {
    if (!texte.trim() || !equipe) return;
    envoyerMessageChatEquipe(equipe.id, moi, texte);
    setTexte("");
    setMessages(messagesChatEquipe(equipe.id));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[42px] pb-3 flex items-center gap-2.5" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className={`flex items-center justify-center w-[30px] h-[30px] shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
        </button>
        <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style="accent" largeur={32} hauteur={36} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{equipe.nom}</div>
          <div className="flex items-center gap-1 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <Users size={9} strokeWidth={2} />
            {equipe.membres.length} MEMBRES · CHAT PRIVÉ
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pt-3.5 pb-3 flex flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm py-2" style={{ color: "var(--ds-text-muted)" }}>
            Aucun message pour l&apos;instant — lance la discussion avec ton équipe.
          </p>
        ) : (
          messages.map((m, i) => {
            if (m.type === "systeme") {
              return (
                <div key={m.id} className="self-center max-w-[92%] flex items-center gap-2 px-3 py-1.5" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)" }}>
                  <Users size={12} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-muted)" }} />
                  <div className="text-[11px] min-w-0" style={{ color: "var(--ds-muted)" }}>{m.texte}</div>
                </div>
              );
            }
            const mine = m.auteur === moi;
            const precedent = messages[i - 1];
            const meme = precedent && precedent.type === "message" && precedent.auteur === m.auteur;
            const estChefAuteur = m.auteur === equipe.chef;
            return (
              <div key={m.id} className="flex gap-2.5 max-w-[86%]" style={{ alignSelf: mine ? "flex-end" : "flex-start" }}>
                {!mine && !meme && (
                  <div
                    className="flex items-center justify-center shrink-0 text-[10px] font-medium"
                    style={{ width: 28, height: 28, borderRadius: "var(--ds-radius-pill)", background: estChefAuteur ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: estChefAuteur ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                  >
                    {(m.auteur ?? "").slice(0, 2).toUpperCase()}
                  </div>
                )}
                {!mine && meme && <div className="shrink-0" style={{ width: 28 }} />}
                <div className="min-w-0">
                  {!meme && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium">{mine ? "Toi" : m.auteur}</span>
                      {estChefAuteur && <Crown size={10} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-400)" }} />}
                      <span className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{heure(m.horodatage)}</span>
                    </div>
                  )}
                  <div
                    className="px-3 py-2 text-sm leading-relaxed"
                    style={{
                      borderRadius: "var(--ds-radius-md)",
                      background: mine ? "var(--ds-accent-900)" : "var(--ds-surface)",
                      boxShadow: mine ? "0 0 0 1px var(--ds-accent-700)" : "var(--ds-shadow-sm, none)",
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

      <div className="sticky bottom-0 px-5 py-3 flex items-center gap-2.5" style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          placeholder="Message à l'équipe…"
          className="flex-1 h-11 px-3.5 text-sm outline-none"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        />
        <button
          type="button"
          onClick={envoyer}
          disabled={!texte.trim()}
          className={`flex items-center justify-center w-11 h-11 shrink-0 disabled:opacity-50 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          aria-label="Envoyer"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
