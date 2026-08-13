"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Plus } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { EcussonEquipe } from "@/components/ds/Palier";
import { AvatarPile } from "@/components/ds/Avatar";
import { PRESS } from "@/components/ds/Button";
import { lireProfil } from "@/lib/mockProfil";
import { equipesDuJoueur, demandesEnAttente, TAILLE_EQUIPE_BR, type EquipeBR } from "@/lib/mockEquipesBR";
import { tournoiParId, estTermine, type Tournoi } from "@/lib/mockTournaments";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

type EquipeAvecTournoi = { equipe: EquipeBR; tournoi: Tournoi; pending: number };

export default function MesEquipesPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [onglet, setOnglet] = useState<"actives" | "terminees">("actives");
  const [equipes, setEquipes] = useState<EquipeAvecTournoi[]>([]);
  const [pseudo, setPseudo] = useState("");

  useEffect(() => {
    const moi = lireProfil().pseudo;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPseudo(moi);
    const avecTournoi = equipesDuJoueur(moi)
      .map((equipe) => {
        const tournoi = tournoiParId(equipe.tournoiId);
        if (!tournoi) return undefined;
        const pending = equipe.chef === moi ? demandesEnAttente(equipe.id).length : 0;
        return { equipe, tournoi, pending };
      })
      .filter((v): v is EquipeAvecTournoi => Boolean(v))
      .sort((a, b) => b.equipe.creeLe - a.equipe.creeLe);
    setEquipes(avecTournoi);
  }, []);

  if (!connecte) return null;

  const actives = equipes.filter((e) => !estTermine(e.tournoi.id));
  const terminees = equipes.filter((e) => estTermine(e.tournoi.id));
  const liste = onglet === "actives" ? actives : terminees;
  const tournoisDistincts = new Set(equipes.map((e) => e.tournoi.id)).size;

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              Mes équipes
            </div>
            <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {actives.length} active{actives.length > 1 ? "s" : ""} · {tournoisDistincts} tournoi{tournoisDistincts > 1 ? "s" : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/tournois")}
            aria-label="Rejoindre ou créer une équipe depuis un tournoi"
            className={`flex items-center justify-center w-9 h-9 shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
          <button
            type="button"
            onClick={() => setOnglet("actives")}
            className={`flex-1 h-[30px] text-xs font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "actives" ? "var(--ds-accent-800)" : "transparent",
              color: onglet === "actives" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            Actives
          </button>
          <button
            type="button"
            onClick={() => setOnglet("terminees")}
            className={`flex-1 h-[30px] text-xs font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: onglet === "terminees" ? "var(--ds-accent-800)" : "transparent",
              color: onglet === "terminees" ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            Terminées
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 flex-1 flex flex-col gap-2.5">
        {liste.length === 0 ? (
          <EmptyState
            titre={onglet === "actives" ? "Aucune équipe active" : "Aucune équipe terminée"}
            description={onglet === "actives" ? "Rejoins ou crée une équipe depuis un tournoi Battle Royale." : "Tes équipes de tournois terminés apparaîtront ici."}
          />
        ) : (
          liste.map(({ equipe, tournoi, pending }) => {
            const estChef = equipe.chef === pseudo;
            const taille = tournoi.brSousType && tournoi.brSousType !== "solo" ? TAILLE_EQUIPE_BR[tournoi.brSousType] : equipe.membres.length;
            return (
              <button
                key={equipe.id}
                type="button"
                onClick={() => router.push(`/tournois/${tournoi.id}/equipe/${equipe.id}`)}
                className={`p-[13px] flex flex-col gap-2.5 text-left ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-lg)",
                  background: "var(--ds-surface)",
                  boxShadow: pending > 0 ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <EcussonEquipe initiales={equipe.nom.slice(0, 2).toUpperCase()} style={estChef ? "accent" : "neutre"} largeur={46} hauteur={52} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[15px] font-medium truncate">{equipe.nom}</div>
                      {estChef && <Crown size={13} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-400)" }} />}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {tournoi.jeuLabel.toUpperCase()} · {tournoi.titre}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 shrink-0"
                    style={{ borderRadius: "var(--ds-radius-pill)", background: tournoi.enDirect ? "var(--ds-accent-800)" : "transparent", border: tournoi.enDirect ? "none" : "1px solid var(--ds-border)", color: tournoi.enDirect ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)", fontSize: 9 }}
                  >
                    {tournoi.enDirect ? "EN DIRECT" : "À VENIR"}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <AvatarPile initiales={equipe.membres.slice(0, 4).map((m) => m.slice(0, 2).toUpperCase())} />
                  <div className="flex-1 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {equipe.membres.length} sur {taille}
                  </div>
                  {pending > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", fontFamily: "var(--ds-font-mono)", fontSize: 9, color: "var(--ds-accent-300)" }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: "var(--ds-accent-400)" }} />
                      {pending} demande{pending > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div
                  className="h-9 flex items-center justify-center text-xs font-medium"
                  style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${estChef ? "var(--ds-accent)" : "var(--ds-border)"}`, color: estChef ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                >
                  {estChef ? "Gérer l'équipe" : "Voir l'équipe"}
                </div>
              </button>
            );
          })
        )}
      </div>

      <TabBar />
    </div>
  );
}
