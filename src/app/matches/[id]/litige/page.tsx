"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X, Camera, CheckCircle2, Clock, Circle, TriangleAlert } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { matchParId } from "@/lib/mockBracket";
import { tournoiParId } from "@/lib/mockTournaments";
import { lireProfil } from "@/lib/mockProfil";
import { creerLitige, litigeDuMatch, ajouterPreuveLitige, mesLitiges, type Litige } from "@/lib/mockLitige";

const MOTIFS = [
  { id: "score", label: "Score erroné" },
  { id: "noshow", label: "L'adversaire ne s'est pas présenté" },
  { id: "cheat", label: "Triche suspectée" },
  { id: "conn", label: "Déconnexion en cours de partie" },
  { id: "other", label: "Autre motif" },
];

const MAX_DESCRIPTION = 400;

type Etape = "motif" | "preuve" | "suivi";

function EnTete({ titre, etapeNum, onBack }: { titre: string; etapeNum?: number; onBack: () => void }) {
  return (
    <div className="px-5 pt-[42px] flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          {etapeNum === 1 || !etapeNum ? <X size={15} strokeWidth={2} /> : <ArrowLeft size={15} strokeWidth={2} />}
        </button>
        <div>
          <div className="text-[15px] font-medium">{titre}</div>
          {etapeNum && <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Étape {etapeNum} sur 3</div>}
        </div>
      </div>
      {etapeNum && (
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex-1 h-[2px] rounded-full" style={{ background: n <= etapeNum ? "var(--ds-accent)" : "var(--ds-border)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LitigePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const match = matchParId(params.id);
  const tournoi = match ? tournoiParId(match.tournoiId) : undefined;

  const [etape, setEtape] = useState<Etape>("motif");
  const [litige, setLitige] = useState<Litige | undefined>(undefined);
  const [historique, setHistorique] = useState<Litige[]>([]);
  const [motifId, setMotifId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [preuves, setPreuves] = useState<string[]>([]);

  useEffect(() => {
    const existant = litigeDuMatch(params.id);
    if (existant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLitige(existant);
      setEtape("suivi");
    }
    setHistorique(mesLitiges().filter((l) => l.matchId !== params.id).slice(0, 3));
  }, [params.id]);

  if (!match || !tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Match introuvable.</p>
        <Link href="/accueil" style={{ color: "var(--ds-accent-300)" }}>Retour à l&apos;accueil</Link>
      </div>
    );
  }

  const monPseudo = lireProfil().pseudo;
  const adversaire = match.joueur1 === monPseudo ? match.joueur2 : match.joueur1;

  function ajouterPreuve() {
    const nom = `Capture ${preuves.length + 1}`;
    if (litige) {
      ajouterPreuveLitige(litige.id, nom);
      setLitige({ ...litige, preuves: [...litige.preuves, nom] });
    } else {
      setPreuves((p) => [...p, nom]);
    }
  }

  function envoyerLitige() {
    if (!motifId || !tournoi) return;
    const motif = MOTIFS.find((m) => m.id === motifId);
    const nouveau = creerLitige({
      matchId: params.id,
      tournoiId: tournoi.id,
      tournoiTitre: tournoi.titre,
      adversaire: adversaire ?? "l'adversaire",
      arbitre: tournoi.organisateur,
      motifId,
      motifLabel: motif?.label ?? "Autre motif",
      description: description.trim(),
      preuves,
    });
    setLitige(nouveau);
    setEtape("suivi");
  }

  if (etape === "motif") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <EnTete titre="Signaler un litige" etapeNum={1} onBack={() => router.push(`/matches/${params.id}`)} />
        <div className="px-5 pt-4 flex-1 flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
            <div className="w-[34px] h-[34px] flex items-center justify-center shrink-0" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", color: "var(--ds-accent-300)" }}>
              <TriangleAlert size={16} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{tournoi.titre}</div>
              <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {tournoi.jeuLabel} · toi {match.score1 ?? "–"} — {match.score2 ?? "–"} {adversaire}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide mb-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Motif du désaccord
            </div>
            <div className="flex flex-col gap-1.5">
              {MOTIFS.map((m) => {
                const actif = motifId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotifId(m.id)}
                    className={`flex items-center gap-2.5 p-3 text-left ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: actif ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px transparent" }}
                  >
                    <span
                      className="w-[17px] h-[17px] flex items-center justify-center shrink-0"
                      style={{ borderRadius: "var(--ds-radius-pill)", border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border-strong)"}` }}
                    >
                      {actif && <span className="w-[7px] h-[7px] rounded-full" style={{ background: "var(--ds-accent-400)" }} />}
                    </span>
                    <span className="flex-1 text-sm">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Décris ce qui s&apos;est passé
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
              rows={4}
              placeholder="Reste factuel, un arbitre va lire."
              className="px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
            />
            <div className="flex justify-end text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {description.length} / {MAX_DESCRIPTION}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex gap-2.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
          <button
            type="button"
            onClick={() => router.push(`/matches/${params.id}`)}
            className={`flex-1 h-[46px] text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!motifId}
            onClick={() => setEtape("preuve")}
            className={`flex-[2] h-[46px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  if (etape === "preuve") {
    const motif = MOTIFS.find((m) => m.id === motifId);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <EnTete titre="Joindre une preuve" etapeNum={2} onBack={() => setEtape("motif")} />
        <div className="px-5 pt-4 flex-1 flex flex-col gap-3.5">
          <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            Une capture de l&apos;écran de fin de partie suffit dans la plupart des cas. Sans preuve, l&apos;arbitre tranche sur déclaration.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {preuves.map((p, i) => (
              <div
                key={i}
                className="relative flex items-center justify-center"
                style={{ aspectRatio: "3 / 4", borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
              >
                <span className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{p.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => setPreuves((prev) => prev.filter((_, j) => j !== i))}
                  className={`absolute top-2 right-2 w-[22px] h-[22px] flex items-center justify-center ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-pill)", background: "color-mix(in srgb, var(--ds-bg) 85%, transparent)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                >
                  <X size={11} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={ajouterPreuve}
              className={`flex flex-col items-center justify-center gap-2 ${PRESS}`}
              style={{ aspectRatio: "3 / 4", borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border)", color: "var(--ds-muted)" }}
            >
              <Camera size={20} strokeWidth={2} />
              <span className="text-[10px]" style={{ fontFamily: "var(--ds-font-mono)" }}>AJOUTER</span>
            </button>
          </div>

          <div className="p-3.5 flex flex-col gap-2" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Récapitulatif</div>
            <div className="flex justify-between text-xs"><span style={{ color: "var(--ds-muted)" }}>Motif</span><span>{motif?.label}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: "var(--ds-muted)" }}>Adversaire</span><span>{adversaire}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: "var(--ds-muted)" }}>Arbitre</span><span>{tournoi.organisateur}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: "var(--ds-muted)" }}>Preuves</span><span style={{ fontFamily: "var(--ds-font-mono)" }}>{preuves.length}</span></div>
          </div>

          <div className="flex items-start gap-2.5 text-xs" style={{ color: "var(--ds-muted)" }}>
            <TriangleAlert size={15} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
            <span>Un litige abusif répété peut suspendre ton accès aux tournois payants.</span>
          </div>
        </div>

        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--ds-border)" }}>
          <button
            type="button"
            onClick={envoyerLitige}
            className={`w-full h-[46px] text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            Envoyer le litige
          </button>
        </div>
      </div>
    );
  }

  if (!litige) return null;

  const etapesSuivi = [
    { icone: CheckCircle2, label: "Litige envoyé", at: new Date(litige.horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), fait: true },
    { icone: CheckCircle2, label: "Adversaire notifié", at: new Date(litige.horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), fait: true },
    { icone: Clock, label: "Examen de l'organisateur", at: litige.statut === "en_attente" ? "En cours" : "Terminé", fait: litige.statut !== "en_attente" },
    { icone: Circle, label: "Décision", at: litige.statut === "en_attente" ? "Sous 24h ouvrées" : litige.statut === "resolu_faveur" ? "En ta faveur" : "Rejeté", fait: litige.statut !== "en_attente" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <EnTete titre="Mes litiges" onBack={() => router.push(`/matches/${params.id}`)} />
      <div className="px-5 pt-4 flex-1 flex flex-col gap-5">
        <div
          className="p-[15px] flex flex-col gap-3"
          style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)" }}>
              <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />
              <span className="text-[9px] tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                {litige.statut === "en_attente" ? "EN ATTENTE D'ARBITRAGE" : litige.statut === "resolu_faveur" ? "RÉSOLU EN TA FAVEUR" : "REJETÉ"}
              </span>
            </div>
            <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>#{litige.id}</div>
          </div>
          <div>
            <div className="text-[17px] font-medium">{litige.tournoiTitre}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {litige.motifLabel.toUpperCase()} · CONTRE {litige.adversaire.toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {etapesSuivi.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <s.icone size={14} strokeWidth={2} className="mt-0.5" style={{ color: s.fait ? "var(--ds-accent-400)" : "var(--ds-muted)" }} />
                <div className="flex-1">
                  <div className="text-[13px]" style={{ color: s.fait ? "var(--ds-text)" : "var(--ds-muted)" }}>{s.label}</div>
                  <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{s.at}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={ajouterPreuve}
            className={`h-10 text-[13px] font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            Ajouter une preuve
          </button>
        </div>

        {historique.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Historique · {historique.length} dernier{historique.length > 1 ? "s" : ""}
            </div>
            {historique.map((h) => (
              <div key={h.id} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
                <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface)", color: "var(--ds-muted)" }}>
                  <TriangleAlert size={14} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{h.tournoiTitre}</div>
                  <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {new Date(h.horodatage).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {h.statut === "en_attente" ? "EN ATTENTE" : h.statut === "resolu_faveur" ? "EN TA FAVEUR" : "REJETÉ"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        ARBITRAGE SOUS 24H OUVRÉES
      </div>
    </div>
  );
}
