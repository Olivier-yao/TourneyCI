"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Modal } from "./Modal";
import { SYMBOLES_TOURNOI, symboleParId } from "@/lib/mockSymboles";

/** Point 175 : le sélecteur n'affiche plus la grille en permanence — un
 * bouton déclencheur ouvre la liste complète des symboles dans une modale,
 * cohérent avec le sélecteur de jeu (SelecteurJeu). */
export function SelecteurSymbole({
  symboleId,
  onChange,
}: {
  symboleId: string;
  onChange: (id: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const actuel = symboleParId(symboleId);
  const IconeActuelle = actuel.icone;

  function choisir(id: string) {
    onChange(id);
    setOuvert(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="w-full h-11 flex items-center justify-between px-3.5 text-sm cursor-pointer"
        style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      >
        <span className="flex items-center gap-2">
          <IconeActuelle size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          {actuel.label}
        </span>
        <ChevronDown size={16} style={{ color: "var(--ds-muted)" }} />
      </button>

      <Modal ouvert={ouvert} titre="Choisir un symbole" onFermer={() => setOuvert(false)}>
        <div className="grid grid-cols-4 gap-2" style={{ whiteSpace: "normal" }}>
          {SYMBOLES_TOURNOI.map((s) => {
            const actif = s.id === symboleId;
            const Icone = s.icone;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => choisir(s.id)}
                className="relative flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: actif ? "var(--ds-accent-900)" : "var(--ds-surface)",
                  border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
                }}
              >
                <Icone size={20} strokeWidth={2} style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)" }} />
                <span className="text-[9px] text-center leading-tight px-1" style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)" }}>
                  {s.label}
                </span>
                {actif && (
                  <span
                    className="absolute top-1 right-1 flex items-center justify-center w-3.5 h-3.5"
                    style={{ borderRadius: "999px", background: "var(--ds-accent)" }}
                  >
                    <Check size={9} strokeWidth={3} style={{ color: "var(--ds-bg)" }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
