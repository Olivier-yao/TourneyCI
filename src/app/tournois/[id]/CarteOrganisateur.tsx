"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { classementOrganisateurs } from "@/lib/mockClassementOrganisateurs";

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

/** Carte organisateur affichée sur la fiche tournoi en direct — nom, sceau de
 * certification, note moyenne, réutilise les données réelles du classement
 * organisateurs plutôt qu'un score inventé. Partagée entre la fiche tournoi
 * standard et la fiche direct spectateur (feuille infos). */
export function CarteOrganisateur({ nom }: { nom: string }) {
  const [info, setInfo] = useState<{ certifie: boolean; note: number } | undefined>(undefined);

  useEffect(() => {
    classementOrganisateurs().then((classement) => {
      const entree = classement.find((o) => o.nom === nom);
      setInfo(entree ? { certifie: entree.certifie, note: entree.note } : undefined);
    });
  }, [nom]);

  return (
    <Link
      href={`/organisateur/profil/${encodeURIComponent(nom)}`}
      className="flex items-center gap-2.5 p-[11px]"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
    >
      <div className="relative shrink-0">
        <div
          className="flex items-center justify-center w-[34px] h-[34px] text-[11px] font-medium"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
        >
          {initiales(nom)}
        </div>
        {info?.certifie && (
          <div
            className="absolute -right-[3px] -bottom-[3px] flex items-center justify-center"
            style={{ width: 15, height: 15, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-700)", border: "1.5px solid var(--ds-surface)" }}
          >
            <ShieldCheck size={8} strokeWidth={2} style={{ color: "var(--ds-accent-100, var(--ds-accent-300))" }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{nom}</div>
        <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {info?.certifie ? "CERTIFIÉ · " : ""}NOTE {info ? info.note.toFixed(1) : "–"}
        </div>
      </div>
      <ChevronRight size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
    </Link>
  );
}
