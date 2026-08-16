"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type PanInfo } from "motion/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";

type Ecran = {
  visuel: React.ReactNode;
  titre: string;
  description: string;
};

function EcranPermissions({ notifsActives, onBasculer }: { notifsActives: boolean; onBasculer: () => void }) {
  return (
    <div
      className="w-full flex flex-col items-center justify-center gap-5"
      style={{ height: 380, background: "var(--ds-surface)" }}
    >
      <div
        className="flex items-center justify-center w-16 h-16"
        style={{
          borderRadius: "var(--ds-radius-pill)",
          border: "1px solid var(--ds-accent)",
          color: "var(--ds-accent-300)",
        }}
      >
        <Bell size={26} strokeWidth={2} />
      </div>
      <button
        type="button"
        onClick={onBasculer}
        className="h-10 px-5 text-sm font-medium cursor-pointer transition-colors"
        style={{
          borderRadius: "var(--ds-radius-pill)",
          background: notifsActives ? "var(--ds-accent-900)" : "transparent",
          border: notifsActives ? "1px solid transparent" : "1px solid var(--ds-border)",
          color: notifsActives ? "var(--ds-accent-300)" : "var(--ds-muted)",
          fontFamily: "var(--ds-font-body)",
        }}
      >
        {notifsActives ? "Notifications activées" : "Autoriser les notifications"}
      </button>
    </div>
  );
}

const SEUIL_GLISSEMENT = 80;

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [notifsActives, setNotifsActives] = useState(false);

  const ecrans: Ecran[] = [
    {
      visuel: (
        <div className="relative w-full overflow-hidden" style={{ height: 380 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/onboarding/joueur-manette.png"
            alt="Joueur avec manette et casque, fond sombre"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(transparent 40%, var(--ds-bg))" }}
          />
        </div>
      ),
      titre: "Joue. Gagne.\nMonte au classement.",
      description:
        "Des tournois FIFA, Free Fire et CODM tous les week-ends, entre Abidjan, Bouaké et Yamoussoukro.",
    },
    {
      visuel: <ImagePlaceholder label={"photo — cash prize\nremise des gains"} />,
      titre: "Des cash prizes,\npas des promesses.",
      description:
        "Chaque tournoi payant reverse ses gains en Mobile Money sous 24h après la finale. Zéro frais caché.",
    },
    {
      visuel: <ImagePlaceholder label={"photo — organisateur\nvalide un score"} />,
      titre: "Des organisateurs vérifiés.\nUn classement qui compte.",
      description:
        "Chaque tournoi est piloté par un organisateur validé. Ton rang national reflète de vraies victoires, pas des scores triés.",
    },
    {
      visuel: (
        <EcranPermissions
          notifsActives={notifsActives}
          onBasculer={() => setNotifsActives((v) => !v)}
        />
      ),
      titre: "Reste au courant",
      description:
        "Active les notifications pour ne rater aucun match, ni ton tour au bracket.",
    },
  ];
  const nbEcrans = ecrans.length;

  useEffect(() => {
    const minuteur = setInterval(() => {
      setIndex((i) => (i + 1) % nbEcrans);
    }, 4500);
    return () => clearInterval(minuteur);
  }, [nbEcrans]);

  function onDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x < -SEUIL_GLISSEMENT && index < ecrans.length - 1) {
      setIndex(index + 1);
    } else if (info.offset.x > SEUIL_GLISSEMENT && index > 0) {
      setIndex(index - 1);
    }
  }

  function allerVersVerify(mode: "creer" | "connexion") {
    router.push(`/verify?mode=${mode}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ width: `${ecrans.length * 100}%` }}
          animate={{ x: `-${index * (100 / ecrans.length)}%` }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
        >
          {ecrans.map((ecran, i) => (
            <div key={i} style={{ width: `${100 / ecrans.length}%` }} className="shrink-0">
              {ecran.visuel}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="px-7 pb-7 -mt-10 relative flex flex-col gap-4 flex-1">
        <h1
          className="text-2xl leading-tight whitespace-pre-line"
          style={{
            fontFamily: "var(--ds-font-heading)",
            fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
          }}
        >
          {ecrans[index].titre}
        </h1>
        <p className="text-[15px]" style={{ color: "var(--ds-text-muted)" }}>
          {ecrans[index].description}
        </p>

        <div className="flex gap-1.5 mt-1">
          {ecrans.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à l'écran ${i + 1}`}
              onClick={() => setIndex(i)}
              className="h-[3px] rounded-full transition-all cursor-pointer"
              style={{
                width: i === index ? 22 : 8,
                background: i === index ? "var(--ds-accent)" : "var(--ds-border)",
              }}
            />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <Button variante="primary" bloc onClick={() => allerVersVerify("creer")}>
            Créer mon compte
          </Button>
          <Button variante="secondary" bloc onClick={() => allerVersVerify("connexion")}>
            J&apos;ai déjà un compte
          </Button>
        </div>
      </div>
    </div>
  );
}
