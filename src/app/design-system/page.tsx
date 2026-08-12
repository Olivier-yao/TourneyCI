"use client";

import { useState } from "react";
import { ThemeProvider } from "@/components/ds/ThemeProvider";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { Button } from "@/components/ds/Button";
import { Tag } from "@/components/ds/Tag";
import { Field } from "@/components/ds/Input";
import { Card, CardKicker, CardTitle, CardBody, CardMeta } from "@/components/ds/Card";
import { Avatar, AvatarPile } from "@/components/ds/Avatar";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { TabBar } from "@/components/ds/TabBar";
import { AppBar } from "@/components/ds/AppBar";
import { EmptyState } from "@/components/ds/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ds/Skeleton";
import { Splash } from "@/components/ds/Splash";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-mono)" }}
      >
        {titre}
      </h2>
      {children}
    </section>
  );
}

function DemoInterne() {
  const [chipActif, setChipActif] = useState("FIFA");
  const [splashKey, setSplashKey] = useState(0);

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl"
              style={{
                fontFamily: "var(--ds-font-heading)",
                fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
              }}
            >
              Tourney — Design system
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ds-text-muted)" }}>
              Fondations du re-design gaming : Nocturne et Organic.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Section titre="01 · Splash">
          <div className="flex flex-col items-center gap-4">
            <Splash key={splashKey} />
            <Button variante="secondary" onClick={() => setSplashKey((k) => k + 1)}>
              Rejouer l&apos;animation
            </Button>
          </div>
        </Section>

        <Section titre="02 · Boutons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variante="primary">Créer mon compte</Button>
            <Button variante="secondary">J&apos;ai déjà un compte</Button>
            <Button variante="ghost">Tout voir</Button>
            <Button variante="primary" disabled>
              Indisponible
            </Button>
          </div>
        </Section>

        <Section titre="03 · Chips de jeu">
          <div className="flex flex-wrap gap-2">
            {["FIFA", "Free Fire", "CODM", "Tekken"].map((jeu) => (
              <Tag key={jeu} actif={chipActif === jeu} onClick={() => setChipActif(jeu)}>
                {jeu}
              </Tag>
            ))}
          </div>
        </Section>

        <Section titre="04 · Champs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <Field label="Numéro à débiter" defaultValue="07 58 42 19 06" />
            <Field
              label="Pseudo"
              defaultValue=""
              placeholder="ton pseudo"
              erreur="Ce pseudo est déjà pris"
            />
          </div>
        </Section>

        <Section titre="05 · Carte tournoi">
          <Card className="max-w-sm">
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <CardKicker>Vedette · Samedi 21h</CardKicker>
                <LiveBadge />
              </div>
              <CardTitle>Abidjan Cup #12</CardTitle>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <CardMeta>Cash prize</CardMeta>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: "var(--ds-accent-300)" }}
                  >
                    500 000 F
                  </div>
                </div>
                <Button variante="primary">Rejoindre</Button>
              </div>
              <CardBody>Élimination directe, BO3 en quarts, BO5 en finale.</CardBody>
              <ProgressBar pourcentage={64} />
              <div className="flex items-center gap-2 mt-1">
                <AvatarPile initiales={["KB", "AY", "SD"]} />
                <CardMeta>+38 inscrits</CardMeta>
              </div>
            </div>
          </Card>
        </Section>

        <Section titre="06 · Avatar & AppBar">
          <div className="flex items-center gap-6">
            <Avatar initiales="KB" taille={52} />
            <div className="flex-1">
              <AppBar titre="Détail du tournoi" retour />
            </div>
          </div>
        </Section>

        <Section titre="07 · États vides et chargement">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <EmptyState
                titre="Aucun tournoi"
                description="Reviens plus tard ou change de jeu."
                action={<Button variante="secondary">Changer de jeu</Button>}
              />
            </Card>
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <Skeleton className="w-1/2" />
            </div>
          </div>
        </Section>

        <Section titre="08 · Navigation basse">
          <Card className="max-w-sm">
            <TabBar />
          </Card>
        </Section>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <ThemeProvider>
      <DemoInterne />
    </ThemeProvider>
  );
}
