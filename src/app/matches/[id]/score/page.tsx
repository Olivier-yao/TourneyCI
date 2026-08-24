"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Video, X, Users, Minus, Plus, Trophy } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { Avatar } from "@/components/ds/Avatar";
import { matchParId, mettreAJourScoreMatch, type MatchTournoi } from "@/lib/mockBracket";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";

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
  const [pretPage, setPretPage] = useState(false);
  const [match, setMatch] = useState<MatchTournoi | undefined>(undefined);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);

  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [preuves, setPreuves] = useState<string[]>([]);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const clipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function charger() {
      const m = await matchParId(params.id);
      setMatch(m);
      setS1(m?.score1?.toString() ?? "");
      setS2(m?.score2?.toString() ?? "");
      if (!m) {
        setPretPage(true);
        return;
      }
      setTournoi(await tournoiParId(m.tournoiId));
      setPretPage(true);
    }
    charger();
     
  }, [params.id]);

  if (!pretPage) return null;

  if (!match || !tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Match introuvable.</p>
        <Link href="/accueil" style={{ color: "var(--ds-accent-300)" }}>Retour à l&apos;accueil</Link>
      </div>
    );
  }

  // Format Best-of-N (tournoi.manchesParMatch) : un score final n'est valide
  // que s'il est réellement décisif pour ce format — jusqu'ici n'importe
  // quelle paire de scores différents clôturait le match, y compris "1-0"
  // sur un tournoi configuré en BO3/BO5, traitant tous les formats comme du
  // BO1. La majorité requise doit être atteinte par un seul côté.
  const manchesRequises = tournoi.manchesParMatch ?? 1;
  const majorite = Math.ceil(manchesRequises / 2);
  const scoreDecisif =
    s1 !== "" && s2 !== "" && Number(s1) !== Number(s2) &&
    Math.max(Number(s1), Number(s2)) === majorite && Math.min(Number(s1), Number(s2)) < majorite;
  const pret = scoreDecisif;

  function surFichierChoisi(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (fichier) setPreuves((p) => [...p, fichier.name]);
  }

  async function envoyer() {
    if (!pret) return;
    // Action immédiate et définitive (aucune confirmation adverse requise
    // côté serveur, cf. score_final dans /api/matches/[id]) — un dernier
    // garde-fou avant d'enregistrer, plutôt qu'un simple bouton "Envoyer"
    // qui laissait croire à tort à un signalement en attente de validation.
    if (!window.confirm(`Enregistrer définitivement ${s1} — ${s2} ? Cette action est immédiate et ne peut pas être annulée.`)) return;
    const resultat = await mettreAJourScoreMatch(tournoi!.id, match!.id, Number(s1), Number(s2));
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Erreur lors de l'enregistrement du score.");
      return;
    }
    setErreur(null);
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
        <div className="text-[15px] font-medium">Déclarer le score</div>
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

        <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)" }}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <Avatar initiales={initiales(match.joueur1 ?? "?")} taille={40} />
              <div className="text-[12px] font-medium text-center truncate w-full">Toi</div>
              <div
                className="w-14 h-[54px] flex items-center justify-center text-2xl"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
              >
                {s1 || "0"}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setS1((v) => String(Math.max(0, (Number(v) || 0) - 1)))}
                  className={`flex items-center justify-center w-[26px] h-[26px] ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Minus size={11} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setS1((v) => String((Number(v) || 0) + 1))}
                  className={`flex items-center justify-center w-[26px] h-[26px] ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Plus size={11} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="text-[13px]" style={{ color: "var(--ds-border-strong)", fontFamily: "var(--ds-font-mono)" }}>—</div>
            <div className="flex flex-col items-center gap-2">
              <Avatar initiales={initiales(match.joueur2 ?? "?")} taille={40} />
              <div className="text-[12px] font-medium text-center truncate w-full">{match.joueur2}</div>
              <div
                className="w-14 h-[54px] flex items-center justify-center text-2xl"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
              >
                {s2 || "0"}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setS2((v) => String(Math.max(0, (Number(v) || 0) - 1)))}
                  className={`flex items-center justify-center w-[26px] h-[26px] ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Minus size={11} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setS2((v) => String((Number(v) || 0) + 1))}
                  className={`flex items-center justify-center w-[26px] h-[26px] ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Plus size={11} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          {pret ? (
            <div className="flex items-center gap-2.5 mt-3.5 pt-3" style={{ borderTop: "1px solid var(--ds-border)" }}>
              <Trophy size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
              <span className="flex-1 text-[13px]">
                {Number(s1) > Number(s2) ? "Tu déclares ta victoire" : "Tu déclares ta défaite"}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-center mt-3.5 pt-3" style={{ borderTop: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
              Format BO{manchesRequises} : entre le nombre de manches gagnées par chacun — {majorite} manche{majorite > 1 ? "s" : ""} gagnée{majorite > 1 ? "s" : ""} clôture le match.
            </p>
          )}
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

        <div className="flex flex-col gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}>
          <div className="flex items-center gap-2.5">
            <Users size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
            <span className="flex-1 text-[13px] font-medium">Ce score sera appliqué immédiatement</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            Aucune confirmation de {match.joueur2} n&apos;est demandée avant d&apos;enregistrer — n&apos;envoie que si vous êtes
            d&apos;accord tous les deux sur le résultat. En cas de désaccord, utilise plutôt &quot;Litige&quot; ci-dessous.
          </p>
        </div>
      </div>

      {erreur && (
        <p className="px-5 text-xs" style={{ color: "var(--ds-danger)" }}>
          {erreur}
        </p>
      )}
      <div className="px-5 py-4 flex gap-2.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <Link
          href={`/matches/${match.id}/litige`}
          className={`flex-1 h-[46px] flex items-center justify-center text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Litige
        </Link>
        <button
          type="button"
          disabled={!pret}
          onClick={envoyer}
          className={`flex-[2] h-[46px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          Enregistrer définitivement
        </button>
      </div>
    </div>
  );
}
