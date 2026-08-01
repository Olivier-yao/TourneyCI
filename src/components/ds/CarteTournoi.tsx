"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Wifi } from "lucide-react";
import { Card, CardKicker, CardTitle } from "./Card";
import { LiveBadge } from "./LiveBadge";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { IconCalendrier, IconLieu, IconParticipants } from "@/components/icons";
import { formatXof } from "@/lib/formatXof";
import type { Tournoi } from "@/lib/mockTournaments";

export const LABEL_TYPE: Record<Tournoi["type"], string> = {
  "1v1": "1v1",
  equipes: "Équipes",
  battle_royale: "Battle Royale",
};

export const elementVariants = {
  cache: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function CarteTournoi({ tournoi: t }: { tournoi: Tournoi }) {
  return (
    <motion.div variants={elementVariants}>
      <Link href={`/tournois/${t.id}`}>
        <Card className="hover:opacity-95 transition-opacity">
          <div className="relative">
            {t.banniereUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.banniereUrl} alt={t.titre} className="w-full object-cover" style={{ height: 100 }} />
            ) : (
              <ImagePlaceholder label="visuel tournoi" hauteur={100} />
            )}
            {t.enDirect && (
              <div className="absolute top-3 left-3">
                <LiveBadge />
              </div>
            )}
          </div>
          <div className="p-[17px] flex flex-col gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[11px] px-2.5 py-1"
                style={{
                  borderRadius: "var(--ds-radius-pill)",
                  background: "var(--ds-accent-900)",
                  color: "var(--ds-accent-300)",
                  fontFamily: "var(--ds-font-mono)",
                }}
              >
                {t.jeuLabel}
              </span>
              <span
                className="text-[11px] px-2.5 py-1"
                style={{
                  borderRadius: "var(--ds-radius-pill)",
                  border: "1px solid var(--ds-border)",
                  color: "var(--ds-muted)",
                  fontFamily: "var(--ds-font-mono)",
                }}
              >
                {LABEL_TYPE[t.type]}
              </span>
              {t.modalite === "virtuel" && (
                <span
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1"
                  style={{
                    borderRadius: "var(--ds-radius-pill)",
                    border: "1px solid var(--ds-border)",
                    color: "var(--ds-muted)",
                    fontFamily: "var(--ds-font-mono)",
                  }}
                >
                  <Wifi size={11} strokeWidth={2} />
                  En ligne
                </span>
              )}
            </div>

            <CardTitle>{t.titre}</CardTitle>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ds-muted)" }}>
              <span className="flex items-center gap-1.5">
                <IconCalendrier size={16} />
                {t.dateLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <IconLieu size={16} />
                {t.ville}
              </span>
            </div>

            <div className="flex items-center justify-between mt-1">
              <CardKicker>{t.placesInscrites}/{t.placesTotal} inscrits</CardKicker>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "var(--ds-muted)" }}>
                  <IconParticipants size={16} />
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--ds-accent-300)" }}>
                  {formatXof(t.fraisXof)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
