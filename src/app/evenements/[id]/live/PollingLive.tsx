"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVALLE_MS = 10_000;

export function PollingLive({ actif }: { actif: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!actif) return;
    const id = setInterval(() => router.refresh(), INTERVALLE_MS);
    return () => clearInterval(id);
  }, [actif, router]);

  return null;
}
