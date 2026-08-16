"use client";

import { useRouter } from "next/navigation";
import { IdCard } from "lucide-react";
import { Modal } from "./Modal";
import { PRESS } from "./Button";

/**
 * Alerte réutilisée partout où une action est bloquée tant que l'identité
 * n'est pas vérifiée (points 174, 181) : tournoi payant à la création, ou
 * accès à la demande de statut organisateur certifié. Mène directement au
 * flux de vérification (points 41, 49).
 */
export function AlerteVerificationIdentite({
  ouvert,
  description,
  onFermer,
}: {
  ouvert: boolean;
  description: string;
  onFermer: () => void;
}) {
  const router = useRouter();

  return (
    <Modal ouvert={ouvert} titre="Vérification d'identité requise" onFermer={onFermer}>
      <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
        <div className="flex justify-center">
          <div
            className="flex items-center justify-center w-11 h-11"
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <IdCard size={19} strokeWidth={2} />
          </div>
        </div>
        <p className="text-sm text-center" style={{ color: "var(--ds-text-muted)" }}>
          {description}
        </p>
      </div>
      <div className="flex gap-2 pt-3">
        <button
          type="button"
          onClick={onFermer}
          className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={() => router.push("/verification-identite")}
          className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
        >
          Vérifier mon identité
        </button>
      </div>
    </Modal>
  );
}
