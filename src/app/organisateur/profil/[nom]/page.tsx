"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Camera, Heart, HeartCrack, Pencil, Share2, Trophy, Users, EyeOff, ExternalLink, Plus, Trash2, ShieldCheck, ChevronRight } from "lucide-react";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois, cashPrizeAffiche, type Tournoi } from "@/lib/mockTournaments";
import { BannerCropper } from "@/components/ds/BannerCropper";
import { Modal } from "@/components/ds/Modal";
import { Avatar } from "@/components/ds/Avatar";
import { PRESS } from "@/components/ds/Button";
import { classementOrganisateurs } from "@/lib/mockClassementOrganisateurs";
import { infosSuiviOrganisateur, basculerSuiviOrganisateur, definirMasquageSuivi } from "@/lib/mockSuiviOrganisateur";
import {
  statistiquesReputation,
  nomOrganisateurActuel,
  estOrganisateurCertifie,
  tagOrganisateur,
  definirTagOrganisateur,
  bioOrganisateur,
  definirBioOrganisateur,
  banniereOrganisateur,
  definirBanniereOrganisateur,
  definirNomOrganisateur,
  nomOrganisateurDisponible,
  suggererNomsOrganisateurDisponibles,
  peutChangerNomOrganisateur,
  marquerNomOrganisateurModifie,
  photoOrganisateur,
  definirPhotoOrganisateur,
  reseauxSociauxOrganisateur,
  definirReseauSocial,
  retirerReseauSocial,
  PLATEFORMES_SOCIALES,
  type PlateformeSociale,
  type ReseauSocial,
} from "@/lib/mockOrganisateur";
import { adjointsDe, invitationsRecues, type Adjoint } from "@/lib/mockAdjointsOrganisateur";
import { PhotoCropper } from "@/components/ds/PhotoCropper";
import { compterAvisPlusieurs, monAvisPourOrganisateur, laisserAvisOrganisateur, retirerAvisOrganisateur, type TypeAvis } from "@/lib/mockAvis";
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
  const [followers, setFollowers] = useState<string[]>([]);
  const [masqueFollowers, setMasqueFollowers] = useState(false);
  const [modaleFollowersOuverte, setModaleFollowersOuverte] = useState(false);
  const [editionTag, setEditionTag] = useState(false);
  const [editionBio, setEditionBio] = useState(false);
  const [brouillonTag, setBrouillonTag] = useState("");
  const [brouillonBio, setBrouillonBio] = useState("");
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [avisParTournoi, setAvisParTournoi] = useState<Record<string, { coeurs: number; coeursBrises: number }>>({});
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [editionPhotoOuverte, setEditionPhotoOuverte] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const [editionNom, setEditionNom] = useState(false);
  const [brouillonNom, setBrouillonNom] = useState("");
  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [suggestionsNom, setSuggestionsNom] = useState<string[]>([]);
  const [reseaux, setReseaux] = useState<ReseauSocial[]>([]);
  const [modaleReseauxOuverte, setModaleReseauxOuverte] = useState(false);
  const [plateformeAjout, setPlateformeAjout] = useState<PlateformeSociale>(PLATEFORMES_SOCIALES[0].id);
  const [urlAjout, setUrlAjout] = useState("");
  const [erreurReseau, setErreurReseau] = useState<string | null>(null);
  const [adjoints, setAdjoints] = useState<Adjoint[]>([]);
  const [invitationsEnAttente, setInvitationsEnAttente] = useState<Adjoint[]>([]);
  const adjointsAcceptes = adjoints.filter((a) => a.statut === "accepte");

  const affluence = useMemo(() => {
    if (tournois.length === 0) return 0;
    const total = tournois.reduce((s, t) => s + (t.placesTotal > 0 ? t.placesInscrites / t.placesTotal : 0), 0);
    return Math.round((total / tournois.length) * 100);
  }, [tournois]);

  const tauxAnnulation = useMemo(() => {
    if (tournois.length === 0) return 0;
    const annules = tournois.filter((t) => t.annule).length;
    return Math.round((annules / tournois.length) * 100);
  }, [tournois]);

  async function rafraichir() {
    const tournoisDeCetOrganisateur = (await tousLesTournois()).filter((t) => t.organisateur === nom);
    setTournois(tournoisDeCetOrganisateur);
    setAvisParTournoi(await compterAvisPlusieurs(tournoisDeCetOrganisateur.map((t) => t.id)));
    setStats(await statistiquesReputation(nom));
    setMonAvis(await monAvisPourOrganisateur(nom));
    const infosSuivi = await infosSuiviOrganisateur(nom);
    setSuivi(infosSuivi.suivi);
    setNbFollowers(infosSuivi.compte);
    setFollowers(infosSuivi.followers);
    setMasqueFollowers(infosSuivi.masque);
    const classement = await classementOrganisateurs();
    setRang(classement.findIndex((o) => o.nom === nom) + 1);
    const moi = nomOrganisateurActuel() === nom;
    setCestMoi(moi);
    // Point 158/166 : le badge "certifié" reflète le statut complet
    // (identité vérifiée + demande validée), pas la seule identité — pour un
    // autre organisateur, ce mock mono-appareil n'a pas de vrai registre
    // partagé et affiche toujours certifié (limitation connue).
    setCertifie(moi ? estOrganisateurCertifie() : true);
    if (moi) {
      setTag(await tagOrganisateur());
      setBio(await bioOrganisateur());
      setBanniere(await banniereOrganisateur());
      setPhoto(await photoOrganisateur());
      setReseaux(await reseauxSociauxOrganisateur());
      setAdjoints(await adjointsDe());
      setInvitationsEnAttente(await invitationsRecues());
    } else {
      setReseaux([]);
      setAdjoints([]);
      setInvitationsEnAttente([]);
    }
  }

  useEffect(() => {
    rafraichir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom]);

  if (!connecte) return null;

  const totalAvis = stats.coeurs + stats.coeursBrises;
  const pourcentagePositif = totalAvis > 0 ? Math.round((stats.coeurs / totalAvis) * 100) : 100;

  async function voter(type: TypeAvis) {
    await laisserAvisOrganisateur(nom, type);
    rafraichir();
  }

  async function retirerAvis() {
    await retirerAvisOrganisateur(nom);
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

  function validerNom() {
    const nouveauNom = brouillonNom.trim();
    if (!nouveauNom || nouveauNom === nom) {
      setEditionNom(false);
      return;
    }
    const { ok, prochainChangementLe } = peutChangerNomOrganisateur();
    if (!ok) {
      setErreurNom(`Tu pourras renommer ton profil organisateur à nouveau le ${new Date(prochainChangementLe!).toLocaleDateString("fr-FR")}.`);
      setSuggestionsNom([]);
      return;
    }
    if (!nomOrganisateurDisponible(nouveauNom)) {
      setErreurNom("Ce nom est déjà pris.");
      setSuggestionsNom(suggererNomsOrganisateurDisponibles(nouveauNom));
      return;
    }
    definirNomOrganisateur(nouveauNom);
    marquerNomOrganisateurModifie();
    setErreurNom(null);
    setSuggestionsNom([]);
    setEditionNom(false);
    router.replace(`/organisateur/profil/${encodeURIComponent(nouveauNom)}`);
  }

  async function validerPhoto(dataUrl: string) {
    const { ok, prochainChangementLe } = await definirPhotoOrganisateur(dataUrl);
    if (!ok) {
      setErreurPhoto(`Tu pourras changer ta photo organisateur à nouveau le ${new Date(prochainChangementLe!).toLocaleDateString("fr-FR")}.`);
      return;
    }
    setPhoto(dataUrl);
    setErreurPhoto(null);
    setEditionPhotoOuverte(false);
  }

  async function validerTag() {
    await definirTagOrganisateur(brouillonTag);
    setTag(brouillonTag.trim() || undefined);
    setEditionTag(false);
  }

  async function validerBio() {
    await definirBioOrganisateur(brouillonBio);
    setBio(brouillonBio.trim() || undefined);
    setEditionBio(false);
  }

  async function ajouterReseau() {
    if (!urlAjout.trim()) {
      setErreurReseau("Ajoute le lien direct de ton profil.");
      return;
    }
    await definirReseauSocial(plateformeAjout, urlAjout);
    setReseaux(await reseauxSociauxOrganisateur());
    setUrlAjout("");
    setErreurReseau(null);
  }

  async function supprimerReseau(plateforme: PlateformeSociale) {
    await retirerReseauSocial(plateforme);
    setReseaux(await reseauxSociauxOrganisateur());
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
            onValider={async (dataUrl) => {
              await definirBanniereOrganisateur(dataUrl);
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
          <div className="flex items-end gap-3.5 -mt-[34px]">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setEditionPhotoOuverte(true)}
                className={`relative flex items-center justify-center w-[72px] h-[72px] text-xl font-semibold overflow-hidden ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-lg)",
                  background: "var(--ds-accent-800)",
                  border: "2px solid var(--ds-bg)",
                  boxShadow: certifie ? "0 0 0 1px var(--ds-accent-700)" : "0 0 0 1px var(--ds-border)",
                  color: "var(--ds-accent-300)",
                }}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={nom} className="w-full h-full object-cover" />
                ) : (
                  nom.slice(0, 2).toUpperCase()
                )}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,.45)" }}
                >
                  <Camera size={16} strokeWidth={2} style={{ color: "#fff" }} />
                </div>
              </button>
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
              {editionNom ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={brouillonNom}
                      onChange={(e) => { setBrouillonNom(e.target.value); setErreurNom(null); setSuggestionsNom([]); }}
                      className="flex-1 h-8 px-2.5 text-sm outline-none"
                      style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)" }}
                    />
                    <button type="button" onClick={validerNom} className={`text-xs font-medium ${PRESS}`} style={{ color: "var(--ds-accent-300)" }}>OK</button>
                  </div>
                  {erreurNom && <p className="text-[10px]" style={{ color: "var(--ds-danger)" }}>{erreurNom}</p>}
                  {suggestionsNom.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestionsNom.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setBrouillonNom(s); setErreurNom(null); setSuggestionsNom([]); }}
                          className="px-2 py-1 text-[11px] cursor-pointer"
                          style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setBrouillonNom(nom); setEditionNom(true); }}
                  className={`flex items-center gap-1.5 text-xl truncate ${PRESS}`}
                  style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
                >
                  {nom}
                  <Pencil size={12} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                </button>
              )}
            </div>
          </div>
        )}

        <Modal ouvert={editionPhotoOuverte} titre="Photo organisateur" onFermer={() => setEditionPhotoOuverte(false)}>
          <div className="flex flex-col items-center gap-2 not-italic" style={{ whiteSpace: "normal" }}>
            <PhotoCropper photoActuelle={photo} onValider={validerPhoto} />
            {erreurPhoto && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreurPhoto}</p>}
            <p className="text-[11px]" style={{ color: "var(--ds-muted)" }}>Modifiable une fois par semaine.</p>
          </div>
        </Modal>

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
          {certifie ? (
            <span
              className="px-2.5 py-1 text-[10px]"
              style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", boxShadow: "0 0 0 1px var(--ds-accent-700)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
            >
              CERTIFIÉ
            </span>
          ) : (
            cestMoi && (
              <span
                className="px-2.5 py-1 text-[10px]"
                style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
              >
                STANDARD
              </span>
            )
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
              onChange={(e) => { definirMasquageSuivi(e.target.checked); setMasqueFollowers(e.target.checked); }}
            />
            Masquer mon nombre de followers aux visiteurs de mon profil
          </label>
        )}

        {!cestMoi && (
          <button
            type="button"
            onClick={async () => {
              const r = await basculerSuiviOrganisateur(nom);
              setSuivi(r.suivi);
              setNbFollowers(r.compte);
            }}
            className={`h-[46px] text-sm font-medium ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-md)",
              border: `1px solid ${suivi ? "var(--ds-border)" : "var(--ds-accent)"}`,
              background: suivi ? "transparent" : "var(--ds-accent-900)",
              color: suivi ? "var(--ds-muted)" : "var(--ds-accent-300)",
            }}
          >
            {suivi ? "Suivi ✓" : "Suivre cet organisateur"}
          </button>
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

        {(reseaux.length > 0 || cestMoi) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                Réseaux sociaux
              </div>
              {cestMoi && (
                <button
                  type="button"
                  onClick={() => setModaleReseauxOuverte(true)}
                  className={`flex items-center gap-1 text-xs font-medium ${PRESS}`}
                  style={{ color: "var(--ds-accent-300)" }}
                >
                  <Plus size={12} strokeWidth={2} />
                  Gérer
                </button>
              )}
            </div>
            {reseaux.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                Ajoute tes réseaux pour que les visiteurs de ton profil puissent te suivre.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {reseaux.map((r) => {
                  const meta = PLATEFORMES_SOCIALES.find((p) => p.id === r.plateforme);
                  if (!meta) return null;
                  return (
                    <a
                      key={r.plateforme}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col gap-2.5 p-3 ${PRESS}`}
                      style={{
                        borderRadius: "var(--ds-radius-md)",
                        background: "var(--ds-surface)",
                        border: "1px solid var(--ds-border)",
                        borderLeft: `3px solid ${meta.couleur}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: `color-mix(in srgb, ${meta.couleur} 20%, transparent)` }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.couleur }} />
                        </span>
                        <ExternalLink size={12} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{meta.label}</div>
                        <div className="text-[10px] font-semibold" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                          Suivre →
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <Modal ouvert={modaleReseauxOuverte} titre="Réseaux sociaux" onFermer={() => setModaleReseauxOuverte(false)}>
          <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
            {reseaux.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {reseaux.map((r) => {
                  const meta = PLATEFORMES_SOCIALES.find((p) => p.id === r.plateforme);
                  if (!meta) return null;
                  return (
                    <div key={r.plateforme} className="flex items-center gap-2.5 p-2.5" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)" }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.couleur }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{meta.label}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--ds-muted)" }}>{r.url}</div>
                      </div>
                      <button type="button" onClick={() => supprimerReseau(r.plateforme)} aria-label={`Retirer ${meta.label}`} className={PRESS}>
                        <Trash2 size={13} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: "var(--ds-muted)" }}>Ajouter un réseau</label>
              <select
                value={plateformeAjout}
                onChange={(e) => setPlateformeAjout(e.target.value as PlateformeSociale)}
                className="h-10 px-3 text-sm outline-none cursor-pointer"
                style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)" }}
              >
                {PLATEFORMES_SOCIALES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <input
                value={urlAjout}
                onChange={(e) => { setUrlAjout(e.target.value); setErreurReseau(null); }}
                placeholder="Lien direct (ex: instagram.com/tonprofil)"
                className="h-10 px-3 text-sm outline-none"
                style={{ background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-input)", color: "var(--ds-text)" }}
              />
              {erreurReseau && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreurReseau}</p>}
              <button
                type="button"
                onClick={ajouterReseau}
                className={`h-10 text-sm font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </Modal>

        {cestMoi && (
          <Link
            href="/organisateur/adjoints"
            className={`flex items-center gap-3 p-3.5 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <ShieldCheck size={17} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-300)" }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Adjoints</div>
              <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>
                {adjointsAcceptes.length > 0
                  ? `${adjointsAcceptes.length} adjoint${adjointsAcceptes.length > 1 ? "s" : ""}`
                  : "Personne pour l'instant"}
              </div>
            </div>
            {invitationsEnAttente.length > 0 && (
              <span
                className="px-2 py-0.5 text-[10px] font-semibold shrink-0"
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
              >
                {invitationsEnAttente.length} invitation{invitationsEnAttente.length > 1 ? "s" : ""}
              </span>
            )}
            <ChevronRight size={15} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-muted)" }} />
          </Link>
        )}

        {!cestMoi && monAvis && (
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            Ton avis actuel : {monAvis === "coeur" ? "positif" : "négatif"} — clique de nouveau dessus pour le retirer.
          </p>
        )}

        <div className="flex items-stretch gap-2.5">
          {(() => {
            const actifCoeur = monAvis === "coeur";
            const Composant = cestMoi ? "div" : "button";
            return (
              <Composant
                {...(!cestMoi && { type: "button", onClick: () => clicAvis("coeur"), "aria-label": "Avis positif" })}
                className={`flex-1 flex items-center gap-2.5 p-3 ${cestMoi ? "" : PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: actifCoeur ? "var(--ds-accent-900)" : "var(--ds-surface)",
                  border: `1px solid ${actifCoeur ? "var(--ds-accent)" : "var(--ds-border)"}`,
                }}
              >
                <Heart size={17} strokeWidth={2} fill="currentColor" style={{ color: actifCoeur ? "var(--ds-accent-300)" : "var(--ds-accent-400)" }} />
                <div className="text-lg" style={{ color: actifCoeur ? "var(--ds-accent-300)" : "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}>{stats.coeurs}</div>
              </Composant>
            );
          })()}
          {(() => {
            const actifBrise = monAvis === "coeur_brise";
            const Composant = cestMoi ? "div" : "button";
            return (
              <Composant
                {...(!cestMoi && { type: "button", onClick: () => clicAvis("coeur_brise"), "aria-label": "Avis négatif" })}
                className={`flex-1 flex items-center gap-2.5 p-3 ${cestMoi ? "" : PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: actifBrise ? "color-mix(in srgb, var(--ds-danger) 14%, transparent)" : "var(--ds-surface)",
                  border: `1px solid ${actifBrise ? "var(--ds-danger)" : "var(--ds-border)"}`,
                }}
              >
                <HeartCrack size={17} strokeWidth={2} fill="none" style={{ color: actifBrise ? "var(--ds-danger)" : "var(--ds-muted)" }} />
                <div className="text-lg" style={{ color: actifBrise ? "var(--ds-danger)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{stats.coeursBrises}</div>
              </Composant>
            );
          })()}
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
                const avisT = avisParTournoi[t.id] ?? { coeurs: 0, coeursBrises: 0 };
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

      </div>

      <Modal ouvert={modaleFollowersOuverte} titre={`${nbFollowers} followers`} onFermer={() => setModaleFollowersOuverte(false)}>
        <div className="flex flex-col gap-2 not-italic" style={{ whiteSpace: "normal" }}>
          {followers.map((n) => (
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
