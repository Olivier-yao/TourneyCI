"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Camera, Heart, HeartCrack, Pencil, Share2, Trophy, Users, EyeOff } from "lucide-react";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois, estAnnule, cashPrizeAffiche, type Tournoi } from "@/lib/mockTournaments";
import { BannerCropper } from "@/components/ds/BannerCropper";
import { Modal } from "@/components/ds/Modal";
import { Avatar } from "@/components/ds/Avatar";
import { PRESS } from "@/components/ds/Button";
import { classementOrganisateurs } from "@/lib/mockClassementOrganisateurs";
import {
  suisOrganisateur,
  basculerSuiviOrganisateur,
  compteurFollowers,
  listeFollowers,
  suiviMasque,
  definirMasquageSuivi,
} from "@/lib/mockSuiviOrganisateur";
import {
  statistiquesReputation,
  nomOrganisateurActuel,
  estCertifie,
  tagOrganisateur,
  definirTagOrganisateur,
  bioOrganisateur,
  definirBioOrganisateur,
  banniereOrganisateur,
  definirBanniereOrganisateur,
} from "@/lib/mockOrganisateur";
import { compterAvis, monAvisPourOrganisateur, laisserAvisOrganisateur, retirerAvisOrganisateur, type TypeAvis } from "@/lib/mockAvis";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

function BarreReputation({ label, valeurLabel, pourcentage, accentuee }: { label: string; valeurLabel: string; pourcentage: number; accentuee: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span style={{ color: "var(--ds-muted)" }}>{label}</span>
        <span style={{ color: accentuee ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{valeurLabel}</span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--ds-surface-2)" }}>
        <div
          className="h-[3px] rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, pourcentage))}%`,
            background: accentuee ? "linear-gradient(90deg, var(--ds-accent-700), var(--ds-accent-400))" : "var(--ds-border-strong)",
          }}
        />
      </div>
    </div>
  );
}

