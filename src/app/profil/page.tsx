"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Settings, Wallet, History, Ticket, Bookmark, ShieldCheck } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { Button } from "@/components/ds/Button";
import { lireProfil, estActif } from "@/lib/mockProfil";
import { BadgeActif } from "@/components/ds/BadgeActif";
import { lireSolde } from "@/lib/mockWallet";
import { mesInscriptions } from "@/lib/mockInscriptions";
import { mesFavoris } from "@/lib/mockFavoris";
import { tournoiParId, estTermine, mesTournoisOrganises } from "@/lib/mockTournaments";
import { estCertifie } from "@/lib/mockOrganisateur";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function ProfilPage() {
  const connecte = useExigerConnexion();
  const [profil] = useState(lireProfil);
  const [solde, setSolde] = useState(0);
  const [compteurs, setCompteurs] = useState({ historique: 0, inscriptions: 0, favoris: 0 });
  const [organisateur, setOrganisateur] = useState<{ estOrganisateur: boolean; certifie: boolean }>({
    estOrganisateur: false,
    certifie: false,
  });
  const winrate = Math.round((profil.victoires / profil.matchsJoues) * 100);

  useEffect(() => {
    const inscriptions = mesInscriptions();
    const historique = inscriptions.filter((i) => {
      const t = tournoiParId(i.tournoiId);
      return t && estTermine(t.id);
    }).length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolde(lireSolde());
    setCompteurs({ historique, inscriptions: inscriptions.length, favoris: mesFavoris().length });
    setOrganisateur({ estOrganisateur: mesTournoisOrganises().length > 0, certifie: estCertifie() });
  }, []);

  const menu = [
    { href: "/profil/solde", icone: Wallet, label: "Solde & TourneyCard", valeur: null as number | null },
    { href: "/profil/historique", icone: History, label: "Historique de tournois", valeur: compteurs.historique },
    { href: "/profil/inscriptions", icone: Ticket, label: "Mes inscriptions", valeur: compteurs.inscriptions },
    { href: "/favoris", icone: Bookmark, label: "Favoris", valeur: compteurs.favoris },
  ];

  if (!connecte) return null;

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
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px]"
                style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
              >
                {profil.rang} · #{profil.rangNational} national
              </span>
              {estActif(profil.matchsJoues) && <BadgeActif />}
              {organisateur.estOrganisateur && organisateur.certifie && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
                  style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
                >
                  <ShieldCheck size={11} strokeWidth={2} />
                  Organisateur certifié
                </span>
              )}
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

      <div className="px-5">
        <div
          className="p-4"
          style={{
            borderRadius: "var(--ds-radius-lg)",
            background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))",
            border: "1px solid var(--ds-border-strong)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                Mon solde
              </div>
              <div className="mt-1 text-2xl font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
                {solde.toLocaleString("fr-FR")} F
              </div>
            </div>
            <div className="w-11 h-7" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-600)", border: "1px solid var(--ds-accent)" }} />
          </div>
          <div className="mt-3.5 flex gap-2">
            <Link href="/profil/solde/recharger" className="flex-1">
              <Button variante="secondary" bloc>Recharger</Button>
            </Link>
            <Link href="/profil/solde/retirer" className="flex-1">
              <Button variante="secondary" bloc>Retirer</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 grid grid-cols-3 gap-2 mt-4">
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

      <div className="px-5 pt-6 pb-24 flex-1 flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Mon compte
        </div>
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 py-3"
            style={{ borderBottom: "1px solid var(--ds-border)" }}
          >
            <item.icone size={18} style={{ color: "var(--ds-accent)" }} />
            <span className="flex-1 text-sm">{item.label}</span>
            {item.valeur !== null && (
              <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {item.valeur}
              </span>
            )}
            <ChevronRight size={15} style={{ color: "var(--ds-muted)" }} />
          </Link>
        ))}

        <Link
          href="/classement"
          className="flex items-center justify-between p-3 mt-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
            Voir le classement complet
          </span>
          <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
        </Link>

        {!organisateur.certifie && (
          <Link
            href="/verification-identite"
            className="flex items-center gap-2.5 p-3 mt-2"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent)" }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            <span className="flex-1 text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
              Vérifie ton identité pour pouvoir retirer tes gains
            </span>
            <ChevronRight size={15} style={{ color: "var(--ds-accent-300)" }} />
          </Link>
        )}

        {organisateur.estOrganisateur && (
          <Link
            href="/organisateur/classement"
            className="flex items-center justify-between p-3 mt-2"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
              Classement des organisateurs
            </span>
            <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
          </Link>
        )}
      </div>

      <TabBar />
    </div>
  );
}
