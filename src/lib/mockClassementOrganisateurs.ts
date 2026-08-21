import { tousLesTournois } from "./mockTournaments";
import { estCertifie } from "./mockOrganisateur";
import { lireProfil } from "./mockProfil";

export type OrganisateurClasse = {
  nom: string;
  participantsTotal: number;
  tournoisOrganises: number;
  tournoisFloppes: number;
  note: number;
  certifie: boolean;
  moi?: boolean;
};

/** Notes moyennes de démo pour les organisateurs déjà présents dans les
 * tournois d'exemple (pas de vrai système d'avis dans ce mock). */
const NOTES_DEMO: Record<string, number> = {
  "Ivoire Esport": 4.8,
  "Yop Gaming": 4.5,
  "War Room CI": 4.6,
  "FGC Côte d'Ivoire": 4.7,
  "Abidjan Battle Royale": 4.2,
};

/** Classement des organisateurs : le plus de participants rassemblés sur
 * l'ensemble de leurs tournois, la meilleure note, et le moins de tournois
 * "floppés" (annulés ou clôturés à 0 inscrit). */
export async function classementOrganisateurs(): Promise<OrganisateurClasse[]> {
  const profil = lireProfil();
  const parOrganisateur = new Map<string, { participants: number; total: number; floppes: number }>();

  for (const t of await tousLesTournois()) {
    const entree = parOrganisateur.get(t.organisateur) ?? { participants: 0, total: 0, floppes: 0 };
    entree.total += 1;
    entree.participants += t.placesInscrites;
    if (t.annule || (t.termine && t.placesInscrites === 0)) entree.floppes += 1;
    parOrganisateur.set(t.organisateur, entree);
  }

  const classement: OrganisateurClasse[] = Array.from(parOrganisateur.entries()).map(([nom, s]) => ({
    nom,
    participantsTotal: s.participants,
    tournoisOrganises: s.total,
    tournoisFloppes: s.floppes,
    note: NOTES_DEMO[nom] ?? 4.3,
    certifie: nom === profil.pseudo ? estCertifie() : true,
    moi: nom === profil.pseudo,
  }));

  return classement.sort(
    (a, b) => b.participantsTotal - a.participantsTotal || b.note - a.note || a.tournoisFloppes - b.tournoisFloppes,
  );
}
