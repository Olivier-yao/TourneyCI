"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Bell, CheckCircle2, Users, Pencil, Check as CheckIcon, Sparkles, Crown, Radio, Plus } from "lucide-react";
import Link from "next/link";
import { Button, PRESS } from "@/components/ds/Button";
import { Field } from "@/components/ds/Input";
import { Modal } from "@/components/ds/Modal";
import { Avatar } from "@/components/ds/Avatar";
import { EcussonEquipe } from "@/components/ds/Palier";
import { formatXof } from "@/lib/formatXof";
import { estFavori, basculerFavori } from "@/lib/mockFavoris";
import { estInscrit, inscriptionDe, renommerEquipe, enregistrerInscription } from "@/lib/mockInscriptions";
import { notifsActivees, basculerNotifsTournoi } from "@/lib/mockNotifications";
import { lireProfil, attendreProfil } from "@/lib/mockProfil";
import { monSoutienPourOrganisateur, soutenirOrganisateur } from "@/lib/mockSoutien";
import {
  equipesDuTournoi,
  equipeParId,
  equipeDeJoueur,
  creerEquipeBR,
  demanderRejoindre,
  aUneDemandeEnAttente,
  rejoindreEquipeAleatoire,
  ajouterMembresDirect,
  TAILLE_EQUIPE_BR,
  type EquipeBR,
} from "@/lib/mockEquipesBR";
import { equipesProfilDontChef, equipesProfilDontMembreNonChef, type EquipeProfil } from "@/lib/mockEquipesProfil";
import { proposerInscriptionEquipe } from "@/lib/mockPropositionsEquipe";
import { LABEL_UNITE_BR, type SousTypeBR } from "@/lib/mockBattleRoyale";
import type { EquipeInfo, ModeEquipe, TypeCompetition } from "@/lib/mockTournaments";

