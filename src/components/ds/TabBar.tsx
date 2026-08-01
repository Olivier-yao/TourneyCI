"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, BarChart3, User } from "lucide-react";

const ONGLETS = [
  { id: "accueil", label: "Accueil", href: "/accueil", Icone: Home },
  { id: "tournois", label: "Tournois", href: "/tournois", Icone: Trophy },
  { id: "classement", label: "Classement", href: "/classement", Icone: BarChart3 },
  { id: "profil", label: "Profil", href: "/profil", Icone: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-around pt-3.5 pb-5"
      style={{ borderTop: "1px solid var(--ds-border)", background: "var(--ds-bg)" }}
    >
      {ONGLETS.map(({ id, label, href, Icone }) => {
        const estActif = pathname === href;
        return (
          <Link
            key={id}
            href={href}
            className="flex flex-col items-center gap-1"
            style={{ color: estActif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
          >
            <Icone size={20} strokeWidth={2} />
            <span className="text-[10px]" style={{ fontFamily: "var(--ds-font-body)" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
