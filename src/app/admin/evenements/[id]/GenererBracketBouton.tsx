"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { genererBracket, type GenererBracketState } from "./actions";
import { classeBoutonPrimaire } from "@/lib/ui";

const etatInitial: GenererBracketState = {};

export function GenererBracketBouton({
  eventId,
  nbParticipants,
}: {
  eventId: string;
  nbParticipants: number;
}) {
  const router = useRouter();
  const genererAvecId = genererBracket.bind(null, eventId);
  const [etat, action, enCours] = useActionState(genererAvecId, etatInitial);

  useEffect(() => {
    if (etat.succes) {
      router.refresh();
    }
  }, [etat.succes, router]);

  const pasAssezDeParticipants = nbParticipants < 2;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        "Clôturer les inscriptions et générer le bracket ? Cette action est définitive.",
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={onSubmit}>
      <button
        type="submit"
        disabled={enCours || pasAssezDeParticipants}
        className={classeBoutonPrimaire}
      >
        {enCours
          ? "Génération..."
          : "Clôturer les inscriptions et générer le bracket"}
      </button>
      {pasAssezDeParticipants && (
        <p className="text-ink-600 text-sm mt-2">
          Il faut au moins 2 participants inscrits.
        </p>
      )}
      {etat.erreur && (
        <p className="text-error-600 text-sm mt-2">{etat.erreur}</p>
      )}
    </form>
  );
}
