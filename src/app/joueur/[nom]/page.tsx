"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { BadgePalier } from "@/components/ds/Palier";
import { Modal } from "@/components/ds/Modal";
import { PRESS } from "@/components/ds/Button";
import { lireProfil, estActif, palierActuel, palierParPoints, mesPointsCumules } from "@/lib/mockProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type ResultatMatch = "V" | "D";
type EntreePalmares = { rang: string; nom: string; meta: string };

type StatsJoueur = {
  matchsJoues: number;
  victoires: number;
  photoUrl?: string;
  actif: boolean;
  ville: string;
  tag: string;
  points: number;
  rangNational: number;
  form: ResultatMatch[];
  palmares: EntreePalmares[];
};

const VILLES_DEMO = ["Abidjan", "Yopougon", "Cocody", "Bouaké", "Yamoussoukro"];
const TOURNOIS_DEMO = ["Abidjan Cup", "Ligue Yopougon", "Bouaké Open", "Cocody Series", "Yamoussoukro Clash"];

function hashSeed(valeur: string): number {
  let h = 0;
  for (let i = 0; i < valeur.length; i++) h = (h * 31 + valeur.charCodeAt(i)) >>> 0;
  return h;
}

/** Forme et palmarès sont toujours dérivés de façon déterministe (aucun
 * historique de match réel n'est conservé pour "moi" non plus) ; seules les
 * statistiques cœur (matchs/victoires/ville/points) sont réelles pour "moi". */
function derivesForme(nom: string): ResultatMatch[] {
  const h = hashSeed(`${nom}-forme`);
  return Array.from({ length: 8 }, (_, i) => (((h >>> i) & 1) === 1 ? "V" : "D"));
}

function derivesPalmares(nom: string): EntreePalmares[] {
  const h = hashSeed(`${nom}-palmares`);
  return Array.from({ length: 3 }, (_, i) => {
    const rangNum = 1 + ((h >>> (i * 3)) % 2);
    const joueurs = 16 + ((h >>> (i * 5)) % 5) * 16;
    return {
      rang: rangNum === 1 ? "1er" : "2e",
      nom: `${TOURNOIS_DEMO[(h + i * 7) % TOURNOIS_DEMO.length]} #${1 + ((h >>> (i * 2)) % 20)}`,
      meta: `${joueurs} JOUEURS`,
    };
  });
}

function statsDerivees(nom: string): StatsJoueur {
  const h = hashSeed(nom);
  const matchsJoues = 18 + (h % 140);
  const tauxVictoire = 0.3 + ((h >>> 4) % 40) / 100;
  const victoires = Math.round(matchsJoues * tauxVictoire);
  const points = 100 + (h % 2400);
  return {
    matchsJoues,
    victoires,
    actif: estActif(matchsJoues),
    ville: VILLES_DEMO[h % VILLES_DEMO.length],
    tag: nom.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, ""),
    points,
    rangNational: 1 + (h % 200),
    form: derivesForme(nom),
    palmares: derivesPalmares(nom),
  };
}

