"use client";

import { useEffect, useRef } from "react";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";

export type CanalRealtime = { table: string; filter?: string; event?: "INSERT" | "UPDATE" | "*" };

/**
 * Déclenche `onChange` à chaque ligne insérée en base correspondant à un
 * des canaux (Supabase Realtime, table par table) — remplace le polling à
 * intervalle fixe (8-15s) des écrans de chat par un rafraîchissement quasi
 * instantané. Realtime n'est qu'un DÉCLENCHEUR, jamais la source de vérité :
 * le payload brut Postgres n'a ni le pseudo ni le rôle déjà résolus (cf.
 * versMessagesChatJSON côté serveur) — `onChange` doit rester un simple
 * refetch via l'API existante, idempotent.
 *
 * `filter` accepte plusieurs conditions combinées par des virgules (ET
 * logique, ex. `tournoi_id=eq.X,salon=eq.general`) — cf. les call sites.
 */
export function useRealtimeRefetch(canaux: CanalRealtime[], onChange: () => void, actif = true) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const cle = canaux.map((c) => `${c.table}:${c.filter ?? ""}`).join("|");

  useEffect(() => {
    if (!actif || canaux.length === 0) return;
    const supabase = creerClientSupabaseNavigateur();
    const channel = supabase.channel(`realtime-${cle}`);
    for (const c of canaux) {
      channel.on(
        "postgres_changes",
        { event: c.event ?? "INSERT", schema: "public", table: c.table, filter: c.filter },
        () => onChangeRef.current(),
      );
    }
    channel.subscribe((status) => {
      if (process.env.NODE_ENV !== "production") console.debug(`[realtime] ${cle} →`, status);
    });
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, cle]);
}
