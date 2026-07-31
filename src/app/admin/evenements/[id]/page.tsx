import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatDateFr } from "@/lib/format";
import type { Event, Match, Participant } from "@/lib/types";
import { IconCheck, IconParticipants, IconTrophee } from "@/components/icons";
import { validerPaiement } from "./actions";
import { GenererBracketBouton } from "./GenererBracketBouton";
import { MatchScoreCard } from "./MatchScoreCard";

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demi-finale";
  if (round === totalRounds - 2) return "Quart de finale";
  return `Round ${round}`;
}

export default async function DashboardEvenementPage({
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

  const { data: participantsData } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const participants = (participantsData ?? []) as Participant[];
  const nombrePayes = participants.filter(
    (p) => p.statut_paiement === "paye",
  ).length;

  let matches: Match[] = [];
  if (event.statut !== "ouvert") {
    const { data: matchesData } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("event_id", id)
      .order("round", { ascending: true })
      .order("position", { ascending: true });
    matches = (matchesData ?? []) as Match[];
  }

  const nomsParParticipant = Object.fromEntries(
    participants.map((p) => [p.id, p.nom]),
  );
  const totalRounds =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const matchsParRound = new Map<number, Match[]>();
  for (const match of matches) {
    const liste = matchsParRound.get(match.round) ?? [];
    liste.push(match);
    matchsParRound.set(match.round, liste);
  }

  return (
    <main className="min-h-screen bg-cream-100 text-ink-900 motif-points px-4 py-8">
      <div className="motif-damier h-1.5 w-full rounded-full mb-6 max-w-md mx-auto" />
      <div className="mx-auto max-w-md space-y-6">
        <div className="layer-raised rounded-xl px-5 py-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            <IconTrophee size={24} className="text-forest-900 shrink-0" />
            {event.nom}
          </h1>
          <p className="text-forest-700 text-lg font-medium mt-1">
            {event.jeu} — {formatDateFr(event.date)}
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-forest-900 mb-4">
            <IconParticipants size={20} />
            Inscrits ({participants.length}/{event.max_participants}) —{" "}
            {nombrePayes} payé{nombrePayes > 1 ? "s" : ""}
          </h2>

          {participants.length === 0 ? (
            <p className="text-ink-600">Aucune inscription pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-3">
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className="layer-raised rounded-xl px-4 py-4 flex items-center gap-3"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-forest-100 text-forest-900 font-bold flex items-center justify-center text-lg">
                    {participant.nom.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink-900 truncate">
                      {participant.nom}
                    </p>
                    <p className="text-ink-600 text-sm truncate">
                      {participant.pseudo_tiktok} · {participant.whatsapp}
                    </p>
                  </div>

                  {participant.statut_paiement === "paye" ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-success-50 text-success-600 text-sm font-semibold px-3 py-2">
                      <IconCheck size={16} />
                      Payé
                    </span>
                  ) : (
                    <form
                      action={validerPaiement.bind(null, event.id, participant.id)}
                    >
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-forest-900 hover:bg-forest-700 active:shadow-pressed shadow-raised text-white text-sm font-semibold px-4 py-2 transition-colors"
                      >
                        Marquer payé
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="layer-raised rounded-xl px-5 py-5">
          <h2 className="text-xl font-bold text-forest-900 mb-4">Bracket</h2>
          {event.statut === "ouvert" ? (
            <GenererBracketBouton
              eventId={event.id}
              nbParticipants={participants.length}
            />
          ) : (
            <p className="text-ink-600">
              Inscriptions clôturées — bracket généré ({matches.length} match
              {matches.length > 1 ? "s" : ""}).
            </p>
          )}
        </div>

        {matches.length > 0 && (
          <div className="space-y-6">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(
              (round) => (
                <div key={round}>
                  <h3 className="text-sm font-bold text-forest-900 uppercase tracking-wide mb-3">
                    {nomRound(round, totalRounds)}
                  </h3>
                  <div className="space-y-3">
                    {(matchsParRound.get(round) ?? []).map((match) => {
                      const nom1 = match.participant1_id
                        ? (nomsParParticipant[match.participant1_id] ?? "?")
                        : "Bye";
                      const nom2 = match.participant2_id
                        ? (nomsParParticipant[match.participant2_id] ?? "?")
                        : "Bye";

                      if (match.statut === "termine") {
                        return (
                          <div
                            key={match.id}
                            className="layer-raised rounded-xl px-4 py-3 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={
                                  match.gagnant_id === match.participant1_id
                                    ? "font-bold text-forest-900"
                                    : "text-ink-600"
                                }
                              >
                                {nom1}
                              </span>
                              {match.score1 !== null && (
                                <span className="text-ink-600 text-sm">
                                  {match.score1}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className={
                                  match.gagnant_id === match.participant2_id
                                    ? "font-bold text-forest-900"
                                    : "text-ink-600"
                                }
                              >
                                {nom2}
                              </span>
                              {match.score2 !== null && (
                                <span className="text-ink-600 text-sm">
                                  {match.score2}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (match.participant1_id && match.participant2_id) {
                        return (
                          <MatchScoreCard
                            key={match.id}
                            eventId={event.id}
                            matchId={match.id}
                            nom1={nom1}
                            nom2={nom2}
                          />
                        );
                      }

                      return (
                        <div
                          key={match.id}
                          className="rounded-xl border border-dashed border-cream-300 px-4 py-3 text-ink-400 text-sm text-center"
                        >
                          En attente du round précédent
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}
