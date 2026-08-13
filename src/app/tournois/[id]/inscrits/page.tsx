"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, CheckCircle2, Flame, Lock } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { EmptyState } from "@/components/ds/EmptyState";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId, inscriptionsFermees } from "@/lib/mockTournaments";
import { lireProfil, estActif } from "@/lib/mockProfil";
import { inscriptionDe } from "@/lib/mockInscriptions";
import { estPresent, definirPresence } from "@/lib/mockCheckin";
import { estOrganisateur } from "@/lib/mockAuth";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";

function tagDe(nom: string): string {
  return `#${nom.replace(/\s+/g, "").slice(0, 6).toUpperCase()}`;
}

export default function InscritsPage() {
  const params = useParams<{ id: string }>();
  const tournoi = tournoiParId(params.id);
  const [requete, setRequete] = useState("");
  const [monPseudo, setMonPseudo] = useState<{ nom: string; actif: boolean; photoUrl?: string } | null>(null);
  const [organisateur, setOrganisateur] = useState(false);
  const [estMonTournoi, setEstMonTournoi] = useState(false);
  const [versionCheckin, setVersionCheckin] = useState(0);

  useEffect(() => {
    const profil = lireProfil();
    const inscription = inscriptionDe(params.id);
    const nomAffiche = inscription?.equipe ?? inscription?.tag ?? profil.pseudo;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonPseudo({ nom: nomAffiche, actif: estActif(profil.matchsJoues), photoUrl: profil.photoUrl });
    setOrganisateur(estOrganisateur());
    setEstMonTournoi(tournoi?.organisateur === nomOrganisateurActuel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const inscrits = useMemo(() => {
    const noms = tournoi?.inscrits ?? [];
    return noms
      .map((nom) => ({ nom, tag: tagDe(nom), checkin: estPresent(params.id, nom) }))
      .filter((p) => !requete || p.nom.toLowerCase().includes(requete.toLowerCase()) || p.tag.toLowerCase().includes(requete.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournoi, requete, params.id, versionCheckin]);

  function basculerPresence(nom: string, present: boolean) {
    definirPresence(params.id, nom, !present);
    setVersionCheckin((v) => v + 1);
  }

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  if (!estMonTournoi && !inscriptionsFermees(tournoi)) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
          <Link href={`/tournois/${params.id}`} className={PRESS} style={{ color: "var(--ds-muted)" }}>
            <ArrowLeft size={19} strokeWidth={2} />
          </Link>
          <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Inscrits
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Lock size={22} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            La liste des inscrits sera visible une fois les inscriptions closes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </Link>
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.titre}</div>
          <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Inscrits · {tournoi.placesInscrites}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3 pb-8">
        <div
          className="flex items-center gap-2.5 h-11 px-3.5"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
        >
          <Search size={15} style={{ color: "var(--ds-muted)" }} />
          <input
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Chercher un joueur ou un TAG"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--ds-text)" }}
          />
        </div>

        {organisateur && (
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            En tant qu&apos;organisateur, touche le statut d&apos;un inscrit pour valider son check-in juste avant le début.
          </p>
        )}

        {inscrits.length === 0 ? (
          <EmptyState titre="Aucun inscrit" description="Personne ne correspond à cette recherche." />
        ) : (
          <div className="flex flex-col gap-2">
            {inscrits.map((p) => (
              <div
                key={p.nom}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                <Link href={`/joueur/${encodeURIComponent(p.nom)}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar
                    initiales={p.nom.slice(0, 2).toUpperCase()}
                    photoUrl={monPseudo?.nom === p.nom ? monPseudo.photoUrl : undefined}
                    taille={38}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {p.nom}
                      {monPseudo?.nom === p.nom && monPseudo.actif && (
                        <Flame size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} aria-label="Membre actif" />
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{p.tag}</div>
                  </div>
                </Link>
                {organisateur ? (
                  <button
                    type="button"
                    onClick={() => basculerPresence(p.nom, p.checkin)}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 cursor-pointer"
                    style={{
                      borderRadius: "var(--ds-radius-pill)",
                      background: p.checkin ? "var(--ds-accent-900)" : "transparent",
                      border: `1px solid ${p.checkin ? "var(--ds-accent)" : "var(--ds-border)"}`,
                      color: p.checkin ? "var(--ds-accent-300)" : "var(--ds-muted)",
                    }}
                  >
                    <CheckCircle2 size={12} strokeWidth={2} />
                    {p.checkin ? "Check-in" : "En attente"}
                  </button>
                ) : p.checkin ? (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}>
                    <CheckCircle2 size={12} strokeWidth={2} />
                    Check-in
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    En attente
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
