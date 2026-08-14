"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Video, X, TriangleAlert } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Avatar } from "@/components/ds/Avatar";
import { matchParId, mettreAJourScoreMatch } from "@/lib/mockBracket";
import { tournoiParId } from "@/lib/mockTournaments";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

export default function SignalerScorePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const match = matchParId(params.id);
  const tournoi = match ? tournoiParId(match.tournoiId) : undefined;

  const [s1, setS1] = useState(match?.score1?.toString() ?? "");
  const [s2, setS2] = useState(match?.score2?.toString() ?? "");
  const [preuves, setPreuves] = useState<string[]>([]);
  const [envoye, setEnvoye] = useState(false);
  const captureRef = useRef<HTMLInputElement>(null);
  const clipRef = useRef<HTMLInputElement>(null);

  if (!match || !tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Match introuvable.</p>
        <Link href="/accueil" style={{ color: "var(--ds-accent-300)" }}>Retour à l&apos;accueil</Link>
      </div>
    );
  }

  const pret = s1 !== "" && s2 !== "" && Number(s1) !== Number(s2);

  function surFichierChoisi(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (fichier) setPreuves((p) => [...p, fichier.name]);
  }

  function envoyer() {
    if (!pret) return;
    mettreAJourScoreMatch(tournoi!.id, match!.id, Number(s1), Number(s2));
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p className="text-base font-medium" style={{ color: "var(--ds-accent-300)" }}>Score enregistré.</p>
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          {match.joueur1} {s1} — {s2} {match.joueur2}
        </p>
        <Link href={`/matches/${match.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au match</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.push(`/matches/${match.id}`)}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div className="text-[15px] font-medium">Signaler le score</div>
      </div>

      <div className="px-5 pt-4 flex-1 flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{tournoi.titre}</div>
            <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.jeuLabel} · Quart de finale
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur1 ?? "?")} taille={44} />
            <div className="text-[12px] font-medium text-center truncate w-full">{match.joueur1}</div>
            <input
              type="number"
              inputMode="numeric"
              value={s1}
              onChange={(e) => setS1(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-14 h-11 text-center text-lg font-semibold"
              style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-bg)", border: "1px solid var(--ds-border)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
            />
          </div>
          <div className="text-sm" style={{ color: "var(--ds-muted)" }}>:</div>
          <div className="flex flex-col items-center gap-2">
            <Avatar initiales={initiales(match.joueur2 ?? "?")} taille={44} />
            <div className="text-[12px] font-medium text-center truncate w-full">{match.joueur2}</div>
            <input
              type="number"
              inputMode="numeric"
              value={s2}
              onChange={(e) => setS2(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-14 h-11 text-center text-lg font-semibold"
              style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-bg)", border: "1px solid var(--ds-border)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
            />
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide mb-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Preuve (recommandée)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {preuves.map((p, i) => (
              <div
                key={i}
                className="relative flex items-center justify-center"
                style={{ aspectRatio: "3 / 4", borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
              >
                <span className="text-[9px] text-center px-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{p.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => setPreuves((prev) => prev.filter((_, j) => j !== i))}
                  className={`absolute top-1.5 right-1.5 w-[18px] h-[18px] flex items-center justify-center ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-pill)", background: "color-mix(in srgb, var(--ds-bg) 85%, transparent)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                >
                  <X size={9} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => captureRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1.5 ${PRESS}`}
              style={{ aspectRatio: "3 / 4", borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border)", color: "var(--ds-muted)" }}
            >
              <Camera size={17} strokeWidth={2} />
              <span className="text-[9px]" style={{ fontFamily: "var(--ds-font-mono)" }}>CAPTURE</span>
            </button>
            <button
              type="button"
              onClick={() => clipRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1.5 ${PRESS}`}
              style={{ aspectRatio: "3 / 4", borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border)", color: "var(--ds-muted)" }}
            >
              <Video size={17} strokeWidth={2} />
              <span className="text-[9px]" style={{ fontFamily: "var(--ds-font-mono)" }}>CLIP</span>
            </button>
            <input ref={captureRef} type="file" accept="image/*" className="hidden" onChange={surFichierChoisi} />
            <input ref={clipRef} type="file" accept="video/*" className="hidden" onChange={surFichierChoisi} />
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs" style={{ color: "var(--ds-muted)" }}>
          <TriangleAlert size={15} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
          <span>En cas de score contesté, l&apos;adversaire peut ouvrir un litige avec sa propre preuve.</span>
        </div>
      </div>

      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          disabled={!pret}
          onClick={envoyer}
          className={`w-full h-[46px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          Envoyer le score
        </button>
      </div>
    </div>
  );
}
