"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Users, Radio, Heart } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { symboleParId } from "@/lib/mockSymboles";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois, cashPrizeAffiche, type Tournoi } from "@/lib/mockTournaments";
import { matchsDePlusieursTournois, type MatchTournoi } from "@/lib/mockBracket";
import { nbManchesBRDePlusieursTournois } from "@/lib/mockBattleRoyale";
import { compterAvisPlusieurs } from "@/lib/mockAvis";
import { spectateursReelsPlusieurs } from "@/lib/mockChat";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";

const RAFRAICHISSEMENT_MS = 60_000;

type Tri = "cashprize" | "participants" | "recent";

const TRIS: { id: Tri; label: string }[] = [
  { id: "cashprize", label: "Cash prize" },
  { id: "participants", label: "Participants" },
  { id: "recent", label: "Récent" },
];

function nomRonde(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Tour ${round}`;
}

function infosDirect(tournoi: Tournoi, matches: MatchTournoi[], nbManchesBR: number): { score: string; phase: string } {
  // Fenêtre de grâce de 2 min après clôture (cf. estEnDirect côté serveur) :
  // le tournoi reste dans cette liste le temps que le vainqueur soit visible,
  // mais ce n'est plus un match en cours — un score "en cours" serait faux.
  if (tournoi.termine) {
    if (tournoi.type === "battle_royale") return { score: "Terminé", phase: "Résultats" };
    const finale = [...matches].sort((a, b) => b.round - a.round)[0];
    return { score: finale ? `${finale.score1 ?? 0} - ${finale.score2 ?? 0}` : "—", phase: "Terminé" };
  }
  if (tournoi.type === "battle_royale") {
    return { score: nbManchesBR > 0 ? `Manche ${nbManchesBR}` : "—", phase: "Battle Royale" };
  }
  const enCours = matches.find((m) => m.statut === "en_cours");
  if (enCours) {
    const totalRounds = Math.max(...matches.map((m) => m.round), enCours.round);
    return { score: `${enCours.score1 ?? 0} - ${enCours.score2 ?? 0}`, phase: nomRonde(enCours.round, totalRounds) };
  }
  return { score: "—", phase: tournoi.format };
}

export default function EnDirectPage() {
  const connecte = useExigerConnexion();
  const [tri, setTri] = useState<Tri>("cashprize");
  const [tousLesTournoisState, setTousLesTournoisState] = useState<Tournoi[]>([]);
  const [matchsParTournoi, setMatchsParTournoi] = useState<Record<string, MatchTournoi[]>>({});
  const [coeursParTournoi, setCoeursParTournoi] = useState<Record<string, number>>({});
  const [manchesBRParTournoi, setManchesBRParTournoi] = useState<Record<string, number>>({});
  const [spectateursParTournoi, setSpectateursParTournoi] = useState<Record<string, number>>({});

  useEffect(() => {
    // État dépendant du localStorage : liste vide au premier rendu serveur,
    // synchronisée côté client une fois montée (évite un mismatch d'hydratation).
    async function charger() {
       
      setTousLesTournoisState(await tousLesTournois());
    }
    charger();
    const id = setInterval(charger, RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, []);

  // Bascule en_direct/termine et disparition (fenêtre de grâce de 2 min
  // après clôture, cf. estEnDirect côté serveur) : sans ça, cette liste ne
  // reflète l'état réel qu'au chargement de la page.
  useRealtimeRefetch(
    [{ table: "tournois", event: "*" }],
    () => { tousLesTournois().then(setTousLesTournoisState); },
  );

  useEffect(() => {
    async function charger() {
      const ids = tousLesTournoisState.filter((t) => t.enDirect && t.type !== "battle_royale").map((t) => t.id);
      setMatchsParTournoi(await matchsDePlusieursTournois(ids));
    }
    charger();
  }, [tousLesTournoisState]);

  useEffect(() => {
    async function charger() {
      const ids = tousLesTournoisState.filter((t) => t.enDirect).map((t) => t.id);
      const comptes = await compterAvisPlusieurs(ids);
      setCoeursParTournoi(Object.fromEntries(ids.map((id) => [id, comptes[id]?.coeurs ?? 0])));
    }
    charger();
  }, [tousLesTournoisState]);

  useEffect(() => {
    async function charger() {
      const ids = tousLesTournoisState.filter((t) => t.enDirect && t.type === "battle_royale").map((t) => t.id);
      setManchesBRParTournoi(await nbManchesBRDePlusieursTournois(ids));
    }
    charger();
  }, [tousLesTournoisState]);

  useEffect(() => {
    const ids = tousLesTournoisState.filter((t) => t.enDirect).map((t) => t.id);
    spectateursReelsPlusieurs(ids).then(setSpectateursParTournoi);
  }, [tousLesTournoisState]);

  const enDirect = useMemo(() => {
    const liste = tousLesTournoisState.filter((t) => t.enDirect);
    if (tri === "cashprize") return [...liste].sort((a, b) => cashPrizeAffiche(b) - cashPrizeAffiche(a));
    if (tri === "participants") return [...liste].sort((a, b) => b.placesInscrites - a.placesInscrites);
    return [...liste].reverse();
  }, [tri, tousLesTournoisState]);

  if (!connecte) return null;

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <Link href="/accueil" style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </Link>
        <div className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          En direct
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
          {TRIS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTri(t.id)}
              className="flex-1 h-8 text-[12px] font-semibold cursor-pointer"
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: tri === t.id ? "var(--ds-accent-900)" : "transparent",
                color: tri === t.id ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {enDirect.length === 0 ? (
          <EmptyState titre="Aucun tournoi en direct" description="Reviens plus tard pour suivre les tournois en cours." />
        ) : (
          <div className="flex flex-col gap-2">
            {enDirect.map((t) => {
              const { score, phase } = infosDirect(t, matchsParTournoi[t.id] ?? [], manchesBRParTournoi[t.id] ?? 0);
              const symbole = symboleParId(t.symboleId);
              const IconeSymbole = symbole.icone;
              return (
                <Link key={t.id} href={`/tournois/${t.id}`}>
                  <div
                    className="flex items-center gap-3 p-3"
                    style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0 w-11 h-11"
                      style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)" }}
                      title={symbole.label}
                    >
                      <IconeSymbole size={20} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-[5px] h-[5px] rounded-full shrink-0 ${t.termine ? "" : "animate-pulse"}`}
                          style={{ background: t.termine ? "var(--ds-muted)" : "var(--ds-accent-300)" }}
                        />
                        <span className="text-sm font-medium truncate">{t.titre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        <span>{t.jeuLabel}</span>
                        <span>·</span>
                        <span>{phase}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users size={11} strokeWidth={2} />
                          {spectateursParTournoi[t.id] ?? 0}
                        </span>
                        {(coeursParTournoi[t.id] ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart size={11} strokeWidth={2} />
                            {coeursParTournoi[t.id]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span
                        className="flex items-center gap-1 text-sm font-semibold"
                        style={{ color: t.termine ? "var(--ds-muted)" : "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
                      >
                        {!t.termine && <Radio size={11} strokeWidth={2} />}
                        {score}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        {formatXof(cashPrizeAffiche(t))}
                      </span>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
