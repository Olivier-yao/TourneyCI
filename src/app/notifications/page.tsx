"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Trophy, Ticket, MessageCircle } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { PRESS } from "@/components/ds/Button";
import {
  mesNotifications,
  estLue,
  marquerLue,
  toutMarquerLu,
  nombreNonLues,
  type NotificationApp,
} from "@/lib/mockNotifications";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

const FILTRES = ["Tout", "Tournois", "Résultats", "Chat"] as const;
type Filtre = (typeof FILTRES)[number];

function iconePour(texte: string) {
  const t = texte.toLowerCase();
  if (t.includes("message") || t.includes("chat")) return MessageCircle;
  if (t.includes("score") || t.includes("manche") || t.includes("classement") || t.includes("terminé")) return Trophy;
  return Ticket;
}

function correspondFiltre(n: NotificationApp, filtre: Filtre): boolean {
  if (filtre === "Tout") return true;
  const t = n.texte.toLowerCase();
  if (filtre === "Chat") return t.includes("message") || t.includes("chat");
  if (filtre === "Résultats") return t.includes("score") || t.includes("manche") || t.includes("classement") || t.includes("terminé");
  return Boolean(n.tournoiId);
}

export default function NotificationsPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationApp[]>([]);
  const [lues, setLues] = useState<Set<string>>(new Set());
  const [filtre, setFiltre] = useState<Filtre>("Tout");
  const [nonLues, setNonLues] = useState(0);

  useEffect(() => {
    const liste = mesNotifications();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications(liste);
    setLues(new Set(liste.filter((n) => estLue(n.id)).map((n) => n.id)));
    setNonLues(nombreNonLues());
  }, []);

  if (!connecte) return null;

  function ouvrir(n: NotificationApp) {
    marquerLue(n.id);
    setLues((prev) => new Set(prev).add(n.id));
    setNonLues((v) => Math.max(0, v - (lues.has(n.id) ? 0 : 1)));
    if (n.tournoiId) router.push(`/tournois/${n.tournoiId}`);
  }

  function toutMarquer() {
    toutMarquerLu();
    setLues(new Set(notifications.map((n) => n.id)));
    setNonLues(0);
  }

  const filtrees = notifications.filter((n) => correspondFiltre(n, filtre));

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] pb-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/accueil")}
            className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <div className="flex-1">
            <div
              className="text-[23px] leading-tight"
              style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
            >
              Notifications
            </div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {nonLues} non lue{nonLues > 1 ? "s" : ""}
            </div>
          </div>
          {nonLues > 0 && (
            <button type="button" onClick={toutMarquer} className={`text-xs font-medium ${PRESS}`} style={{ color: "var(--ds-accent-300)" }}>
              Tout marquer lu
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTRES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={`h-[30px] px-3 text-xs font-medium shrink-0 ${PRESS}`}
              style={{
                borderRadius: "var(--ds-radius-pill)",
                background: filtre === f ? "var(--ds-accent-900)" : "transparent",
                color: filtre === f ? "var(--ds-accent-300)" : "var(--ds-muted)",
                border: `1px solid ${filtre === f ? "var(--ds-accent)" : "var(--ds-border)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col">
        {filtrees.length === 0 ? (
          <EmptyState titre="Rien ici" description="Aucune notification pour ce filtre." />
        ) : (
          filtrees.map((n) => {
            const Icone = iconePour(n.texte);
            const lue = lues.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => ouvrir(n)}
                disabled={!n.tournoiId}
                className={`flex items-start gap-2.5 p-2.5 -mx-2.5 text-left ${n.tournoiId ? PRESS : ""}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: lue ? "transparent" : "var(--ds-accent-900)" }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 shrink-0"
                  style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", color: "var(--ds-accent-300)" }}
                >
                  <Icone size={15} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[13px]" style={{ fontWeight: lue ? 400 : 500 }}>{n.texte}</div>
                    <div className="text-[10px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{n.temps}</div>
                  </div>
                </div>
                {!lue && <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--ds-accent-400)" }} />}
              </button>
            );
          })
        )}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
            <Bell size={28} style={{ color: "var(--ds-muted)" }} />
            <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucune notification pour l&apos;instant.</p>
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