export default function ProfilOrganisateurPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ nom: string }>();
  const router = useRouter();
  const nom = decodeURIComponent(params.nom);

  const [stats, setStats] = useState({ coeurs: 0, coeursBrises: 0 });
  const [monAvis, setMonAvis] = useState<TypeAvis | null>(null);
  const [switchEnAttente, setSwitchEnAttente] = useState<TypeAvis | null>(null);
  const [cestMoi, setCestMoi] = useState(false);
  const [certifie, setCertifie] = useState(false);
  const [rang, setRang] = useState(0);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [bio, setBio] = useState<string | undefined>(undefined);
  const [banniere, setBanniere] = useState<string | undefined>(undefined);
  const [editionBanniereOuverte, setEditionBanniereOuverte] = useState(false);
  const [suivi, setSuivi] = useState(false);
  const [nbFollowers, setNbFollowers] = useState(0);
  const [masqueFollowers, setMasqueFollowers] = useState(false);
  const [modaleFollowersOuverte, setModaleFollowersOuverte] = useState(false);
  const [editionTag, setEditionTag] = useState(false);
  const [editionBio, setEditionBio] = useState(false);
  const [brouillonTag, setBrouillonTag] = useState("");
  const [brouillonBio, setBrouillonBio] = useState("");
  const [tournois, setTournois] = useState<Tournoi[]>([]);

  const affluence = useMemo(() => {
    if (tournois.length === 0) return 0;
    const total = tournois.reduce((s, t) => s + (t.placesTotal > 0 ? t.placesInscrites / t.placesTotal : 0), 0);
    return Math.round((total / tournois.length) * 100);
  }, [tournois]);

  const tauxAnnulation = useMemo(() => {
    if (tournois.length === 0) return 0;
    const annules = tournois.filter((t) => t.annule || estAnnule(t.id)).length;
    return Math.round((annules / tournois.length) * 100);
  }, [tournois]);

  function rafraichir() {
    setTournois(tousLesTournois().filter((t) => t.organisateur === nom));
    setStats(statistiquesReputation(nom));
    setMonAvis(monAvisPourOrganisateur(nom)?.type ?? null);
    setSuivi(suisOrganisateur(nom));
    setNbFollowers(compteurFollowers(nom));
    setMasqueFollowers(suiviMasque(nom));
    const classement = classementOrganisateurs();
    setRang(classement.findIndex((o) => o.nom === nom) + 1);
    const moi = nomOrganisateurActuel() === nom;
    setCestMoi(moi);
    setCertifie(moi ? estCertifie() : true);
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

  const totalAvis = stats.coeurs + stats.coeursBrises;
  const pourcentagePositif = totalAvis > 0 ? Math.round((stats.coeurs / totalAvis) * 100) : 100;

  function voter(type: TypeAvis) {
    laisserAvisOrganisateur(nom, type);
    rafraichir();
  }

  function retirerAvis() {
    retirerAvisOrganisateur(nom);
    rafraichir();
  }

  /** Clic direct sur l'icône (point 112) : toggle si c'est déjà mon avis
   * actuel, vote immédiat si je n'ai encore rien laissé, confirmation avant
   * remplacement si je bascule d'un type à l'autre (point 113). */
  function clicAvis(type: TypeAvis) {
    if (monAvis === type) {
      retirerAvis();
      return;
    }
    if (monAvis) {
      setSwitchEnAttente(type);
      return;
    }
    voter(type);
  }

  function confirmerSwitch() {
    if (switchEnAttente) voter(switchEnAttente);
    setSwitchEnAttente(null);
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

  async function partager() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: nom });
        return;
      } catch {
        // annulé ou indisponible : on retombe sur la copie
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="relative" style={{ height: 172 }}>
        {banniere ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banniere} alt={`Bannière de ${nom}`} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "repeating-linear-gradient(135deg, var(--ds-surface-2) 0 12px, var(--ds-surface) 12px 24px)",
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, var(--ds-bg))" }} />
        <button
          type="button"
          onClick={() => router.back()}
          className={`absolute top-[42px] left-[18px] flex items-center justify-center w-8 h-8 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={partager}
          className={`absolute top-[42px] right-[18px] flex items-center justify-center w-8 h-8 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          aria-label="Partager"
        >
          <Share2 size={14} strokeWidth={2} />
        </button>
        {cestMoi && (
          <button
            type="button"
            onClick={() => setEditionBanniereOuverte(true)}
            className={`absolute bottom-3 right-[18px] flex items-center gap-1.5 px-3 h-8 text-xs font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-pill)", background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          >
            <Camera size={13} strokeWidth={2} />
            {banniere ? "Changer" : "Ajouter une bannière"}
          </button>
        )}
      </div>

      <Modal ouvert={editionBanniereOuverte} titre="Bannière du profil" onFermer={() => setEditionBanniereOuverte(false)}>
        <div className="not-italic" style={{ whiteSpace: "normal" }}>
          <BannerCropper
            banniereActuelle={banniere}
            onValider={(dataUrl) => {
              definirBanniereOrganisateur(dataUrl);
              setBanniere(dataUrl);
              setEditionBanniereOuverte(false);
            }}
          />
        </div>
      </Modal>

      <div className="flex flex-col px-5 py-4 gap-4">
        {!cestMoi && (
          <div className="flex items-end gap-3.5 -mt-[34px]">
            <div className="relative shrink-0">
              <div
                className="w-[72px] h-[72px] flex items-center justify-center text-xl font-semibold"
                style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-accent-800)", border: "2px solid var(--ds-bg)", boxShadow: "0 0 0 1px var(--ds-accent-700)", color: "var(--ds-accent-300)" }}
              >
                {nom.slice(0, 2).toUpperCase()}
              </div>
              {certifie && (
                <div
                  className="absolute -right-1 -bottom-1 w-6 h-6 flex items-center justify-center"
                  style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-700)", border: "2px solid var(--ds-bg)", color: "var(--ds-accent-100)" }}
                >
                  <BadgeCheck size={13} strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="pb-1 min-w-0 flex-1">
              <div className="text-xl truncate" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
                {nom}
              </div>
              {tag && <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>@{tag}</div>}
            </div>
          </div>
        )}

        {cestMoi && (
          <div className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            {nom}
          </div>
        )}

        {cestMoi &&
          (editionTag ? (
            <div className="flex items-center gap-2 -mt-2">
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
              onClick={() => { setBrouillonTag(tag ?? ""); setEditionTag(true); }}
              className={`flex items-center gap-1 text-xs -mt-2 self-start ${PRESS}`}
              style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
            >
              {tag ? `@${tag}` : "Ajouter un TAG"}
              <Pencil size={10} strokeWidth={2} />
            </button>
          ))}

        <div className="flex items-center gap-2 flex-wrap">
          {certifie && (
            <span
              className="px-2.5 py-1 text-[10px]"
              style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", boxShadow: "0 0 0 1px var(--ds-accent-700)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
            >
              CERTIFIÉ
            </span>
          )}
          {rang > 0 && (
            <span
              className="px-2.5 py-1 text-[10px]"
              style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
            >
              #{rang} ORGANISATEURS
            </span>
          )}
          {(cestMoi || !masqueFollowers) && (
            <button
              type="button"
              onClick={() => setModaleFollowersOuverte(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
            >
              <Users size={11} strokeWidth={2} />
              {nbFollowers} FOLLOWERS
              {cestMoi && masqueFollowers && <EyeOff size={11} strokeWidth={2} />}
            </button>
          )}
        </div>

        {cestMoi && (
          <label className="flex items-center gap-2 text-xs cursor-pointer -mt-1" style={{ color: "var(--ds-muted)" }}>
            <input
              type="checkbox"
              checked={masqueFollowers}
              onChange={(e) => { definirMasquageSuivi(nom, e.target.checked); setMasqueFollowers(e.target.checked); }}
            />
            Masquer mon nombre de followers aux visiteurs de mon profil
          </label>
        )}

        {editionBio ? (
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
          (bio || cestMoi) && (
            <button
              type="button"
              onClick={cestMoi ? () => { setBrouillonBio(bio ?? ""); setEditionBio(true); } : undefined}
              className={`text-left text-sm leading-relaxed ${cestMoi ? PRESS : ""}`}
              style={{ color: bio ? "var(--ds-text-muted)" : "var(--ds-muted)", whiteSpace: "pre-wrap" }}
            >
              {bio || (cestMoi ? "Ajoute une bio pour te présenter →" : "")}
            </button>
          )
        )}

        <div className="flex items-stretch gap-2.5">
          <div className="flex-1 flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <Heart size={17} strokeWidth={2} fill="currentColor" style={{ color: "var(--ds-accent-400)" }} />
            <div className="text-lg" style={{ fontFamily: "var(--ds-font-mono)" }}>{stats.coeurs}</div>
          </div>
          <div className="flex-1 flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <HeartCrack size={17} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
            <div className="text-lg" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{stats.coeursBrises}</div>
          </div>
        </div>

        {tournois.length > 0 && (
          <div className="p-3.5 flex flex-col gap-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Réputation</div>
              <div className="text-xs" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{pourcentagePositif} %</div>
            </div>
            <BarreReputation label="Affluence moyenne" valeurLabel={`${affluence} %`} pourcentage={affluence} accentuee={affluence >= 60} />
            <BarreReputation label="Retours positifs" valeurLabel={totalAvis > 0 ? `${pourcentagePositif} %` : "—"} pourcentage={pourcentagePositif} accentuee={pourcentagePositif >= 60} />
            <BarreReputation label="Tournois annulés" valeurLabel={`${tauxAnnulation} %`} pourcentage={tauxAnnulation} accentuee={false} />
          </div>
        )}

        {!cestMoi && (
          <div className="flex flex-col gap-2">
            {monAvis && (
              <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                Ton avis actuel : {monAvis === "coeur" ? "positif" : "négatif"} — clique de nouveau dessus pour le retirer.
              </p>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => clicAvis("coeur")}
                aria-label="Avis positif"
                className={`flex-1 flex flex-col items-center py-3 ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  border: `1px solid ${monAvis === "coeur" ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  background: monAvis === "coeur" ? "var(--ds-accent-900)" : "transparent",
                }}
              >
                <Heart size={19} strokeWidth={2} fill={monAvis === "coeur" ? "currentColor" : "none"} style={{ color: "var(--ds-accent-300)" }} />
              </button>
              <button
                type="button"
                onClick={() => clicAvis("coeur_brise")}
                aria-label="Avis négatif"
                className={`flex-1 flex flex-col items-center py-3 ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  border: `1px solid ${monAvis === "coeur_brise" ? "var(--ds-danger)" : "var(--ds-border)"}`,
                  background: monAvis === "coeur_brise" ? "color-mix(in srgb, var(--ds-danger) 14%, transparent)" : "transparent",
                }}
              >
                <HeartCrack size={19} strokeWidth={2} fill={monAvis === "coeur_brise" ? "currentColor" : "none"} style={{ color: "var(--ds-danger)" }} />
              </button>
            </div>
          </div>
        )}

        <Modal ouvert={switchEnAttente !== null} titre="Changer ton avis ?" onFermer={() => setSwitchEnAttente(null)}>
          <p className="not-italic" style={{ whiteSpace: "normal" }}>
            Tu as déjà laissé un avis {monAvis === "coeur" ? "positif" : "négatif"} sur cet organisateur. Le remplacer par un avis {switchEnAttente === "coeur" ? "positif" : "négatif"} ?
          </p>
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setSwitchEnAttente(null)}
              className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmerSwitch}
              className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
            >
              Confirmer
            </button>
          </div>
        </Modal>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              <Trophy size={13} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
              Tournois · {tournois.length}
            </div>
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
                          {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal} · {formatXof(cashPrizeAffiche(t))}
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

        {!cestMoi && (
          <button
            type="button"
            onClick={() => {
              setSuivi(basculerSuiviOrganisateur(nom));
              setNbFollowers(compteurFollowers(nom));
            }}
            className={`h-[46px] text-sm font-medium mb-2 ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-md)",
              border: `1px solid ${suivi ? "var(--ds-border)" : "var(--ds-accent)"}`,
              color: suivi ? "var(--ds-muted)" : "var(--ds-accent-300)",
            }}
          >
            {suivi ? "Suivi ✓" : "Suivre cet organisateur"}
          </button>
        )}
      </div>

      <Modal ouvert={modaleFollowersOuverte} titre={`${nbFollowers} followers`} onFermer={() => setModaleFollowersOuverte(false)}>
        <div className="flex flex-col gap-2 not-italic" style={{ whiteSpace: "normal" }}>
          {listeFollowers(nom).map((n) => (
            <div key={n} className="flex items-center gap-3">
              <Avatar initiales={n.slice(0, 2).toUpperCase()} taille={30} />
              <span className="text-sm" style={{ color: "var(--ds-text)" }}>{n}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
