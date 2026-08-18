"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId, type Tournoi } from "@/lib/mockTournaments";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { creerDemandeAnnulation, demandeAnnulationPourTournoi } from "@/lib/mockDemandesAnnulation";
import { formatXof } from "@/lib/formatXof";

const MOTIFS_PREDEFINIS = [
  {
    id: "orga",
    label: "Indisponibilité de l'organisateur",
    brouillon: "Je ne suis plus en mesure d'assurer l'organisation de ce tournoi (indisponibilité personnelle).",
  },
  {
    id: "few",
    label: "Pas assez d'inscrits",
    brouillon: "Le nombre d'inscrits est insuffisant pour maintenir une compétition équilibrée.",
  },
  {
    id: "tech",
    label: "Problème technique ou de salle",
    brouillon: "Un problème technique (salle, connexion, matériel) empêche la tenue du tournoi dans de bonnes conditions.",
  },
  { id: "other", label: "Autre motif", brouillon: "" },
];

const MAX_MOTIF = 400;

/** Design v8 N4 : la demande d'annulation passe d'une modale à texte libre à
 * une page dédiée avec motifs prédéfinis (brouillon auto-rempli mais
 * modifiable) et une estimation des remboursements — la logique métier
 * (creerDemandeAnnulation) reste inchangée, seule l'UX de saisie change. */
export default function AnnulationTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [estProprietaire, setEstProprietaire] = useState(false);
  const [dejaDemande, setDejaDemande] = useState(false);
  const [motifId, setMotifId] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  useEffect(() => {
    const t = tournoiParId(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournoi(t);
    setEstProprietaire(t?.organisateur === nomOrganisateurActuel());
    setDejaDemande(Boolean(demandeAnnulationPourTournoi(params.id)));
    setPret(true);
  }, [params.id]);

  if (!pret) return null;

  if (!tournoi || !estProprietaire || dejaDemande) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>
          {!tournoi ? "Tournoi introuvable." : !estProprietaire ? "Cette page est réservée à l'organisateur propriétaire." : "Une demande est déjà en cours pour ce tournoi."}
        </p>
        <Link href={`/organisateur/${params.id}/cloture`} style={{ color: "var(--ds-accent-300)" }}>Retour à la clôture</Link>
      </div>
    );
  }

  function choisirMotif(id: string) {
    setMotifId(id);
    const predef = MOTIFS_PREDEFINIS.find((m) => m.id === id);
    setMotif(predef?.brouillon ?? "");
  }

  function envoyer() {
    if (!motif.trim() || !tournoi) return;
    creerDemandeAnnulation(params.id, tournoi.titre, tournoi.organisateur, motif.trim());
    router.push(`/organisateur/${params.id}/cloture`);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div className="text-[15px] font-medium">Demande d&apos;annulation</div>
      </div>

      <div className="px-5 pt-4 flex-1 flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
          <div className="w-[34px] h-[34px] flex items-center justify-center shrink-0" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)", color: "var(--ds-danger)" }}>
            <TriangleAlert size={16} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{tournoi.titre}</div>
            <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              La demande part à l&apos;administration et compte contre ta réputation d&apos;organisateur.
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide mb-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Motif de l&apos;annulation
          </div>
          <div className="flex flex-col gap-1.5">
            {MOTIFS_PREDEFINIS.map((m) => {
              const actif = motifId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => choisirMotif(m.id)}
                  className={`flex items-center gap-2.5 p-3 text-left ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: actif ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px transparent" }}
                >
                  <span
                    className="w-[17px] h-[17px] flex items-center justify-center shrink-0"
                    style={{ borderRadius: "var(--ds-radius-pill)", border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border-strong)"}` }}
                  >
                    {actif && <span className="w-[7px] h-[7px] rounded-full" style={{ background: "var(--ds-accent-400)" }} />}
                  </span>
                  <span className="flex-1 text-sm">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Détail (modifiable)
          </div>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value.slice(0, MAX_MOTIF))}
            rows={4}
            placeholder="Choisis un motif ci-dessus ou décris la situation."
            className="px-3 py-2.5 text-sm outline-none resize-none"
            style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          <div className="flex justify-end text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {motif.length} / {MAX_MOTIF}
          </div>
        </div>

        {tournoi.fraisXof > 0 && tournoi.placesInscrites > 0 && (
          <div className="flex items-start gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
            <TriangleAlert size={15} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
            <span className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
              {tournoi.placesInscrites} inscrit{tournoi.placesInscrites > 1 ? "s" : ""} seront remboursés de {formatXof(tournoi.fraisXof)} chacun.
            </span>
          </div>
        )}
      </div>

      <div className="px-5 py-4 flex gap-2.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className={`flex-1 h-[46px] text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!motif.trim()}
          onClick={envoyer}
          className={`flex-[2] h-[46px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
        >
          Envoyer la demande
        </button>
      </div>
    </div>
  );
}
