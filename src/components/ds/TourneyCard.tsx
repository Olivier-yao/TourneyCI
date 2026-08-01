"use client";

import type { Profil } from "@/lib/mockProfil";

function formatMontant(montant: number): string {
  return `${montant.toLocaleString("fr-FR")} F`;
}

export function TourneyCard({ profil, solde }: { profil: Profil; solde: number }) {
  const numeroMasque = `5241 •••• •••• ${(profil.pseudo.length * 137 + 812).toString().slice(-4).padStart(4, "0")}`;

  return (
    <div
      className="relative p-5 overflow-hidden"
      style={{
        borderRadius: "var(--ds-radius-lg)",
        background: "linear-gradient(135deg, var(--ds-accent-600), var(--ds-surface) 70%)",
        boxShadow: "var(--ds-shadow-md)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)",
          backgroundSize: "26px 100%",
        }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div
            className="text-[11px] tracking-[.16em] uppercase"
            style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
          >
            TourneyCard
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            GAMER · {profil.rang.toUpperCase()}
          </div>
        </div>
        <div
          className="w-[42px] h-[30px]"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "linear-gradient(var(--ds-accent-300), var(--ds-accent-600))" }}
        />
      </div>

      <div className="relative mt-6 flex items-center gap-3.5">
        <div
          className="w-[52px] h-[52px] shrink-0 overflow-hidden flex items-center justify-center text-[10px] text-center"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border-strong)", color: "var(--ds-muted)" }}
        >
          {profil.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profil.photoUrl} alt={profil.pseudo} className="w-full h-full object-cover" />
          ) : (
            profil.pseudo.split(" ").map((m) => m[0]).join("").toUpperCase()
          )}
        </div>
        <div>
          <div className="text-base font-medium uppercase">{profil.pseudo}</div>
          <div className="text-[13px] tracking-[.1em]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {numeroMasque}
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex items-end justify-between">
        <div>
          <div
            className="text-[10px] tracking-[.1em] uppercase"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Solde disponible
          </div>
          <div
            className="text-2xl font-medium"
            style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
          >
            {formatMontant(solde)}
          </div>
        </div>
        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          EXP 08/29
        </div>
      </div>
    </div>
  );
}
