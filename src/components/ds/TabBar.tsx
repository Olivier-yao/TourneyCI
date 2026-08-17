"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Megaphone, BarChart3, User } from "lucide-react";
import { useLangue } from "@/lib/i18n/useLangue";

const ONGLETS = [
  { id: "accueil", cle: "tab.accueil", href: "/accueil", Icone: Home },
  { id: "tournois", cle: "tab.tournois", href: "/tournois", Icone: Trophy },
  { id: "organisateur", cle: "tab.organisateur", href: "/organisateur", Icone: Megaphone },
  { id: "classement", cle: "tab.classement", href: "/classement", Icone: BarChart3 },
  { id: "profil", cle: "tab.profil", href: "/profil", Icone: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { t } = useLangue();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-around pt-3.5 pb-5"
      style={{ borderTop: "1px solid var(--ds-border)", background: "var(--ds-bg)" }}
    >
      {ONGLETS.map(({ id, cle, href, Icone }) => {
        const estActif = pathname === href;
        return (
          <Link
            key={id}
            href={href}
            className="flex flex-col items-center gap-1"
            style={{ color: estActif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
          >
            <Icone size={17} strokeWidth={2} />
            <span className="text-[9px]" style={{ fontFamily: "var(--ds-font-body)" }}>
              {t(cle)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