export default function ProfilJoueurPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ nom: string }>();
  const router = useRouter();
  const nom = decodeURIComponent(params.nom);
  const [stats, setStats] = useState<StatsJoueur | null>(null);
  const [signale, setSignale] = useState(false);
  const [modaleSignalement, setModaleSignalement] = useState(false);
  const [modaleInvitation, setModaleInvitation] = useState(false);

  useEffect(() => {
    const profil = lireProfil();
    const derive = statsDerivees(nom);
    const donnees: StatsJoueur =
      nom === profil.pseudo
        ? {
            ...derive,
            matchsJoues: profil.matchsJoues,
            victoires: profil.victoires,
            photoUrl: profil.photoUrl,
            actif: estActif(profil.matchsJoues),
            ville: profil.ville,
            points: mesPointsCumules(),
            rangNational: profil.rangNational,
          }
        : derive;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(donnees);
  }, [nom]);

  if (!connecte || !stats) return null;

  const winrate = stats.matchsJoues > 0 ? Math.round((stats.victoires / stats.matchsJoues) * 100) : 0;
  const cestMoi = nom === lireProfil().pseudo;
  const palier = cestMoi ? palierActuel(stats.matchsJoues, stats.points) : palierParPoints(stats.points);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="relative" style={{ height: 132 }}>
        <div
          className="w-full h-full"
          style={{ background: "radial-gradient(130% 160% at 24% 0%, var(--ds-accent-900), var(--ds-bg))" }}
        />
        <button
          type="button"
          onClick={() => router.back()}
          className={`absolute top-[42px] left-[18px] flex items-center justify-center w-8 h-8 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        {!cestMoi && (
          <button
            type="button"
            onClick={() => setModaleSignalement(true)}
            className={`absolute top-[42px] right-[18px] flex items-center justify-center w-8 h-8 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
            aria-label="Options"
          >
            <MoreHorizontal size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="px-5 -mt-8 relative flex-1 flex flex-col gap-3.5">
        <div className="flex items-end gap-3.5">
          <Avatar initiales={nom.slice(0, 2).toUpperCase()} photoUrl={stats.photoUrl} taille={68} />
          <div className="pb-1 min-w-0">
            <div className="text-xl truncate" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              {nom}
            </div>
            <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              @{stats.tag} · {stats.ville.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1"
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
          >
            <BadgePalier palier={palier} taille="sm" />
            <span className="text-[10px] tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
              {palier.nom.toUpperCase()}
            </span>
          </div>
          <span
            className="px-2.5 py-1 text-[10px]"
            style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            #{stats.rangNational} NATIONAL
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "matchs", valeur: stats.matchsJoues, accent: false },
            { label: "victoires", valeur: stats.victoires, accent: true },
            { label: "winrate", valeur: `${winrate}%`, accent: false },
          ].map((s) => (
            <div key={s.label} className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
              <div className="text-lg" style={{ color: s.accent ? "var(--ds-accent-300)" : "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}>{s.valeur}</div>
              <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="p-3.5 flex flex-col gap-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Forme · 8 derniers matchs
          </div>
          <div className="flex gap-1.5">
            {stats.form.map((r, i) => (
              <div
                key={i}
                className="flex-1 flex items-center justify-center"
                style={{
                  height: 26,
                  borderRadius: "var(--ds-radius-sm)",
                  background: r === "V" ? "var(--ds-accent-800)" : "transparent",
                  border: r === "V" ? "none" : "1px solid var(--ds-border)",
                  color: r === "V" ? "var(--ds-accent-300)" : "var(--ds-muted)",
                  fontFamily: "var(--ds-font-mono)",
                  fontSize: 10,
                }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Palmarès
          </div>
          {stats.palmares.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
              <div
                className="w-[30px] h-[30px] flex items-center justify-center text-[11px]"
                style={{
                  borderRadius: "var(--ds-radius-sm)",
                  background: p.rang === "1er" ? "var(--ds-accent-800)" : "var(--ds-surface-2)",
                  color: p.rang === "1er" ? "var(--ds-accent-300)" : "var(--ds-muted)",
                  fontFamily: "var(--ds-font-mono)",
                }}
              >
                {p.rang}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{p.nom}</div>
                <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{p.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!cestMoi && (
        <div className="px-5 py-4 flex gap-2.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
          <button
            type="button"
            onClick={() => setModaleSignalement(true)}
            disabled={signale}
            className={`flex-1 h-11 text-sm font-medium disabled:opacity-45 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            {signale ? "Signalé" : "Signaler"}
          </button>
          <button
            type="button"
            onClick={() => setModaleInvitation(true)}
            className={`flex-[2] h-11 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            Inviter dans mon équipe
          </button>
        </div>
      )}

      <Modal ouvert={modaleSignalement} titre="Signaler ce joueur" onFermer={() => setModaleSignalement(false)}>
        <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
          {signale ? (
            <p className="text-sm">Signalement envoyé, merci. Notre équipe va l&apos;examiner.</p>
          ) : (
            <>
              <p className="text-sm">Signale ce profil s&apos;il enfreint les règles de la plateforme (triche, comportement toxique, usurpation...).</p>
              <button
                type="button"
                onClick={() => { setSignale(true); setModaleSignalement(false); }}
                className={`h-10 text-sm font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
              >
                Confirmer le signalement
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal ouvert={modaleInvitation} titre="Inviter dans mon équipe" onFermer={() => setModaleInvitation(false)}>
        <p className="text-sm not-italic" style={{ whiteSpace: "normal" }}>
          Pour inviter {nom} dans une équipe, ouvre le tournoi Battle Royale concerné puis partage le lien d&apos;invitation depuis la gestion de ton équipe.
        </p>
      </Modal>
    </div>
  );
}
