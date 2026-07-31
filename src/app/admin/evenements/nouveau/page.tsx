"use client";

import { useActionState } from "react";
import { creerEvenement, type CreerEvenementState } from "./actions";
import { classeBoutonPrimaire, classeChamp, classeLabel } from "@/lib/ui";
import { IconTrophee } from "@/components/icons";

const etatInitial: CreerEvenementState = {};

export default function NouvelEvenementPage() {
  const [etat, action, enCours] = useActionState(creerEvenement, etatInitial);

  return (
    <main className="min-h-screen bg-cream-100 text-ink-900 motif-points px-4 py-8">
      <div className="motif-damier h-1.5 w-full rounded-full mb-6 max-w-md mx-auto" />
      <div className="mx-auto max-w-md">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-forest-900 mb-6">
          <IconTrophee size={24} />
          Créer un événement
        </h1>
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="nom" className={classeLabel}>
              Nom de l&apos;événement
            </label>
            <input
              id="nom"
              name="nom"
              required
              className={classeChamp}
              placeholder="PLAY UP Abidjan #3"
            />
          </div>

          <div>
            <label htmlFor="jeu" className={classeLabel}>
              Jeu
            </label>
            <input
              id="jeu"
              name="jeu"
              required
              className={classeChamp}
              placeholder="Free Fire"
            />
          </div>

          <div>
            <label htmlFor="date" className={classeLabel}>
              Date et heure
            </label>
            <input
              id="date"
              name="date"
              type="datetime-local"
              required
              className={classeChamp}
            />
          </div>

          <div>
            <label htmlFor="lieu" className={classeLabel}>
              Lieu
            </label>
            <input
              id="lieu"
              name="lieu"
              required
              className={classeChamp}
              placeholder="Abidjan, Cocody"
            />
          </div>

          <div>
            <label htmlFor="max_participants" className={classeLabel}>
              Nombre max de participants
            </label>
            <input
              id="max_participants"
              name="max_participants"
              type="number"
              min={2}
              required
              className={classeChamp}
              placeholder="16"
            />
          </div>

          <div>
            <label htmlFor="frais_inscription" className={classeLabel}>
              Frais d&apos;inscription (FCFA)
            </label>
            <input
              id="frais_inscription"
              name="frais_inscription"
              type="number"
              min={0}
              required
              className={classeChamp}
              placeholder="1000"
            />
          </div>

          {etat.erreur && (
            <p className="text-error-600 text-sm">{etat.erreur}</p>
          )}

          <button type="submit" disabled={enCours} className={classeBoutonPrimaire}>
            {enCours ? "Création..." : "Créer l'événement"}
          </button>
        </form>
      </div>
    </main>
  );
}
