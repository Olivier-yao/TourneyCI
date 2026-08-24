"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { SelecteurSymbole } from "@/components/ds/SelecteurSymbole";
import { tournoiParId, modifierTournoi, type Tournoi } from "@/lib/mockTournaments";
import { SYMBOLE_DEFAUT } from "@/lib/mockSymboles";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";

/** Édition des infos générales du tournoi (titre, règlement...) — la gestion
 * du stream a été déplacée vers un écran dédié (point 130). */
export default function ParametresTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [checkin, setCheckin] = useState("");
  const [reglement, setReglement] = useState("");
  const [informations, setInformations] = useState("");
  const [symboleId, setSymboleId] = useState(SYMBOLE_DEFAUT);

  useEffect(() => {
    tournoiParId(params.id).then(async (t) => {
      setTournoi(t);
      setAutorise(t?.organisateur === (await nomOrganisateurActuel()));
      setTitre(t?.titre ?? "");
      setVille(t?.ville ?? "");
      setCheckin(t?.checkin ?? "");
      setReglement(t?.reglement ?? "");
      setInformations(t?.informations ?? "");
      setSymboleId(t?.symboleId ?? SYMBOLE_DEFAUT);
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

  // Un tournoi clôturé ou annulé devient un historique, pas une config
  // vivante — même seuil que "Les scores sont verrouillés" côté Régie
  // (gestion/page.tsx). Le serveur refuse déjà la modification (PATCH
  // /api/tournois/[id]) ; ceci évite de laisser un formulaire éditable qui
  // échouerait silencieusement à l'enregistrement.
  if (tournoi.termine || tournoi.annule) {
    return (
      <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Infos du tournoi" onRetour={() => router.back()} />
        <div className="flex flex-col items-center justify-center gap-3 flex-1 text-center px-6">
          <Lock size={22} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            {tournoi.annule ? "Tournoi annulé : les réglages ne sont plus modifiables." : "Tournoi clôturé : les réglages ne sont plus modifiables."}
          </p>
          <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
        </div>
      </div>
    );
  }

  /** Convertit le texte "19h30"/"19:30" en horodatage réel, sur le même jour
   * calendaire que le début du tournoi (checkin_le est une vraie colonne
   * DateTime, cf. src/lib/server/tournois.ts). */
  function checkinTsDepuisHeure(heure: string): number | undefined {
    const m = heure.trim().match(/^(\d{1,2})[h:](\d{2})$/i);
    if (!m || !tournoi?.debutTournoiTs) return undefined;
    const ref = new Date(tournoi.debutTournoiTs);
    return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), Number(m[1]), Number(m[2])).getTime();
  }

  async function enregistrer() {
    const checkinTs = checkinTsDepuisHeure(checkin);
    const ok = await modifierTournoi(params.id, {
      titre: titre.trim() || tournoi!.titre,
      ville: ville.trim() || tournoi!.ville,
      checkinTs,
      reglement: reglement.trim(),
      informations: informations.trim() || undefined,
      symboleId,
    });
    if (!ok) return;
    setEnregistre(true);
    setTimeout(() => setEnregistre(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Infos du tournoi" onRetour={() => router.back()} />

      <Field label="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
      <Field label="Ville / lieu" value={ville} onChange={(e) => setVille(e.target.value)} />
      <Field label="Heure de check-in" value={checkin} onChange={(e) => setCheckin(e.target.value)} placeholder="19h30" />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Règlement</label>
        <textarea
          value={reglement}
          onChange={(e) => setReglement(e.target.value)}
          rows={5}
          className="px-3 py-2.5 text-sm outline-none resize-none"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Informations (facultatif)</label>
        <textarea
          value={informations}
          onChange={(e) => setInformations(e.target.value)}
          rows={4}
          className="px-3 py-2.5 text-sm outline-none resize-none"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Symbole (onglet En direct)</label>
        <SelecteurSymbole symboleId={symboleId} onChange={setSymboleId} />
      </div>

      <Button variante="primary" onClick={enregistrer} disabled={!titre.trim()}>
        {enregistre ? "Enregistré ✓" : "Enregistrer"}
      </Button>
    </div>
  );
}
