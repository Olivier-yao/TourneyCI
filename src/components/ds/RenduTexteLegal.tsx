"use client";

import type { ReactNode } from "react";
import Link from "next/link";

function avecLiens(texte: string): ReactNode {
  const parties = texte.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parties.map((partie, i) => {
    const m = partie.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) return partie;
    return (
      <Link key={i} href={m[2]} className="underline">
        {m[1]}
      </Link>
    );
  });
}

/** Rendu minimal type markdown (titres, listes, italique, séparateur) —
 * partagé entre les écrans de texte légal/réglementaire (règlement
 * intérieur, politique de confidentialité, conditions d'utilisation) pour
 * ne pas dupliquer ce petit moteur de rendu à chaque nouvel écran. */
export function RenduTexteLegal({ texte }: { texte: string }) {
  const blocs = texte.trim().split(/\n\s*\n/);
  const elements: ReactNode[] = [];

  blocs.forEach((bloc, i) => {
    const lignes = bloc.split("\n").map((l) => l.trim());
    if (lignes[0].startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl mb-1" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          {lignes[0].slice(2)}
        </h1>,
      );
      return;
    }
    if (lignes[0].startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold mt-3" style={{ color: "var(--ds-text)" }}>
          {lignes[0].slice(3)}
        </h2>,
      );
      return;
    }
    if (lignes[0] === "---") {
      elements.push(<div key={i} className="h-px my-2" style={{ background: "var(--ds-border)" }} />);
      return;
    }
    const debutListe = lignes.findIndex((l) => l.startsWith("- "));
    if (debutListe !== -1) {
      const intro = lignes.slice(0, debutListe).filter(Boolean).join(" ");
      const items: string[] = [];
      lignes.slice(debutListe).filter(Boolean).forEach((l) => {
        if (l.startsWith("- ")) items.push(l.slice(2));
        else items[items.length - 1] += ` ${l}`;
      });
      if (intro) elements.push(<p key={`${i}-intro`}>{avecLiens(intro)}</p>);
      elements.push(
        <ul key={i} className="list-disc pl-5 flex flex-col gap-1">
          {items.map((item, j) => (
            <li key={j}>{avecLiens(item)}</li>
          ))}
        </ul>,
      );
      return;
    }
    const texteBloc = lignes.join(" ");
    if (texteBloc.startsWith("*") && texteBloc.endsWith("*")) {
      elements.push(
        <p key={i} className="italic" style={{ color: "var(--ds-muted)" }}>
          {avecLiens(texteBloc.slice(1, -1))}
        </p>,
      );
      return;
    }
    elements.push(<p key={i}>{avecLiens(texteBloc)}</p>);
  });

  return <div className="flex flex-col gap-2.5 text-sm leading-relaxed">{elements}</div>;
}
