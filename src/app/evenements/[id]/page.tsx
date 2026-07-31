import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatDateFr, formatFcfa } from "@/lib/format";
import type { Event } from "@/lib/types";
import { FormulaireInscription } from "./FormulaireInscription";
import {
  IconCalendrier,
  IconLieu,
  IconParticipants,
  IconPiece,
  IconTrophee,
} from "@/components/icons";

const STATUT_LABELS: Record<Event["statut"], string> = {
  ouvert: "Inscriptions ouvertes",
  cloture: "Inscriptions closes",
  en_cours: "Tournoi en cours",
  termine: "Tournoi terminé",
};

export default async function EvenementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const event = data as Event;

  const { count } = await supabaseAdmin
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const placesRestantes = Math.max(event.max_participants - (count ?? 0), 0);

  return (
    <main className="min-h-screen bg-cream-100 text-ink-900 motif-points px-4 py-8">
      <div className="motif-damier h-1.5 w-full rounded-full mb-6 max-w-md mx-auto" />
      <div className="mx-auto max-w-md space-y-6">
        <div className="layer-raised rounded-xl px-5 py-5">
          <span className="inline-block rounded-full bg-forest-100 text-forest-900 text-xs font-semibold px-3 py-1 mb-3">
            {STATUT_LABELS[event.statut]}
          </span>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-ink-900">
            <IconTrophee size={24} className="text-forest-900 shrink-0" />
            {event.nom}
          </h1>
          <p className="text-forest-700 text-lg font-medium mt-1">
            {event.jeu}
          </p>
        </div>

        <dl className="layer-raised rounded-xl px-5 py-2 divide-y divide-cream-300">
          <div className="flex items-center justify-between py-3 text-lg">
            <dt className="flex items-center gap-2 text-ink-600">
              <IconCalendrier size={20} />
              Date
            </dt>
            <dd>{formatDateFr(event.date)}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-lg">
            <dt className="flex items-center gap-2 text-ink-600">
              <IconLieu size={20} />
              Lieu
            </dt>
            <dd>{event.lieu}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-lg">
            <dt className="flex items-center gap-2 text-ink-600">
              <IconPiece size={20} />
              Frais d&apos;inscription
            </dt>
            <dd>{formatFcfa(event.frais_inscription)}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-lg">
            <dt className="flex items-center gap-2 text-ink-600">
              <IconParticipants size={20} />
              Places restantes
            </dt>
            <dd
              className={
                placesRestantes === 0
                  ? "text-error-600 font-semibold"
                  : "text-success-600 font-semibold"
              }
            >
              {placesRestantes} / {event.max_participants}
            </dd>
          </div>
        </dl>

        <div>
          <h2 className="text-xl font-bold text-forest-900 mb-4">
            S&apos;inscrire
          </h2>
          {event.statut !== "ouvert" ? (
            <div className="space-y-3">
              <p className="text-ink-600">
                Les inscriptions ne sont pas (ou plus) ouvertes pour cet
                événement.
              </p>
              <Link
                href={`/evenements/${event.id}/live`}
                className="inline-block rounded-lg bg-forest-900 hover:bg-forest-700 shadow-raised text-white px-4 py-2 text-sm font-semibold transition-colors"
              >
                Voir le bracket
              </Link>
            </div>
          ) : placesRestantes === 0 ? (
            <p className="text-error-600">
              Cet événement est complet, il n&apos;y a plus de places
              disponibles.
            </p>
          ) : (
            <FormulaireInscription eventId={event.id} />
          )}
        </div>
      </div>
    </main>
  );
}
