"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inscrire, type InscriptionState } from "./actions";
import { classeBoutonPrimaire, classeChamp, classeLabel } from "@/lib/ui";

const etatInitial: InscriptionState = {};

export function FormulaireInscription({ eventId }: { eventId: string }) {
  const router = useRouter();
  const inscrireAvecId = inscrire.bind(null, eventId);
  const [etat, action, enCours] = useActionState(inscrireAvecId, etatInitial);

  useEffect(() => {
    if (etat.succes) {
      router.refresh();
    }
  }, [etat.succes, router]);

  if (etat.succes) {
    return (
      <div className="rounded-lg layer-raised border border-success-600/30 text-success-600 px-4 py-4 text-center font-medium">
        Inscription enregistrée ! On te contactera sur WhatsApp pour la suite.
      </div>
    );
  }

  return (
    <form action={action} className="layer-raised rounded-xl p-5 space-y-4">
      <div>
        <label htmlFor="nom" className={classeLabel}>
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          required
          className={classeChamp}
          placeholder="Ton nom"
        />
      </div>

      <div>
        <label htmlFor="pseudo_tiktok" className={classeLabel}>
          Pseudo TikTok
        </label>
        <input
          id="pseudo_tiktok"
          name="pseudo_tiktok"
          required
          className={classeChamp}
          placeholder="@tonpseudo"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className={classeLabel}>
          Numéro WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          required
          className={classeChamp}
          placeholder="07 00 00 00 00"
        />
      </div>

      {etat.erreur && <p className="text-error-600 text-sm">{etat.erreur}</p>}

      <button type="submit" disabled={enCours} className={classeBoutonPrimaire}>
        {enCours ? "Inscription..." : "S'inscrire"}
      </button>
    </form>
  );
}
