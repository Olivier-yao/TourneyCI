"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Settings, Wallet, History, Ticket, Bookmark, ShieldCheck, Heart, HeartCrack, Users, Trophy, Plus, LifeBuoy } from "lucide-react";
import { TabBar } from "@/components/ds/TabBar";
import { Button } from "@/components/ds/Button";
import { lireProfil, estActif, mesPointsCumules, palierActuel, attendreProfil } from "@/lib/mockProfil";
import { BadgeActif } from "@/components/ds/BadgeActif";
import { BadgePalier } from "@/components/ds/Palier";
import { lireSolde } from "@/lib/mockWallet";
import { mesInscriptions } from "@/lib/mockInscriptions";
import { mesFavoris } from "@/lib/mockFavoris";
import { equipesDuJoueur } from "@/lib/mockEquipesBR";
import { equipesProfilDontChef } from "@/lib/mockEquipesProfil";
import { tournoiParId, mesTournoisOrganises, type Tournoi } from "@/lib/mockTournaments";
import { estCertifie, estOrganisateurCertifie, nomOrganisateurActuel, onboardingOrganisateurComplet, statistiquesReputation, tagOrganisateur } from "@/lib/mockOrganisateur";
import { infosSuiviOrganisateur } from "@/lib/mockSuiviOrganisateur";
import { classementOrganisateurs } from "@/lib/mockClassementOrganisateurs";
import { rolePrefere, definirRole, type Role } from "@/lib/mockAuth";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function ProfilPage() {
  const connecte = useExigerConnexion();
  const [profil, setProfil] = useState(lireProfil);
  const [solde, setSolde] = useState(0);
  const [compteurs, setCompteurs] = useState({ historique: 0, inscriptions: 0, favoris: 0, equipes: 0 });
  const [organisateur, setOrganisateur] = useState<{ estOrganisateur: boolean; certifie: boolean }>({
    estOrganisateur: false,
    certifie: false,
  });
  const [role, setRole] = useState<Role>("joueur");
  const [vueOrga, setVueOrga] = useState<{
    onboardingOk: boolean;
    certifie: boolean;
    nom: string;
    tag?: string;
    coeurs: number;
    coeursBrises: number;
    followers: number;
    rang: number;
    tournois: Tournoi[];
  } | null>(null);
  const winrate = Math.round((profil.victoires / profil.matchsJoues) * 100);

  useEffect(() => {
    // lireProfil() est déjà synchrone (cache), mais peut ne pas encore avoir
    // reçu la réponse de /api/profil au tout premier rendu — on rafraîchit
    // une fois le chargement initial garanti terminé.
    attendreProfil().then(() => {
      setProfil(lireProfil());
    });
  }, []);

  useEffect(() => {
    async function charger() {
      const inscriptions = await mesInscriptions();
      const tournoisInscrits = await Promise.all(inscriptions.map((i) => tournoiParId(i.tournoiId)));
      const historique = tournoisInscrits.filter((t) => t && t.termine).length;
      setSolde(await lireSolde());
      const [equipesProfilChef, equipesBR] = await Promise.all([equipesProfilDontChef(), equipesDuJoueur()]);
      setCompteurs({ historique, inscriptions: inscriptions.length, favoris: (await mesFavoris()).length, equipes: equipesProfilChef.length + equipesBR.length });
      const tournoisOrganises = await mesTournoisOrganises();
      setOrganisateur({ estOrganisateur: tournoisOrganises.length > 0, certifie: await estCertifie() });
      setRole(rolePrefere());

      const onboardingOk = onboardingOrganisateurComplet();
      const nomOrga = nomOrganisateurActuel();
      const stats = await statistiquesReputation(nomOrga);
      const classement = await classementOrganisateurs();
      setVueOrga({
        onboardingOk,
        certifie: await estOrganisateurCertifie(),
        nom: nomOrga,
        tag: await tagOrganisateur(),
        coeurs: stats.coeurs,
        coeursBrises: stats.coeursBrises,
        followers: (await infosSuiviOrganisateur(nomOrga)).compte,
        rang: classement.findIndex((o) => o.nom === nomOrga) + 1,
        tournois: tournoisOrganises,
      });
    }
    charger();
  }, []);

  function basculerRole(nouveau: Role) {
    definirRole(nouveau);
    setRole(nouveau);
  }

  const menu = [
    { href: "/profil/solde", icone: Wallet, label: "Solde & TourneyCard", valeur: null as number | null },
    { href: "/profil/historique", icone: History, label: "Historique de tournois", valeur: compteurs.historique },
    { href: "/profil/inscriptions", icone: Ticket, label: "Mes inscriptions", valeur: compteurs.inscriptions },
    { href: "/mes-equipes", icone: Users, label: "Mes équipes", valeur: compteurs.equipes },
    { href: "/favoris", icone: Bookmark, label: "Favoris", valeur: compteurs.favoris },
  ];

  if (!connecte) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div
        className="px-5 pt-7 pb-6 flex items-center justify-between gap-4"
        style={{
          background: "radial-gradient(120% 100% at 20% 0%, var(--ds-surface), var(--ds-bg))",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold shrink-0 overflow-hidden"
            style={{ background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent-600)", color: "var(--ds-accent-300)" }}
          >
            {profil.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profil.photoUrl} alt={profil.pseudo} className="w-full h-full object-cover" />
            ) : (
              profil.pseudo
                .split(" ")
                .map((m) => m[0])
                .join("")
                .toUpperCase()
            )}
          </div>
          <div>
            <div className="text-xl font-medium">{profil.pseudo}</div>
            <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              @{profil.pseudo.toLowerCase().replace(/[^a-z]/g, "")} · {profil.ville}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Link
                href="/profil/progression"
                className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 text-[11px]"
                style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent-700)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
              >
                <BadgePalier palier={palierActuel(profil.matchsJoues, mesPointsCumules())} taille="sm" />
                {profil.rang} · #{profil.rangNational} national
              </Link>
              {estActif(profil.matchsJoues) && <BadgeActif />}
              {organisateur.estOrganisateur && organisateur.certifie && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
                  style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
                >
                  <ShieldCheck size={11} strokeWidth={2} />
                  Organisateur certifié
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/profil/parametres"
          className="flex items-center justify-center w-10 h-10 shrink-0"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          aria-label="Modifier le profil"
        >
          <Settings size={18} strokeWidth={2} />
        </Link>
      </div>

      <div className="px-5 -mt-2 mb-1">
        <div
          className="relative flex p-[3px]"
          style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
        >
          <div
            className="absolute top-[3px] bottom-[3px] transition-all duration-200"
            style={{
              width: "calc(50% - 3px)",
              left: role === "organisateur" ? "50%" : "3px",
              borderRadius: "var(--ds-radius-pill)",
              background: "var(--ds-accent-900)",
              boxShadow: "0 0 0 1px var(--ds-accent)",
            }}
          />
          <button
            type="button"
            onClick={() => basculerRole("joueur")}
            className="relative flex-1 h-9 text-xs font-medium cursor-pointer"
            style={{ color: role === "joueur" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
          >
            Joueur
          </button>
          <button
            type="button"
            onClick={() => basculerRole("organisateur")}
            className="relative flex-1 h-9 text-xs font-medium cursor-pointer"
            style={{ color: role === "organisateur" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
          >
            Organisateur
          </button>
        </div>
      </div>

      {!organisateur.certifie && (
        <div className="px-5 mb-1">
          <Link
            href="/verification-identite"
            className="flex items-center gap-2.5 p-3"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", border: "1px solid var(--ds-accent)" }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
            <span className="flex-1 text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
              Vérifie ton identité
            </span>
            <ChevronRight size={15} style={{ color: "var(--ds-accent-300)" }} />
          </Link>
        </div>
      )}

      {role === "joueur" && (
      <>
      <div className="px-5">
        <div
          className="p-4"
          style={{
            borderRadius: "var(--ds-radius-lg)",
            background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))",
            border: "1px solid var(--ds-border-strong)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                Mon solde
              </div>
              <div className="mt-1 text-2xl font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
                {solde.toLocaleString("fr-FR")} CFA
              </div>
            </div>
            <div className="w-11 h-7" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-600)", border: "1px solid var(--ds-accent)" }} />
          </div>
          <div className="mt-3.5 flex gap-2">
            <Link href="/profil/solde/recharger" className="flex-1">
              <Button variante="secondary" bloc>Recharger</Button>
            </Link>
            <Link href="/profil/solde/retirer" className="flex-1">
              <Button variante="secondary" bloc>Retirer</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 grid grid-cols-3 gap-2 mt-4">
        {[
          { label: "matchs", valeur: profil.matchsJoues },
          { label: "victoires", valeur: profil.victoires },
          { label: "winrate", valeur: `${winrate}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <div className="text-xl" style={{ fontFamily: "var(--ds-font-mono)" }}>
              {stat.valeur}
            </div>
            <div className="text-[11px]" style={{ color: "var(--ds-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pt-6 pb-24 flex-1 flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Mon compte
        </div>
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 py-3"
            style={{ borderBottom: "1px solid var(--ds-border)" }}
          >
            <item.icone size={18} style={{ color: "var(--ds-accent)" }} />
            <span className="flex-1 text-sm">{item.label}</span>
            {item.valeur !== null && (
              <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {item.valeur}
              </span>
            )}
            <ChevronRight size={15} style={{ color: "var(--ds-muted)" }} />
          </Link>
        ))}

        <Link
          href="/classement"
          className="flex items-center justify-between p-3 mt-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
            Voir le classement complet
          </span>
          <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
        </Link>

        {organisateur.estOrganisateur && (
          <Link
            href="/organisateur/classement"
            className="flex items-center justify-between p-3 mt-2"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
              Classement des organisateurs
            </span>
            <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
          </Link>
        )}
      </div>
      </>
      )}

      {role === "organisateur" && vueOrga && (
        <div className="px-5 pt-2 pb-24 flex-1 flex flex-col gap-4">
          {!vueOrga.onboardingOk ? (
            <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
              <ShieldCheck size={26} style={{ color: "var(--ds-accent-300)" }} />
              <div className="text-base font-medium">Deviens organisateur</div>
              <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
                Choisis un nom public puis envoie une demande de statut organisateur, examinée par l&apos;administration, pour pouvoir créer et gérer tes propres tournois.
              </p>
              <Link href="/organisateur">
                <Button variante="primary">Devenir organisateur</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-lg font-medium">{vueOrga.nom}</div>
                    {vueOrga.certifie && (
                      <span
                        className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
                      >
                        <ShieldCheck size={10} strokeWidth={2.5} />
                        Certifié
                      </span>
                    )}
                  </div>
                  {vueOrga.tag && <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>@{vueOrga.tag}</div>}
                </div>
                <Link href="/organisateur/nouveau">
                  <Button variante="secondary">
                    <Plus size={15} strokeWidth={2} />
                    Créer
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 flex flex-col items-center gap-1" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                    <span className="text-lg" style={{ fontFamily: "var(--ds-font-mono)" }}>{vueOrga.followers}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--ds-muted)" }}>followers</div>
                </div>
                <div className="p-3 flex flex-col items-center gap-1" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                  <div className="flex items-center gap-1.5">
                    <Heart size={14} strokeWidth={2} fill="currentColor" style={{ color: "var(--ds-accent-400)" }} />
                    <span className="text-lg" style={{ fontFamily: "var(--ds-font-mono)" }}>{vueOrga.coeurs}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--ds-muted)" }}>cœurs</div>
                </div>
                <div className="p-3 flex flex-col items-center gap-1" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                  <div className="flex items-center gap-1.5">
                    <HeartCrack size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
                    <span className="text-lg" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{vueOrga.coeursBrises}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--ds-muted)" }}>brisés</div>
                </div>
              </div>

              <Link
                href={`/organisateur/profil/${encodeURIComponent(vueOrga.nom)}`}
                className="flex items-center justify-between p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
                  Voir mon profil organisateur complet
                </span>
                <ChevronRight size={16} style={{ color: "var(--ds-muted)" }} />
              </Link>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  <Trophy size={13} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                  Tournois organisés · {vueOrga.tournois.length}
                </div>
                {vueOrga.tournois.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucun tournoi pour l&apos;instant.</p>
                ) : (
                  vueOrga.tournois.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tournois/${t.id}`}
                      className="flex items-center gap-3 p-3"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.titre}</div>
                        <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal}
                        </div>
                      </div>
                      <ChevronRight size={15} style={{ color: "var(--ds-muted)" }} />
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      <Link
        href="/profil/service-client"
        className="flex items-center justify-center gap-1.5 px-5 pt-4 pb-24 text-xs"
        style={{ color: "var(--ds-muted)" }}
      >
        <LifeBuoy size={13} strokeWidth={2} />
        Service client
      </Link>

      <TabBar />
    </div>
  );
}
