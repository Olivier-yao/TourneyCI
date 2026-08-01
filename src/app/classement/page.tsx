"use client";

import { AppBar } from "@/components/ds/AppBar";
import { TabBar } from "@/components/ds/TabBar";
import { Classement } from "@/components/ds/Classement";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function ClassementPage() {
  const connecte = useExigerConnexion();
  if (!connecte) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="px-5 pt-5">
        <AppBar titre="Classement" />
      </div>
      <div className="px-5 pt-2 pb-24 flex-1">
        <Classement />
      </div>
      <TabBar />
    </div>
  );
}
