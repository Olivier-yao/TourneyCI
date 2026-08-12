"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatDateFr, formatFcfa } from "@/lib/format";
import type { Event } from "@/lib/types";
import {
  IconCalendrier,
  IconLieu,
  IconParticipants,
  IconTrophee,
} from "@/components/icons";

const STATUT_LABELS: Record<Event["statut"], string> = {
  ouvert: "Inscriptions ouvertes",
  cloture: "Bracket en préparation",
  en_cours: "Tournoi en cours",
  termine: "Tournoi terminé",
};

function lienEvenement(event: Event): string {
  return event.statut === "ouvert"
    ? `/evenements/${event.id}`
    : `/evenements/${event.id}/live`;
}

const conteneurVariants = {
  cache: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const elementVariants = {
  cache: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function AccueilAnime({ events }: { events: Event[] }) {
  return (
    <motion.main
      initial="cache"
      animate="visible"
      variants={conteneurVariants}
      className="min-h-screen bg-cream-100 text-ink-900 motif-points px-4 py-12"
    >
      <motion.div
        variants={elementVariants}
        className="motif-damier h-1.5 w-full rounded-full mb-10 max-w-3xl mx-auto"
      />

      <div className="mx-auto max-w-3xl">
        <motion.div variants={elementVariants} className="text-center mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: "backOut", delay: 0.1 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-forest-900 text-white shadow-raised mb-4"
          >
            <IconTrophee size={24} />
          </motion.div>
          <h1 className="text-4xl font-bold text-forest-900">Tourney</h1>
          <p className="text-ink-600 text-lg mt-2 max-w-md mx-auto">
            Organise ton tournoi gaming IRL : inscriptions, bracket et scores
            en direct, depuis ton téléphone.
          </p>
        </motion.div>

        <motion.h2
          variants={elementVariants}
          className="text-sm font-bold text-forest-900 uppercase tracking-wide mt-12 mb-4"
        >
          Événements
        </motion.h2>

        {events.length === 0 ? (
          <motion.p variants={elementVariants} className="text-ink-600">
            Aucun événement pour l&apos;instant.
          </motion.p>
        ) : (
          <motion.ul variants={conteneurVariants} className="space-y-3">
            {events.map((event) => (
              <motion.li key={event.id} variants={elementVariants}>
                <Link
                  href={lienEvenement(event)}
                  className="block layer-raised rounded-xl px-5 py-4 hover:shadow-popover transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-bold text-ink-900 truncate">
                      {event.nom}
                    </h3>
                    <span className="shrink-0 inline-block rounded-full bg-forest-100 text-forest-900 text-xs font-semibold px-3 py-1">
                      {STATUT_LABELS[event.statut]}
                    </span>
                  </div>
                  <p className="text-forest-700 font-medium mb-2">
                    {event.jeu}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                    <span className="flex items-center gap-1.5">
                      <IconCalendrier size={16} />
                      {formatDateFr(event.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IconLieu size={16} />
                      {event.lieu}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IconParticipants size={16} />
                      {formatFcfa(event.frais_inscription)}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.main>
  );
}
