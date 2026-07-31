"use client";

import { AppBar } from "@/components/ds/AppBar";
import { TabBar } from "@/components/ds/TabBar";
import { Classement } from "@/components/ds/Classement";

export default function ClassementPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="px-5 pt-5">
        <AppBar titre="Classement" />
      </div>
      <div className="px-5 pt-2 flex-1">
        <Classement />
      </div>
      <TabBar />
    </div>
  );
}
