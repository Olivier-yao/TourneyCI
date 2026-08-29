import { apiFetch } from "./api";

/** Port partiel du contrat de GET /api/profil (src/app/api/profil/route.ts)
 * — seuls les champs affichés par l'écran Profil mobile. */
export type Profil = {
  pseudo: string;
  ville?: string;
  photoUrl?: string;
  matchsJoues: number;
  victoires: number;
  pointsCumules: number;
  rangNational?: number;
};

type ProfilBrut = {
  pseudo: string;
  photo_url: string | null;
  matchs_joues: number;
  victoires: number;
  villes: { nom: string } | null;
  points_cumules: number;
  rang_national?: number;
};

function depuisBrut(p: ProfilBrut): Profil {
  return {
    pseudo: p.pseudo,
    ville: p.villes?.nom,
    photoUrl: p.photo_url ?? undefined,
    matchsJoues: p.matchs_joues,
    victoires: p.victoires,
    pointsCumules: p.points_cumules,
    rangNational: p.rang_national,
  };
}

export async function monProfil(): Promise<Profil | undefined> {
  const resultat = await apiFetch<ProfilBrut | null>("/api/profil");
  return resultat.success && resultat.data ? depuisBrut(resultat.data) : undefined;
}

/** Utilisé par tournoi/[id]/moi.tsx pour l'identité "mes matchs". */
export async function monPseudo(): Promise<string | undefined> {
  return (await monProfil())?.pseudo;
}

/** Mêmes initiales que src/lib/server/classement.ts (initiales()) — 2
 * caractères max, premières lettres des mots du pseudo. */
export function initiales(pseudo: string): string {
  return pseudo
    .split(" ")
    .filter(Boolean)
    .map((m) => m[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
