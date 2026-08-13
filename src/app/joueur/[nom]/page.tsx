"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flame } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { lireProfil, estActif } from "@/lib/mockProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type StatsJoueur = { matchsJoues: number; victoires: number; photoUrl?: string; actif: boolean };

/** Statistiques dérivées de façon déterministe pour un joueur qui n'est pas
 * l'utilisateur courant : ce mock ne conserve de vraies statistiques que
 * pour le profil de l'appareil (pas de backend multi-comptes). */
function statsDerivees(nom: string): StatsJoueur {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0;
  const matchsJoues = 18 + (h % 140);
  const tauxVictoire = 0.3 + ((h >>> 4) % 40) / 100;
  const victoires = Math.round(matchsJoues * tauxVictoire);
  return { matchsJoues, victoires, actif: estActif(matchsJoues) };
}

export default function ProfilJoueurPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ nom: string }>();
  const router = useRouter();
  const nom = decodeURIComponent(params.nom);
  const [stats, setStats] = useState<StatsJoueur | null>(null);

  useEffect(() => {
    const profil = lireProfil();
    const donnees =
      nom === profil.pseudo
        ? { matchsJoues: profil.matchsJoues, victoires: profil.victoires, photoUrl: profil.photoUrl, actif: estActif(profil.matchsJoues) }
        : statsDerivees(nom);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(donnees);
  }, [nom]);

  if (!connecte || !stats) return null;

  const winrate = stats.matchsJoues > 0 ? Math.round((stats.victoires / stats.matchsJoues) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
        <div className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          Profil joueur
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar initiales={nom.slice(0, 2).toUpperCase()} photoUrl={stats.photoUrl} taille={72} />
        <div className="flex items-center gap-2">
          <div className="text-lg font-medium">{nom}</div>
          {stats.actif && <Flame size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} aria-label="Membre actif" />}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "matchs", valeur: stats.matchsJoues },
          { label: "victoires", valeur: stats.victoires },
          { label: "winrate", valeur: `${winrate}%` },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <div className="text-lg font-semibold" style={{ fontFamily: "var(--ds-font-mono)" }}>{s.valeur}</div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {stats.actif && (
        <div className="flex items-center gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}>
          <Flame size={15} strokeWidth={2} />
          <span className="text-sm font-medium">Membre actif</span>
        </div>
      )}
    </div>
  );
}
