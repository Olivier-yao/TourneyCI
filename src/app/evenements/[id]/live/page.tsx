import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { Event, Match, Participant } from "@/lib/types";
import { IconTrophee } from "@/components/icons";
import { BracketEsport } from "./BracketEsport";
import { PollingLive } from "./PollingLive";

export default async function BracketLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: eventData, error: erreurEvent } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (erreurEvent || !eventData) {
    notFound();
  }

  const event = eventData as Event;

  const [{ data: matchesData }, { data: participantsData }] = await Promise.all([
    supabaseAdmin
      .from("matches")
      .select("*")
      .eq("event_id", id)
      .order("round", { ascending: true })
      .order("position", { ascending: true }),
    supabaseAdmin.from("participants").select("*").eq("event_id", id),
  ]);

  const matches = (matchesData ?? []) as Match[];
  const participants = (participantsData ?? []) as Participant[];
  const nomsParParticipant = Object.fromEntries(
    participants.map((p) => [p.id, p.nom]),
  );

  const totalRounds =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;

  return (
    <main className="min-h-screen bg-navy-950 text-white px-4 py-8">
      <PollingLive actif={matches.length > 0 && event.statut !== "termine"} />
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-navy-800 bg-navy-900 px-5 py-5 mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <IconTrophee size={24} className="text-cyan-400" />
              {event.nom}
            </h1>
            <p className="text-slate-300 mt-1">{event.jeu}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {matches.length > 0 && event.statut !== "termine" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                En direct
              </span>
            )}
            <Link
              href={`/evenements/${id}`}
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              &larr; Détails
            </Link>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-navy-800 bg-navy-900 px-5 py-8 text-center text-slate-300">
            Le bracket n&apos;a pas encore été généré pour cet événement.
          </div>
        ) : (
          <BracketEsport
            matches={matches}
            nomsParParticipant={nomsParParticipant}
            totalRounds={totalRounds}
          />
        )}
      </div>
    </main>
  );
}