export function CtaInscription({
  tournoiId,
  titre,
  jeuLabel,
  dateLabel,
  fraisXof,
  typeCompetition,
  equipes,
  modeEquipe,
  brSousType,
  organisateur,
  equipePreselectionneeId,
  tournoiCommence = false,
  fermeInscriptions = false,
  estMonTournoi = false,
  enDirect = false,
  onHauteurChange,
}: {
  tournoiId: string;
  titre: string;
  jeuLabel: string;
  dateLabel: string;
  fraisXof: number;
  typeCompetition: TypeCompetition;
  equipes?: EquipeInfo[];
  modeEquipe?: ModeEquipe;
  brSousType?: SousTypeBR;
  organisateur: string;
  equipePreselectionneeId?: string;
  tournoiCommence?: boolean;
  fermeInscriptions?: boolean;
  estMonTournoi?: boolean;
  enDirect?: boolean;
  /** Hauteur réelle (px) de la barre fixe du bas — ce composant a plusieurs
   * variantes de hauteur très différente (simple bouton "S'inscrire" vs.
   * bannières d'invitation d'équipe empilées), donc un padding-bottom fixe
   * côté page ne suffit jamais à toutes les couvrir sans se chevaucher avec
   * le contenu au-dessus. La page appelante réserve cet espace dynamiquement
   * plutôt que de deviner une valeur. */
  onHauteurChange?: (px: number) => void;
}) {
  const router = useRouter();
  const barreRef = useRef<HTMLDivElement>(null);

  // Mesure synchrone (avant peinture) à chaque rendu : couvre le cas le plus
  // fréquent, une bannière qui apparaît/disparaît suite à un changement
  // d'état React (invitation d'équipe, renommage...). Le ResizeObserver en
  // complément couvre les cas plus rares où la taille change sans re-rendu
  // React (redimensionnement de fenêtre, retour de police).
  useLayoutEffect(() => {
    if (barreRef.current && onHauteurChange) onHauteurChange(barreRef.current.offsetHeight);
  });

  useEffect(() => {
    const el = barreRef.current;
    if (!el || !onHauteurChange) return;
    const observer = new ResizeObserver((entries) => {
      const hauteur = entries[0]?.contentRect.height;
      if (hauteur !== undefined) onHauteurChange(el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  });
  const estEquipes = typeCompetition === "equipes";
  const estBREquipes = typeCompetition === "battle_royale" && brSousType && brSousType !== "solo";
  const [choixEquipe, setChoixEquipe] = useState(false);
  const [nomEquipe, setNomEquipe] = useState("");
  const [creationEquipeManuelle, setCreationEquipeManuelle] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [favori, setFavori] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const [inscrit, setInscrit] = useState(false);
  const [equipeInscrite, setEquipeInscrite] = useState<string | undefined>(undefined);
  const [renommage, setRenommage] = useState(false);
  const [nouveauNomEquipe, setNouveauNomEquipe] = useState("");
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [equipeEnAttente, setEquipeEnAttente] = useState<string | undefined>(undefined);
  const [equipeIdEnAttente, setEquipeIdEnAttente] = useState<string | undefined>(undefined);
  const [choixTag, setChoixTag] = useState(false);
  const [monPseudo, setMonPseudo] = useState("");
  const [tagPerso, setTagPerso] = useState("");
  const [tagEnAttente, setTagEnAttente] = useState<string | undefined>(undefined);
  const [presenceAcceptee, setPresenceAcceptee] = useState(false);
  const [montantEnAttente, setMontantEnAttente] = useState(fraisXof);

  const [etapeBR, setEtapeBR] = useState<"menu" | "creer" | "rejoindre" | "precreees" | "proposer" | null>(null);
  const [equipesProfilChef, setEquipesProfilChef] = useState<EquipeProfil[]>([]);
  const [equipesProfilMembre, setEquipesProfilMembre] = useState<EquipeProfil[]>([]);
  const [propositionEnvoyee, setPropositionEnvoyee] = useState<string | null>(null);
  const [equipesBR, setEquipesBR] = useState<EquipeBR[]>([]);
  const [demandesEnAttenteParEquipe, setDemandesEnAttenteParEquipe] = useState<Record<string, boolean>>({});
  const [nomEquipeBR, setNomEquipeBR] = useState("");
  const [payerPourEquipe, setPayerPourEquipe] = useState(false);
  const [equipeInvitee, setEquipeInvitee] = useState<EquipeBR | undefined>(undefined);
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false);
  const [equipeEnAttentePaiement, setEquipeEnAttentePaiement] = useState<EquipeBR | undefined>(undefined);

  const [soutien, setSoutien] = useState(false);
  const [soutienModalOuvert, setSoutienModalOuvert] = useState(false);
  const [monEquipeChef, setMonEquipeChef] = useState<EquipeBR | undefined>(undefined);

  useEffect(() => {
    // Lu depuis le localStorage/l'API : état neutre au premier rendu serveur,
    // synchronisé côté client une fois monté (cf. LanceurApp.tsx).
    async function charger() {
      setFavori(await estFavori(tournoiId));
      setNotifs(await notifsActivees(tournoiId));
      setSoutien(await monSoutienPourOrganisateur(organisateur));
      await attendreProfil();
      const profil = lireProfil();
      setMonPseudo(profil.pseudo);
      setEquipesProfilChef(await equipesProfilDontChef());
      setEquipesProfilMembre(await equipesProfilDontMembreNonChef());

      const equipeConfirmee = estBREquipes ? await equipeDeJoueur(tournoiId) : undefined;
      const dejaInscrit = await estInscrit(tournoiId);
      if (!dejaInscrit && equipeConfirmee) {
        if (fraisXof === 0 || equipeConfirmee.paiementCouvert) {
          await enregistrerInscription(tournoiId, undefined, equipeConfirmee.nom);
        } else {
          setEquipeEnAttentePaiement(equipeConfirmee);
        }
      }
      setInscrit(await estInscrit(tournoiId));
      setEquipeInscrite((await inscriptionDe(tournoiId))?.equipe);
      setMonEquipeChef(equipeConfirmee && equipeConfirmee.chef === profil.pseudo ? equipeConfirmee : undefined);

      if (estBREquipes && equipePreselectionneeId && !dejaInscrit && !equipeConfirmee) {
        const equipe = await equipeParId(equipePreselectionneeId);
        setEquipeInvitee(equipe);
        setDemandeEnvoyee(equipe ? await aUneDemandeEnAttente(equipe.id) : false);
      }

      if (estBREquipes) {
        const equipes = await equipesDuTournoi(tournoiId);
        setEquipesBR(equipes);
        const pendingEntries = await Promise.all(equipes.map(async (e) => [e.id, await aUneDemandeEnAttente(e.id)] as const));
        setDemandesEnAttenteParEquipe(Object.fromEntries(pendingEntries));
      }
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournoiId]);

  function allerAuPaiement(opts: { equipe?: string; tag?: string; montant?: number; equipeId?: string }) {
    const params = new URLSearchParams();
    if (opts.equipe) params.set("equipe", opts.equipe);
    if (opts.tag) params.set("tag", opts.tag);
    if (opts.montant !== undefined) params.set("montant", String(opts.montant));
    if (opts.equipeId) params.set("equipeId", opts.equipeId);
    const query = params.toString();
    router.push(`/paiement/${tournoiId}${query ? `?${query}` : ""}`);
  }

  function demarrerInscription(equipe?: string, tag?: string, equipeId?: string, montant = fraisXof) {
    // Gratuit ou payant : toujours une étape de confirmation récapitulative
    // (+ avertissement présence obligatoire) avant de finaliser l'inscription
    // ou d'envoyer la demande de paiement Mobile Money.
    setEquipeEnAttente(equipe);
    setEquipeIdEnAttente(equipeId);
    setTagEnAttente(tag);
    setMontantEnAttente(montant);
    setPresenceAcceptee(false);
    setConfirmationOuverte(true);
  }

  async function confirmerInscription() {
    if (!presenceAcceptee) return;
    if (montantEnAttente === 0) {
      const resultat = await enregistrerInscription(tournoiId, tagEnAttente, equipeEnAttente);
      if (!resultat.ok) {
        setErreur(resultat.erreur ?? "Erreur lors de l'inscription.");
        return;
      }
      setConfirmationOuverte(false);
      setInscrit(true);
      setEquipeInscrite(equipeEnAttente);
      setEquipeEnAttentePaiement(undefined);
      return;
    }
    setConfirmationOuverte(false);
    allerAuPaiement({ equipe: equipeEnAttente, tag: tagEnAttente, montant: montantEnAttente, equipeId: equipeIdEnAttente });
  }

  function onClicInscription() {
    if (estEquipes) {
      setChoixEquipe(true);
      return;
    }
    if (estBREquipes) {
      setEtapeBR("menu");
      return;
    }
    setChoixTag(true);
  }

  function validerEquipe() {
    if (!nomEquipe.trim()) {
      setErreur("Choisis ou saisis le nom de ton équipe.");
      return;
    }
    demarrerInscription(nomEquipe.trim());
  }

  function validerTag() {
    const tag = tagPerso.trim();
    if (!tag) {
      setErreur("Saisis ton TAG pour ce tournoi.");
      return;
    }
    setErreur(null);
    demarrerInscription(undefined, tag);
  }

  async function validerEquipeBR() {
    if (!nomEquipeBR.trim()) {
      setErreur("Choisis un nom pour ton équipe.");
      return;
    }
    if (!brSousType || brSousType === "solo") return;
    setErreur(null);
    const equipe = await creerEquipeBR(tournoiId, nomEquipeBR.trim(), false);
    setMonEquipeChef(equipe);
    const taille = TAILLE_EQUIPE_BR[brSousType];
    const montant = payerPourEquipe ? fraisXof * taille : fraisXof;
    setEtapeBR(null);
    demarrerInscription(equipe.nom, undefined, payerPourEquipe ? equipe.id : undefined, montant);
  }

  /** Point 140 : utilise une équipe pré-créée du profil au lieu de recréer un
   * groupe éphémère de zéro — les membres sont intégrés directement (déjà
   * validés par le chef en amont), sans passer par la file de demandes. */
  async function utiliserEquipeProfil(ep: EquipeProfil) {
    if (!brSousType || brSousType === "solo") return;
    const equipe = await creerEquipeBR(tournoiId, ep.nom, false);
    await ajouterMembresDirect(equipe.id, ep.membres.filter((m) => m !== monPseudo));
    const equipeAvecMembres = { ...equipe, membres: [...new Set([...equipe.membres, ...ep.membres])] };
    setMonEquipeChef(equipeAvecMembres);
    setEtapeBR(null);
    demarrerInscription(equipe.nom, undefined, undefined, fraisXof);
  }

  /** Point 192 : un membre non-chef ne peut que proposer — le chef doit
   * valider depuis "Mes équipes" pour que l'inscription se lance réellement. */
  async function proposerEquipe(ep: EquipeProfil) {
    await proposerInscriptionEquipe(ep.id, tournoiId);
    setPropositionEnvoyee(ep.nom);
    setEtapeBR(null);
  }

  async function validerEquipeAleatoire() {
    if (!brSousType || brSousType === "solo") return;
    const equipe = await rejoindreEquipeAleatoire(tournoiId, brSousType);
    setEtapeBR(null);
    demarrerInscription(equipe.nom, undefined, undefined, fraisXof);
  }

  async function demanderRejoindreEquipe(equipe: EquipeBR) {
    await demanderRejoindre(equipe.id);
    setEquipeInvitee(equipe);
    setDemandeEnvoyee(true);
    setDemandesEnAttenteParEquipe((v) => ({ ...v, [equipe.id]: true }));
    setEtapeBR(null);
  }

  function payerPourFinaliserAdhesion() {
    if (!equipeEnAttentePaiement) return;
    demarrerInscription(equipeEnAttentePaiement.nom, undefined, undefined, fraisXof);
  }

  async function validerRenommage() {
    if (!nouveauNomEquipe.trim()) return;
    const resultat = await renommerEquipe(tournoiId, nouveauNomEquipe.trim());
    if (!resultat.ok) return;
    setEquipeInscrite(nouveauNomEquipe.trim());
    setRenommage(false);
  }

  async function envoyerSoutien() {
    await soutenirOrganisateur(organisateur, tournoiId);
    setSoutien(true);
  }

  const boutonSoutien = (
    <button
      type="button"
      onClick={() => setSoutienModalOuvert(true)}
      className={`flex items-center justify-center w-10 h-10 shrink-0 ${PRESS}`}
      style={{
        borderRadius: "var(--ds-radius-md)",
        border: `1px solid ${soutien ? "var(--ds-accent)" : "var(--ds-border)"}`,
        color: soutien ? "var(--ds-accent-300)" : "var(--ds-muted)",
      }}
      aria-label="Soutenir l'organisateur"
    >
      <Sparkles size={17} strokeWidth={2} fill={soutien ? "currentColor" : "none"} />
    </button>
  );

  const modaleSoutien = (
    <Modal ouvert={soutienModalOuvert} titre="Soutenir l'organisateur" onFermer={() => setSoutienModalOuvert(false)}>
      <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
        {soutien ? (
          <p className="text-sm">Tu as déjà envoyé ton soutien à {organisateur}. Merci !</p>
        ) : (
          <>
            <p className="text-sm">
              Montre à <strong>{organisateur}</strong> que tu apprécies l&apos;organisation de ses tournois — ce
              soutien alimente un indicateur sur son profil, distinct des avis laissés en fin de tournoi.
            </p>
            <button
              type="button"
              onClick={envoyerSoutien}
              className={`h-10 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
            >
              Envoyer mon soutien
            </button>
          </>
        )}
      </div>
    </Modal>
  );

  if (estMonTournoi) {
    return (
      <div
        ref={barreRef}
        className="fixed bottom-0 left-0 right-0 px-5 py-4 flex items-center gap-3"
        style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}
      >
        <Link
          href={`/tournois/${tournoiId}/inscrits`}
          className="flex items-center justify-center w-10 h-10 shrink-0"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          aria-label="Voir la liste des inscrits"
        >
          <Users size={18} strokeWidth={2} />
        </Link>
        <Link href={`/organisateur/${tournoiId}/gestion`} className="flex-1 relative">
          <Button variante="primary" bloc>
            Régie du tournoi
          </Button>
          {enDirect && (
            <span
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 animate-pulse"
              style={{ borderRadius: "50%", background: "var(--ds-danger)", boxShadow: "0 0 0 2px var(--ds-bg)" }}
              aria-label="Tournoi en direct — attention requise"
              title="Tournoi en direct — attention requise"
            />
          )}
        </Link>
      </div>
    );
  }

  if (inscrit) {
    return (
      <div
        ref={barreRef}
        className="fixed bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-2.5"
        style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}
      >
        {renommage && (
          <div className="flex flex-col gap-2">
            <Field
              label="Nouveau nom d'équipe"
              value={nouveauNomEquipe}
              onChange={(e) => setNouveauNomEquipe(e.target.value)}
              placeholder={equipeInscrite}
            />
          </div>
        )}
        {equipeInscrite && tournoiCommence && !renommage && (
          <p className="text-[11px]" style={{ color: "var(--ds-muted)" }}>
            Le nom de l&apos;équipe ne peut plus être modifié : le tournoi a déjà commencé.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Link
            href={`/tournois/${tournoiId}/inscrits`}
            className="flex items-center justify-center w-10 h-10 shrink-0"
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
            aria-label="Voir la liste des inscrits"
          >
            <Users size={18} strokeWidth={2} />
          </Link>
          {monEquipeChef && (
            <Link
              href={`/tournois/${tournoiId}/equipe/${monEquipeChef.id}`}
              className={`flex items-center justify-center w-10 h-10 shrink-0 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              aria-label="Gérer mon équipe"
            >
              <Crown size={17} strokeWidth={2} />
            </Link>
          )}
          {boutonSoutien}
          <button
            type="button"
            onClick={() => basculerNotifsTournoi(tournoiId).then(setNotifs)}
            className={`flex items-center justify-center w-10 h-10 shrink-0 ${PRESS}`}
            style={{
              borderRadius: "var(--ds-radius-md)",
              border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`,
              color: notifs ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
            aria-label={notifs ? "Désactiver les notifications" : "Activer les notifications"}
          >
            <Bell size={18} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
          </button>
          {equipeInscrite && !tournoiCommence && (
            <button
              type="button"
              onClick={() => {
                if (renommage) {
                  validerRenommage();
                } else {
                  setNouveauNomEquipe(equipeInscrite ?? "");
                  setRenommage(true);
                }
              }}
              className={`flex items-center justify-center w-10 h-10 shrink-0 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
              aria-label={renommage ? "Valider le nouveau nom" : "Renommer l'équipe"}
            >
              {renommage ? <CheckIcon size={18} strokeWidth={2} /> : <Pencil size={16} strokeWidth={2} />}
            </button>
          )}
          <div
            className="flex-1 h-[46px] flex items-center justify-center gap-2 text-[15px] font-medium"
            style={{
              borderRadius: "var(--ds-radius-btn)",
              background: "var(--ds-accent-900)",
              color: "var(--ds-accent-300)",
            }}
          >
            <CheckCircle2 size={17} strokeWidth={2} />
            Déjà inscrit{equipeInscrite ? ` · ${equipeInscrite}` : ""}
          </div>
        </div>
        {modaleSoutien}
      </div>
    );
  }

  return (
    <div
      ref={barreRef}
      className="fixed bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-3"
      style={{ background: "var(--ds-bg)", borderTop: "1px solid var(--ds-border)" }}
    >
      {equipeEnAttentePaiement && (
        <div
          className="flex items-center gap-2.5 p-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          <CheckCircle2 size={16} strokeWidth={2} className="shrink-0" />
          <div className="flex-1 text-sm">
            Tu as été accepté dans l&apos;équipe <strong>{equipeEnAttentePaiement.nom}</strong> — finalise ton
            inscription pour confirmer ta place.
          </div>
          <button
            type="button"
            onClick={payerPourFinaliserAdhesion}
            className={`px-3 py-1.5 text-xs font-semibold shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Finaliser
          </button>
        </div>
      )}

      {equipeInvitee && !equipeEnAttentePaiement && (
        <div
          className="flex items-center gap-2.5 p-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <Avatar initiales={equipeInvitee.nom.slice(0, 2).toUpperCase()} taille={32} />
          <div className="flex-1 text-sm">
            {demandeEnvoyee ? (
              <>Demande envoyée pour rejoindre <strong>{equipeInvitee.nom}</strong> — en attente de validation du chef d&apos;équipe.</>
            ) : (
              <>Tu es invité à rejoindre <strong>{equipeInvitee.nom}</strong>.</>
            )}
          </div>
          {!demandeEnvoyee && (
            <button
              type="button"
              onClick={() => demanderRejoindreEquipe(equipeInvitee)}
              className={`px-3 py-1.5 text-xs font-semibold shrink-0 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
            >
              Rejoindre
            </button>
          )}
        </div>
      )}

      {propositionEnvoyee && (
        <div
          className="flex items-center gap-2.5 p-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <CheckCircle2 size={16} strokeWidth={2} className="shrink-0" style={{ color: "var(--ds-accent-300)" }} />
          <div className="flex-1 text-sm">
            Proposition envoyée au chef de <strong>{propositionEnvoyee}</strong> — l&apos;inscription se finalisera après sa validation.
          </div>
        </div>
      )}

      {monEquipeChef && !tournoiCommence && (
        <Link
          href={`/tournois/${tournoiId}/equipe/${monEquipeChef.id}`}
          className={`flex items-center gap-2.5 p-3 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-accent)" }}
        >
          <Crown size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
          <div className="flex-1 text-sm">
            Équipe <strong>{monEquipeChef.nom}</strong> · {monEquipeChef.membres.length} membre{monEquipeChef.membres.length > 1 ? "s" : ""}
          </div>
          <span className="text-xs font-semibold shrink-0" style={{ color: "var(--ds-accent-300)" }}>
            Gérer
          </span>
        </Link>
      )}

      {choixEquipe && (
        <div className="flex flex-col gap-2.5">
          {modeEquipe === "predefinies" && equipes && equipes.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {equipes.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setNomEquipe(e.nom)}
                  className={`px-3 py-2 text-sm ${PRESS}`}
                  style={{
                    borderRadius: "var(--ds-radius-pill)",
                    border: `1px solid ${nomEquipe === e.nom ? "var(--ds-accent)" : "var(--ds-border)"}`,
                    color: nomEquipe === e.nom ? "var(--ds-accent-300)" : "var(--ds-text)",
                  }}
                >
                  {e.nom}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {equipesProfilChef.length > 0 && !creationEquipeManuelle ? (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    Mes équipes
                  </div>
                  {equipesProfilChef.map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setNomEquipe(ep.nom)}
                      className={`flex items-center gap-3 p-2.5 text-left ${PRESS}`}
                      style={{
                        borderRadius: "var(--ds-radius-md)",
                        background: "var(--ds-surface)",
                        boxShadow: nomEquipe === ep.nom ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)",
                      }}
                    >
                      <EcussonEquipe initiales={ep.nom.slice(0, 2).toUpperCase()} style={nomEquipe === ep.nom ? "accent" : "neutre"} largeur={36} hauteur={42} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ep.nom}</div>
                        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {ep.membres.length} membre{ep.membres.length > 1 ? "s" : ""}
                        </div>
                      </div>
                      {nomEquipe === ep.nom && <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCreationEquipeManuelle(true);
                      setNomEquipe("");
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 text-sm font-medium ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border-strong)", color: "var(--ds-muted)" }}
                  >
                    <Plus size={15} strokeWidth={2} />
                    Créer une équipe pour ce tournoi
                  </button>
                </div>
              ) : (
                <Field
                  label="Nom de ton équipe"
                  value={nomEquipe}
                  onChange={(e) => setNomEquipe(e.target.value)}
                  placeholder="Les Lions"
                />
              )}
            </div>
          )}
          {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
        </div>
      )}

      {choixTag && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs leading-relaxed" style={{ color: "var(--ds-muted)" }}>
            Indique le TAG exact que tu utilises sur {jeuLabel} — c&apos;est ce qui permettra à l&apos;organisateur de
            t&apos;identifier pendant le tournoi. Obligatoire à chaque inscription, même si tu as déjà joué ici.
          </p>
          <Field
            label="Ton TAG sur ce jeu"
            value={tagPerso}
            onChange={(e) => setTagPerso(e.target.value)}
            placeholder="Ex: KingKD"
          />
          {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
        </div>
      )}

      <div className="flex gap-2.5 items-center">
        <button
          type="button"
          onClick={() => basculerFavori(tournoiId).then(setFavori)}
          className={`flex items-center justify-center w-10 h-10 shrink-0 ${PRESS}`}
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${favori ? "var(--ds-accent)" : "var(--ds-border)"}`,
            color: favori ? "var(--ds-accent-300)" : "var(--ds-muted)",
          }}
          aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Bookmark size={18} strokeWidth={2} fill={favori ? "currentColor" : "none"} />
        </button>
        {boutonSoutien}
        <button
          type="button"
          onClick={() => basculerNotifsTournoi(tournoiId).then(setNotifs)}
          className={`flex items-center justify-center w-10 h-10 shrink-0 ${PRESS}`}
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`,
            color: notifs ? "var(--ds-accent-300)" : "var(--ds-muted)",
          }}
          aria-label={notifs ? "Désactiver les notifications" : "Activer les notifications"}
        >
          <Bell size={18} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
        </button>
        {tournoiCommence ? (
          <div
            className="flex-1 h-[46px] flex items-center justify-center gap-2.5"
            style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
          >
            <Radio size={15} strokeWidth={2} fill="currentColor" style={{ color: "var(--ds-muted)" }} />
            <div className="text-left">
              <div className="text-xs font-medium" style={{ color: "var(--ds-text-muted)" }}>Tournoi en direct</div>
              <div className="text-[8px] tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>INSCRIPTIONS CLOSES</div>
            </div>
          </div>
        ) : (
          <Button
            variante="primary"
            bloc
            disabled={fermeInscriptions}
            onClick={choixEquipe ? validerEquipe : choixTag ? validerTag : onClicInscription}
          >
            {fermeInscriptions
              ? "Inscriptions fermées"
              : choixEquipe || choixTag
                ? "Continuer"
                : `S'inscrire · ${formatXof(fraisXof)}`}
          </Button>
        )}
      </div>

      <Modal ouvert={etapeBR !== null} titre="Comment tu joues ?" onFermer={() => setEtapeBR(null)}>
        <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
          {brSousType && brSousType !== "solo" && (
            <p className="text-xs -mt-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {LABEL_UNITE_BR[brSousType].nom} de {TAILLE_EQUIPE_BR[brSousType]}
              {fraisXof > 0 ? ` · ${formatXof(fraisXof)} par joueur` : " · gratuit"}
            </p>
          )}

          {etapeBR === "menu" && (
            <div className="flex flex-col gap-2">
              {equipesProfilChef.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEtapeBR("precreees")}
                  className={`flex items-center gap-3 p-3.5 text-left ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>Utiliser une équipe pré-créée</div>
                    <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {equipesProfilChef.length} ÉQUIPE{equipesProfilChef.length > 1 ? "S" : ""} DANS TON PROFIL
                    </div>
                  </div>
                </button>
              )}
              {equipesProfilMembre.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEtapeBR("proposer")}
                  className={`flex items-center gap-3 p-3.5 text-left ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">Proposer une de mes équipes</div>
                    <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      LE CHEF DEVRA VALIDER TA PROPOSITION
                    </div>
                  </div>
                </button>
              )}
              <button
                type="button"
                onClick={() => setEtapeBR("creer")}
                className={`flex items-center gap-3 p-3.5 text-left ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">Créer une équipe</div>
                  <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>TU DEVIENS CHEF · TU INVITES TES JOUEURS</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEtapeBR("rejoindre")}
                className={`flex items-center gap-3 p-3.5 text-left ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">Rejoindre une équipe</div>
                  <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {equipesBR.length} ÉQUIPE{equipesBR.length === 1 ? "" : "S"} CHERCHENT DES JOUEURS
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={validerEquipeAleatoire}
                className={`flex items-center gap-3 p-3.5 text-left ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>Équipe aléatoire</div>
                  <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>ON TE PLACE DANS UNE SQUAD INCOMPLÈTE</div>
                </div>
              </button>
            </div>
          )}

          {etapeBR === "creer" && (
            <div className="flex flex-col gap-2.5">
              <Field label="Nom de ton équipe" value={nomEquipeBR} onChange={(e) => setNomEquipeBR(e.target.value)} placeholder="Les Lions" />
              {fraisXof > 0 && brSousType && brSousType !== "solo" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={payerPourEquipe} onChange={(e) => setPayerPourEquipe(e.target.checked)} />
                  Payer pour toute mon équipe maintenant ({formatXof(fraisXof * TAILLE_EQUIPE_BR[brSousType])})
                </label>
              )}
              {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}
              <button
                type="button"
                onClick={validerEquipeBR}
                className={`h-11 text-sm font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
              >
                Continuer
              </button>
            </div>
          )}

          {etapeBR === "precreees" && (
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
              {equipesProfilChef.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => utiliserEquipeProfil(ep)}
                  className={`flex items-center gap-3 p-2.5 text-left ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
                >
                  <EcussonEquipe initiales={ep.nom.slice(0, 2).toUpperCase()} style="accent" largeur={40} hauteur={46} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ep.nom}</div>
                    <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {ep.membres.length} membre{ep.membres.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: "var(--ds-accent-300)" }}>
                    Utiliser
                  </span>
                </button>
              ))}
            </div>
          )}

          {etapeBR === "proposer" && (
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
              {equipesProfilMembre.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => proposerEquipe(ep)}
                  className={`flex items-center gap-3 p-2.5 text-left ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
                >
                  <EcussonEquipe initiales={ep.nom.slice(0, 2).toUpperCase()} style="neutre" largeur={40} hauteur={46} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ep.nom}</div>
                    <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      Chef · {ep.chef}
                    </div>
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: "var(--ds-accent-300)" }}>
                    Proposer
                  </span>
                </button>
              ))}
            </div>
          )}

          {etapeBR === "rejoindre" && (
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
              {equipesBR.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--ds-muted)" }}>Aucune équipe pour l&apos;instant — crée la première.</p>
              ) : (
                equipesBR.map((e) => {
                  const taille = brSousType && brSousType !== "solo" ? TAILLE_EQUIPE_BR[brSousType] : e.membres.length;
                  const complete = e.membres.length >= taille;
                  const enAttente = demandesEnAttenteParEquipe[e.id] ?? false;
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 p-2.5"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
                    >
                      <EcussonEquipe initiales={e.nom.slice(0, 2).toUpperCase()} style={e.paiementCouvert ? "accent" : "neutre"} largeur={40} hauteur={46} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{e.nom}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--ds-muted)" }}>
                          Chef · {e.chef}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {e.membres.length}/{taille}{e.paiementCouvert ? " · frais déjà payés" : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={complete || enAttente}
                        onClick={() => demanderRejoindreEquipe(e)}
                        className={`px-3 py-1.5 text-xs font-semibold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
                        style={{
                          borderRadius: "var(--ds-radius-pill)",
                          background: complete || enAttente ? "transparent" : "var(--ds-btn-primary-bg)",
                          border: complete || enAttente ? "1px solid var(--ds-border)" : undefined,
                          color: complete || enAttente ? "var(--ds-muted)" : "var(--ds-btn-primary-text)",
                        }}
                      >
                        {enAttente ? "Envoyée" : complete ? "Complète" : "Rejoindre"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal ouvert={confirmationOuverte} titre="Confirmer l'inscription" onFermer={() => setConfirmationOuverte(false)}>
        <div className="flex flex-col gap-2 not-italic" style={{ whiteSpace: "normal" }}>
          <p><strong>{titre}</strong></p>
          <p>{jeuLabel} · {dateLabel}</p>
          {equipeEnAttente && <p>Équipe : {equipeEnAttente}</p>}
          {tagEnAttente && <p>TAG : {tagEnAttente}</p>}
          {montantEnAttente === 0 ? (
            <p style={{ color: "var(--ds-accent-300)" }}>Inscription gratuite — aucun paiement requis.</p>
          ) : (
            <p style={{ color: "var(--ds-accent-300)" }}>
              Montant à payer : {formatXof(montantEnAttente)}
              {equipeIdEnAttente ? " (pour toute l'équipe)" : ""} (Mobile Money ou TourneyCard, à l&apos;étape suivante).
            </p>
          )}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={presenceAcceptee}
              onChange={(e) => setPresenceAcceptee(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
              Je comprends qu&apos;une fois inscrit, ma place est réservée et ma présence au tournoi est obligatoire — une absence peut entraîner une pénalité.
            </span>
          </label>
        </div>
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setConfirmationOuverte(false)}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmerInscription}
            disabled={!presenceAcceptee}
            className={`flex-[2] h-10 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            {montantEnAttente === 0 ? "Confirmer mon inscription" : `Continuer vers le paiement · ${formatXof(montantEnAttente)}`}
          </button>
        </div>
      </Modal>

      {modaleSoutien}
    </div>
  );
}
