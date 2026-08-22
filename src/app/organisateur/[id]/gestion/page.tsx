"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { XCircle, Settings2, Users, ListChecks, Flag, Zap, KeyRound, Network, MessagesSquare } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId, inscriptionsFermees, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, type MatchTournoi } from "@/lib/mockBracket";
import { manchesBR, unitesBR, type MancheBR, type UniteBR } from "@/lib/mockBattleRoyale";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";

function CarteActionRequise({ tournoi }: { tournoi: Tournoi }) {
  const [matches, setMatches] = useState<MatchTournoi[]>([]);
  const [manches, setManches] = useState<MancheBR[]>([]);
  const [unites, setUnites] = useState<UniteBR[]>([]);
  useEffect(() => {
    if (tournoi.type === "battle_royale") return;
    matchsDuTournoi(tournoi.id).then(setMatches);
  }, [tournoi.id, tournoi.type]);
  useEffect(() => {
    if (tournoi.type !== "battle_royale") return;
    manchesBR(tournoi.id).then(setManches);
    unitesBR(tournoi.id, tournoi.brSousType ?? "solo").then(setUnites);
  }, [tournoi.id, tournoi.type, tournoi.brSousType]);

  if (tournoi.termine || tournoi.annule) return null;

  if (tournoi.type === "battle_royale") {
    if (unites.length === 0) return null;
    return (
      <Link
        href={`/organisateur/${tournoi.id}/qualification`}
        className="flex flex-col gap-1 p-3.5"
        style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
            Action requise
          </span>
          <Zap size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
        </div>
        <div className="text-[15px] font-medium mt-0.5">Saisir les points de la manche {manches.length + 1}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--ds-text-muted)" }}>
          {unites.length} équipe{unites.length > 1 ? "s" : ""} en jeu.
        </div>
      </Link>
    );
  }

  const enAttente = matches.filter((m) => m.statut !== "termine" && m.joueur1 && m.joueur2).length;
  if (enAttente === 0) return null;
  return (
    <Link
      href={`/organisateur/${tournoi.id}/qualification`}
      className="flex flex-col gap-1 p-3.5"
      style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
          Action requise
        </span>
        <Zap size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
      </div>
      <div className="text-[15px] font-medium mt-0.5">
        {enAttente} match{enAttente > 1 ? "s" : ""} en attente de score
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--ds-text-muted)" }}>
        Valide les scores pour faire avancer le bracket.
      </div>
    </Link>
  );
}

export default function GestionTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [manchesJouees, setManchesJouees] = useState(0);

  useEffect(() => {
    if (tournoi?.type !== "battle_royale") return;
    manchesBR(tournoi.id).then((m) => setManchesJouees(m.length));
  }, [tournoi]);

  useEffect(() => {
    tournoiParId(params.id).then(async (t) => {
      setTournoi(t);
      setAutorise(Boolean(t) && (await peutSuperviser(t!.organisateur, nomOrganisateurActuel())));
      setPret(true);
    });
  }, [params.id]);

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  if (!autorise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette page est réservée aux organisateurs.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  if (tournoi.annule) {
    return (
      <div className="min-h-screen flex flex-col px-5 py-4 gap-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Gestion en direct" onRetour={() => router.back()} />
        <div
          className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4"
        >
          <XCircle size={32} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
          <p className="text-base font-medium">Tournoi annulé</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            {tournoi.titre} a été annulé suite à ta demande. Les inscrits déjà payés ont été remboursés automatiquement.
          </p>
          <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Voir la fiche du tournoi</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Gestion en direct" onRetour={() => router.back()} />

      <div>
        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {tournoi.titre}
        </div>
        <div
          className="text-lg"
          style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
        >
          {tournoi.jeuLabel} · {tournoi.placesInscrites} inscrits
        </div>
      </div>

      <CarteActionRequise tournoi={tournoi} />

      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href={`/tournois/${params.id}/inscrits`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Users size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Check-in</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.placesInscrites} inscrits
            </div>
          </div>
        </Link>
        <Link
          href={`/organisateur/${params.id}/qualification`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <ListChecks size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">{tournoi.type === "battle_royale" ? "Manches" : "Scores"}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.type === "battle_royale" ? `${manchesJouees}/${tournoi.manchesPrevues ?? 1} jouée(s)` : "Saisir un résultat"}
            </div>
          </div>
        </Link>
        <Link
          href={`/organisateur/${params.id}/stream`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Settings2 size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Paramètres</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Stream / diffusion
            </div>
          </div>
        </Link>
        <Link
          href={tournoi.type === "battle_royale" ? `/tournois/${params.id}/battle-royale` : `/tournois/${params.id}/bracket`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Network size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">{tournoi.type === "battle_royale" ? "Aperçu classement" : "Aperçu bracket"}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Avant le lancement
            </div>
          </div>
        </Link>
        <Link
          href={`/organisateur/${params.id}/cloture`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <Flag size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Clôture</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {tournoi.termine ? "Terminé" : "En cours"}
            </div>
          </div>
        </Link>
        <Link
          href={`/tournois/${params.id}/chat-spectateurs`}
          className={`flex flex-col gap-2 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <MessagesSquare size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <div>
            <div className="text-[13px] font-medium">Tribune</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Chat spectateurs, ouvert à tous
            </div>
          </div>
        </Link>
        {inscriptionsFermees(tournoi) && (
          <Link
            href={`/organisateur/${params.id}/room`}
            className={`flex flex-col gap-2 p-3 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
          >
            <KeyRound size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
            <div>
              <div className="text-[13px] font-medium">Infos de room</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Lien, mot de passe, envoi
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
