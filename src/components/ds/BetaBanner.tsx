"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const CLE_BANNIERE_MASQUEE = "tourney-beta-banniere-masquee";

export function BetaBanner() {
  const pathname = usePathname();
  const [masquee, setMasquee] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMasquee(localStorage.getItem(CLE_BANNIERE_MASQUEE) === "1");
  }, []);

  if (pathname === "/" || masquee) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[12px]"
      style={{ background: "var(--ds-accent-900)", color: "var(--ds-accent-300)", borderBottom: "1px solid var(--ds-accent-600)" }}
    >
      <span className="flex-1">
        Version bêta — les données (tournois, inscriptions, solde) sont stockées uniquement sur cet appareil, pas de compte partagé entre téléphones.
      </span>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(CLE_BANNIERE_MASQUEE, "1");
          setMasquee(true);
        }}
        className="flex items-center justify-center w-6 h-6 shrink-0 cursor-pointer"
        aria-label="Masquer ce message"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
