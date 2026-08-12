"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { mesTournoisOrganises } from "@/lib/mockTournaments";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function OrganisateurPage() {
  const connecte = useExigerConnexion();
  const [tournoisOrganises] = useState(mesTournoisOrganises);

  if (!connecte) return null;

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div
        className="text-2xl"
        style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
      >
        Organisateur
      </div>

      <Link href="/organisateur/nouveau">
        <Button variante="primary" bloc>
          <Plus size={17} strokeWidth={2} />
          Créer un tournoi
        </Button>
      </Link>

      <Link
        href="/organisateur/classement"
        className="flex items-center justify-between p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
          Classement des organisateurs
        </span>
        <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
      </Link>

      <Link
        href="/coup-de-coeur"
        className="flex items-center justify-between p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
          <Heart size={14} strokeWidth={2} />
          Coup de cœur
        </span>
        <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
      </Link>

      {tournoisOrganises.length === 0 ? (
        <EmptyState titre="Aucun tournoi organisé" description="Crée ton premier tournoi pour le voir apparaître ici." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-base font-medium">Mes tournois</div>
          {tournoisOrganises.map((t) => (
            <Link key={t.id} href={`/tournois/${t.id}`}>
              <div
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.titre}</div>
                  <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <TabBar />
    </div>
  );
}
