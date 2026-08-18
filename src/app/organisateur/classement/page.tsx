"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, ShieldCheck, Star } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { classementOrganisateurs, type OrganisateurClasse } from "@/lib/mockClassementOrganisateurs";
import { photoOrganisateur } from "@/lib/mockOrganisateur";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

export default function ClassementOrganisateursPage() {
  const router = useRouter();
  const [classement, setClassement] = useState<OrganisateurClasse[]>([]);
  // Mock mono-appareil : on ne connaît la photo que de "moi", pas des
  // autres organisateurs (pas de vrai registre partagé tant qu'il n'y a
  // pas de backend) — les autres lignes restent aux initiales.
  const [maPhoto, setMaPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClassement(classementOrganisateurs());
    setMaPhoto(photoOrganisateur());
  }, []);

  const premier = classement[0];
  const reste = classement.slice(1);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4 pb-8" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Meilleurs organisateurs" onRetour={() => router.back()} />

      {premier && (
        <Link
          href={`/organisateur/profil/${encodeURIComponent(premier.nom)}`}
          className={`relative overflow-hidden flex items-center gap-3.5 p-4 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-lg)", background: "radial-gradient(120% 150% at 50% 0%, var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
        >
          <div className="relative shrink-0">
            <div
              className="flex items-center justify-center w-14 h-14 text-lg font-semibold overflow-hidden"
              style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-accent-800)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)", boxShadow: "0 0 26px color-mix(in srgb, var(--ds-accent) 30%, transparent)" }}
            >
              {premier.moi && maPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={maPhoto} alt={premier.nom} className="w-full h-full object-cover" />
              ) : (
                initiales(premier.nom)
              )}
            </div>
            {premier.certifie && (
              <div
                className="absolute -right-1 -bottom-1 flex items-center justify-center w-5 h-5"
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-700)", border: "2px solid var(--ds-bg)", color: "var(--ds-accent-100)" }}
              >
                <ShieldCheck size={10} strokeWidth={2.5} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Crown size={14} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
              <span className="text-base font-medium truncate">{premier.nom}</span>
            </div>
            <div className="mt-0.5 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {premier.tournoisOrganises} TOURNOI{premier.tournoisOrganises > 1 ? "S" : ""} · {premier.tournoisFloppes} ANNULÉ{premier.tournoisFloppes > 1 ? "S" : ""}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              <Star size={12} strokeWidth={2} fill="currentColor" style={{ color: "var(--ds-accent-400)" }} />
              {premier.note.toFixed(1)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
              {premier.participantsTotal}
            </div>
            <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              PARTICIPANTS
            </div>
          </div>
        </Link>
      )}

      <div className="flex flex-col gap-1">
        {reste.map((o, i) => (
          <Link
            key={o.nom}
            href={`/organisateur/profil/${encodeURIComponent(o.nom)}`}
            className={`flex items-center gap-3 p-2.5 -mx-2.5 ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-md)",
              background: o.moi ? "var(--ds-accent-900)" : "transparent",
              boxShadow: o.moi ? "0 0 0 1px var(--ds-accent-600)" : "none",
            }}
          >
            <span className="w-5 text-sm text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {i + 2}
            </span>
            <div className="relative shrink-0">
              <div
                className="flex items-center justify-center w-8 h-8 text-[11px] font-medium overflow-hidden"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", color: "var(--ds-text)" }}
              >
                {o.moi && maPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={maPhoto} alt={o.nom} className="w-full h-full object-cover" />
                ) : (
                  initiales(o.nom)
                )}
              </div>
              {o.certifie && (
                <div
                  className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center w-3.5 h-3.5"
                  style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-700)", border: "1.5px solid var(--ds-bg)", color: "var(--ds-accent-100)" }}
                >
                  <ShieldCheck size={7} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{o.nom}</div>
              <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {o.tournoisOrganises} tournoi{o.tournoisOrganises > 1 ? "s" : ""}
                {o.tournoisFloppes > 0 ? ` · ${o.tournoisFloppes} annulé${o.tournoisFloppes > 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              <Star size={11} strokeWidth={2} fill="currentColor" />
              {o.note.toFixed(1)}
            </div>
            <div className="w-10 text-right text-sm font-medium shrink-0" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
              {o.participantsTotal}
            </div>
          </Link>
        ))}
      </div>

      <p className="text-[9px] leading-relaxed mt-auto pt-3" style={{ borderTop: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        SCORE = PARTICIPANTS RASSEMBLÉS + NOTE MOYENNE − TOURNOIS ANNULÉS OU SANS INSCRIT
      </p>
    </div>
  );
}
