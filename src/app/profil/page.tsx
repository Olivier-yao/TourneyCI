"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Settings } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { HISTORIQUE, lireProfil } from "@/lib/mockProfil";

export default function ProfilPage() {
  const [profil] = useState(lireProfil);
  const winrate = Math.round((profil.victoires / profil.matchsJoues) * 100);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div
        className="px-5 pt-7 pb-6 flex items-center justify-between gap-4"
        style={{
          background: "radial-gradient(120% 100% at 20% 0%, var(--ds-surface), var(--ds-bg))",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold shrink-0 overflow-hidden"
            style={{ background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent-600)", color: "var(--ds-accent-300)" }}
          >
            {profil.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profil.photoUrl} alt={profil.pseudo} className="w-full h-full object-cover" />
            ) : (
              profil.pseudo
                .split(" ")
                .map((m) => m[0])
                .join("")
                .toUpperCase()
            )}
          </div>
          <div>
            <div className="text-xl font-medium">{profil.pseudo}</div>
            <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              @{profil.pseudo.toLowerCase().replace(/[^a-z]/g, "")} · {profil.ville}
            </div>
            <div
              className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px]"
              style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
            >
              {profil.rang} · #{profil.rangNational} national
            </div>
          </div>
        </div>
        <Link
          href="/profil/parametres"
          className="flex items-center justify-center w-10 h-10 shrink-0"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          aria-label="Modifier le profil"
        >
          <Settings size={18} strokeWidth={2} />
        </Link>
      </div>

      <div className="px-5 grid grid-cols-3 gap-2 -mt-2">
        {[
          { label: "matchs", valeur: profil.matchsJoues },
          { label: "victoires", valeur: profil.victoires },
          { label: "winrate", valeur: `${winrate}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <div className="text-xl" style={{ fontFamily: "var(--ds-font-mono)" }}>
              {stat.valeur}
            </div>
            <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pt-6 flex-1 flex flex-col gap-2.5">
        <div className="text-base font-medium">Historique</div>
        {HISTORIQUE.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-3 py-2"
            style={{ borderBottom: "1px solid var(--ds-border)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: h.resultat === "victoire" ? "var(--ds-accent-300)" : "var(--ds-danger)" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">
                {h.resultat === "victoire" ? "Victoire" : "Défaite"} vs {h.adversaire}
              </div>
              <div className="text-xs" style={{ color: "var(--ds-muted)" }}>
                {h.tournoi} · {h.dateLabel}
              </div>
            </div>
            <div className="text-sm" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}>
              {h.score}
            </div>
          </div>
        ))}

        <Link
          href="/classement"
          className="flex items-center justify-between p-3 mt-2"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
            Voir le classement complet
          </span>
          <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
        </Link>

        <Link
          href="/favoris"
          className="flex items-center justify-between p-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
            Mes tournois favoris
          </span>
          <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
        </Link>
      </div>

      <TabBar />
    </div>
  );
}
