"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, HeartCrack, Pencil, Trophy } from "lucide-react";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois } from "@/lib/mockTournaments";
import { Avatar } from "@/components/ds/Avatar";
import { BannerCropper } from "@/components/ds/BannerCropper";
import { PRESS } from "@/components/ds/Button";
import {
  statistiquesReputation,
  nomOrganisateurActuel,
  tagOrganisateur,
  definirTagOrganisateur,
  bioOrganisateur,
  definirBioOrganisateur,
  banniereOrganisateur,
  definirBanniereOrganisateur,
} from "@/lib/mockOrganisateur";
import { compterAvis, monAvisPourOrganisateur, laisserAvisOrganisateur, type TypeAvis } from "@/lib/mockAvis";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function ProfilOrganisateurPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ nom: string }>();
  const router = useRouter();
  const nom = decodeURIComponent(params.nom);

  const [stats, setStats] = useState({ coeurs: 0, coeursBrises: 0 });
  const [monAvis, setMonAvis] = useState<TypeAvis | null>(null);
  const [cestMoi, setCestMoi] = useState(false);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [bio, setBio] = useState<string | undefined>(undefined);
  const [banniere, setBanniere] = useState<string | undefined>(undefined);
  const [editionTag, setEditionTag] = useState(false);
  const [editionBio, setEditionBio] = useState(false);
  const [brouillonTag, setBrouillonTag] = useState("");
  const [brouillonBio, setBrouillonBio] = useState("");

  const tournois = useMemo(() => tousLesTournois().filter((t) => t.organisateur === nom), [nom]);

  function rafraichir() {
    setStats(statistiquesReputation(nom));
    setMonAvis(monAvisPourOrganisateur(nom)?.type ?? null);
    const moi = nomOrganisateurActuel() === nom;
    setCestMoi(moi);
    if (moi) {
      setTag(tagOrganisateur());
      setBio(bioOrganisateur());
      setBanniere(banniereOrganisateur());
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    rafraichir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom]);

  if (!connecte) return null;

  function voter(type: TypeAvis) {
    laisserAvisOrganisateur(nom, type);
    rafraichir();
  }

  function validerTag() {
    definirTagOrganisateur(brouillonTag);
    setTag(brouillonTag.trim() || undefined);
    setEditionTag(false);
  }

  function validerBio() {
    definirBioOrganisateur(brouillonBio);
    setBio(brouillonBio.trim() || undefined);
    setEditionBio(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="relative">
        {banniere ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banniere} alt={`Bannière de ${nom}`} className="w-full object-cover" style={{ height: 140 }} />
        ) : (
          <div style={{ height: 140, background: "var(--ds-surface-2)" }} />
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className={`absolute top-4 left-5 flex items-center justify-center w-9 h-9 ${PRESS}`}
          style={{
            borderRadius: "var(--ds-radius-md)",
            background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)",
            border: "1px solid var(--ds-border)",
            color: "var(--ds-text)",
          }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col px-5 py-4 gap-5">
        {cestMoi && (
          <div className="-mt-14">
            <BannerCropper banniereActuelle={banniere} onValider={(dataUrl) => { definirBanniereOrganisateur(dataUrl); setBanniere(dataUrl); }} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <Avatar initiales={nom.slice(0, 2).toUpperCase()} taille={56} />
          <div className="flex-1 min-w-0">
            <div className="text-xl truncate" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              {nom}
            </div>
            {editionTag ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  value={brouillonTag}
                  onChange={(e) => setBrouillonTag(e.target.value)}
                  placeholder="TAG"
                  className="flex-1 h-8 px-2.5 text-xs outline-none"
                  style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
                />
                <button type="button" onClick={validerTag} className={`text-xs font-medium ${PRESS}`} style={{ color: "var(--ds-accent-300)" }}>OK</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={cestMoi ? () => { setBrouillonTag(tag ?? ""); setEditionTag(true); } : undefined}
                className={`flex items-center gap-1 text-xs mt-0.5 ${cestMoi ? PRESS : ""}`}
                style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
              >
                {tag ? `@${tag}` : cestMoi ? "Ajouter un TAG" : ""}
                {cestMoi && <Pencil size={10} strokeWidth={2} />}
              </button>
            )}
          </div>
        </div>

        {(bio || cestMoi) && (
          editionBio ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={brouillonBio}
                onChange={(e) => setBrouillonBio(e.target.value)}
                rows={3}
                placeholder="Présente ton profil d'organisateur..."
                className="px-3 py-2.5 text-sm outline-none resize-none"
                style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditionBio(false)} className={`text-xs ${PRESS}`} style={{ color: "var(--ds-muted)" }}>Annuler</button>
                <button type="button" onClick={validerBio} className={`text-xs font-medium ${PRESS}`} style={{ color: "var(--ds-accent-300)" }}>Enregistrer</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={cestMoi ? () => { setBrouillonBio(bio ?? ""); setEditionBio(true); } : undefined}
              className={`text-left text-sm leading-relaxed ${cestMoi ? PRESS : ""}`}
              style={{ color: bio ? "var(--ds-text-muted)" : "var(--ds-muted)" }}
            >
              {bio || (cestMoi ? "Ajoute une bio pour te présenter →" : "")}
            </button>
          )
        )}

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--ds-accent-300)" }}>
            <Heart size={16} strokeWidth={2} fill="currentColor" />
            {stats.coeurs}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--ds-danger)" }}>
            <HeartCrack size={16} strokeWidth={2} />
            {stats.coeursBrises}
          </span>
        </div>

        {!cestMoi && (
          <div className="flex flex-col gap-2">
            {monAvis ? (
              <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                Tu as déjà laissé {monAvis === "coeur" ? "un cœur" : "un cœur brisé"} à cet organisateur.
              </p>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => voter("coeur")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
                >
                  <Heart size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                  <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Cœur</span>
                </button>
                <button
                  type="button"
                  onClick={() => voter("coeur_brise")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
                >
                  <HeartCrack size={17} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
                  <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Cœur brisé</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Trophy size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            Tournois organisés
          </div>
          {tournois.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucun tournoi pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tournois.map((t) => {
                const avisT = compterAvis(t.id);
                return (
                  <Link key={t.id} href={`/tournois/${t.id}`}>
                    <div className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.titre}</div>
                        <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal} · {formatXof(t.cashPrizeXof)}
                        </div>
                      </div>
                      {(avisT.coeurs > 0 || avisT.coeursBrises > 0) && (
                        <div className="flex items-center gap-2 text-xs shrink-0" style={{ fontFamily: "var(--ds-font-mono)" }}>
                          <span className="flex items-center gap-1" style={{ color: "var(--ds-accent-300)" }}><Heart size={11} strokeWidth={2} />{avisT.coeurs}</span>
                          <span className="flex items-center gap-1" style={{ color: "var(--ds-danger)" }}><HeartCrack size={11} strokeWidth={2} />{avisT.coeursBrises}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
