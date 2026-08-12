"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, Check } from "lucide-react";
import { Modal } from "./Modal";
import { JEUX, TYPES_JEU, type GenreJeu } from "@/lib/mockTournaments";

export function SelecteurJeu({
  jeuId,
  onChange,
}: {
  jeuId: string;
  onChange: (id: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [categorie, setCategorie] = useState<GenreJeu | null>(null);

  const jeuActuel = JEUX.find((j) => j.id === jeuId);
  const label = jeuId === "autre" ? "Autre jeu" : (jeuActuel?.label ?? "Choisir un jeu");

  function fermer() {
    setOuvert(false);
    setCategorie(null);
  }

  function choisir(id: string) {
    onChange(id);
    fermer();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="w-full h-11 flex items-center justify-between px-3.5 text-sm cursor-pointer"
        style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      >
        <span>{label}</span>
        <ChevronDown size={16} style={{ color: "var(--ds-muted)" }} />
      </button>

      <Modal ouvert={ouvert} titre={categorie ?? "Choisir un jeu"} onFermer={fermer}>
        {categorie ? (
          <div className="flex flex-col gap-3" style={{ whiteSpace: "normal" }}>
            <button
              type="button"
              onClick={() => setCategorie(null)}
              className="flex items-center gap-1.5 text-xs font-medium cursor-pointer self-start"
              style={{ color: "var(--ds-muted)" }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Catégories
            </button>
            <div className="flex flex-col gap-1.5">
              {JEUX.filter((j) => j.genre === categorie).map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => choisir(j.id)}
                  className="flex items-center justify-between p-3 text-sm cursor-pointer"
                  style={{
                    borderRadius: "var(--ds-radius-md)",
                    background: jeuId === j.id ? "var(--ds-accent-900)" : "var(--ds-surface)",
                    border: `1px solid ${jeuId === j.id ? "var(--ds-accent)" : "var(--ds-border)"}`,
                    color: jeuId === j.id ? "var(--ds-accent-300)" : "var(--ds-text)",
                  }}
                >
                  {j.label}
                  {jeuId === j.id && <Check size={15} strokeWidth={2} />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5" style={{ whiteSpace: "normal" }}>
            {TYPES_JEU.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setCategorie(genre)}
                className="flex items-center justify-between p-3 text-sm font-medium cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
              >
                {genre}
                <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {JEUX.filter((j) => j.genre === genre).length}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => choisir("autre")}
              className="flex items-center justify-between p-3 text-sm font-medium cursor-pointer"
              style={{
                borderRadius: "var(--ds-radius-md)",
                background: jeuId === "autre" ? "var(--ds-accent-900)" : "var(--ds-surface)",
                border: `1px solid ${jeuId === "autre" ? "var(--ds-accent)" : "var(--ds-border)"}`,
                color: jeuId === "autre" ? "var(--ds-accent-300)" : "var(--ds-text)",
              }}
            >
              Autre
              {jeuId === "autre" && <Check size={15} strokeWidth={2} />}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
