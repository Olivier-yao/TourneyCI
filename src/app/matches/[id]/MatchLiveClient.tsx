"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessagesSquare, ChevronRight, Camera } from "lucide-react";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { Avatar } from "@/components/ds/Avatar";
import { Button } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import type { MatchTournoi } from "@/lib/mockBracket";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

export function MatchLiveClient({
  match,
  tournoiId,
  tournoiTitre,
}: {
  match: MatchTournoi;
  tournoiId: string;
  tournoiTitre: string;
}) {
  const router = useRouter();
  const [minute, setMinute] = useState(match.minute ?? 0);
  const [panneau, setPanneau] = useState<"aucun" | "score">("aucun");
  const [scoreEnvoye, setScoreEnvoye] = useState(false);
  const [captureNom, setCaptureNom] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setMinute((m) => Math.min(m + 1, 90)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div
        className="p-5 flex flex-col gap-4"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, var(--ds-surface), var(--ds-bg))",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
            className="flex items-center justify-center w-9 h-9 cursor-pointer"
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            <ArrowLeft size={17} strokeWidth={2} />
          </button>
          <LiveBadge texte={`EN DIRECT · ${minute}'`} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur1 ?? "?")} taille={52} />
            <div className="text-[13px] font-medium text-center">{match.joueur1}</div>
          </div>
          <div
            className="flex items-baseline gap-2 text-[34px] font-medium"
            style={{ fontFamily: "var(--ds-font-mono)" }}
          >
            <span>{match.score1}</span>
            <span style={{ color: "var(--ds-muted)", fontSize: 20 }}>:</span>
            <span style={{ color: "var(--ds-accent-300)" }}>{match.score2}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur2 ?? "?")} taille={52} />
            <div className="text-[13px] font-medium text-center">{match.joueur2}</div>
          </div>
        </div>

        <div className="text-center text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {tournoiTitre} · Quart de finale
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <div
          className="text-[11px] uppercase tracking-wide"
          style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          Fil du match
        </div>
        <div className="flex flex-col gap-3">
          {(match.evenements ?? []).map((ev, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className="w-8 text-xs"
                style={{ color: i === 0 ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
              >
                {ev.minute}&apos;
              </div>
              <div
                className="flex-1 text-sm"
                style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-text-muted)" }}
              >
                {ev.texte}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="flex items-center gap-3 p-3 mt-2 cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <MessagesSquare size={18} style={{ color: "var(--ds-accent)" }} />
          <span className="flex-1 text-[13px] text-left" style={{ color: "var(--ds-muted)" }}>
            142 spectateurs discutent
          </span>
          <ChevronRight size={15} style={{ color: "var(--ds-muted)" }} />
        </button>

        {panneau === "score" && (
          <div
            className="p-4 flex flex-col gap-3"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            {scoreEnvoye ? (
              <p className="text-sm" style={{ color: "var(--ds-accent-300)" }}>
                Score signalé, en attente de confirmation de l&apos;adversaire.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={match.joueur1 ?? "Joueur 1"} type="number" defaultValue={match.score1 ?? 0} />
                  <Field label={match.joueur2 ?? "Joueur 2"} type="number" defaultValue={match.score2 ?? 0} />
                </div>
                <label
                  className="flex items-center gap-2 p-2.5 text-[13px] cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border-strong)", color: "var(--ds-muted)" }}
                >
                  <Camera size={16} />
                  {captureNom ?? "Ajouter une capture d'écran"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCaptureNom(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
                <Button variante="primary" onClick={() => setScoreEnvoye(true)}>
                  Envoyer
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div
        className="px-5 py-4 flex gap-2.5"
        style={{ borderTop: "1px solid var(--ds-border)" }}
      >
        <Button
          variante="secondary"
          onClick={() => router.push(`/matches/${match.id}/litige`)}
        >
          Litige
        </Button>
        <Button
          variante="primary"
          bloc
          onClick={() => setPanneau(panneau === "score" ? "aucun" : "score")}
        >
          Signaler le score
        </Button>
      </div>
    </div>
  );
}
