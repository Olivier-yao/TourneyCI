"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Star } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { classementOrganisateurs, type OrganisateurClasse } from "@/lib/mockClassementOrganisateurs";

export default function ClassementOrganisateursPage() {
  const router = useRouter();
  const [classement, setClassement] = useState<OrganisateurClasse[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClassement(classementOrganisateurs());
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Meilleurs organisateurs" onRetour={() => router.push("/profil")} />
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Classés selon le nombre de participants rassemblés, la note moyenne, et le nombre de tournois annulés ou
        sans inscrits.
      </p>

      <div className="flex flex-col gap-2">
        {classement.map((o, i) => (
          <div
            key={o.nom}
            className="flex items-center gap-3 p-3.5"
            style={{
              borderRadius: "var(--ds-radius-md)",
              background: o.moi ? "var(--ds-accent-900)" : "var(--ds-surface)",
              border: `1px solid ${o.moi ? "var(--ds-accent)" : "var(--ds-border)"}`,
            }}
          >
            <span className="w-6 text-sm text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{o.nom}</span>
                {o.certifie && <ShieldCheck size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />}
              </div>
              <div className="text-xs" style={{ color: "var(--ds-muted)" }}>
                {o.tournoisOrganises} tournoi{o.tournoisOrganises > 1 ? "s" : ""}
                {o.tournoisFloppes > 0 ? ` · ${o.tournoisFloppes} annulé${o.tournoisFloppes > 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              <Star size={12} strokeWidth={2} fill="currentColor" />
              {o.note.toFixed(1)}
            </div>
            <div className="text-sm font-medium shrink-0" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
              {o.participantsTotal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
