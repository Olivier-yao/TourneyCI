/**
 * Point 204 : structure d'internationalisation — un dictionnaire de clés par
 * langue plutôt que du texte codé en dur. Ajouter une langue = ajouter une
 * entrée `Langue` + un dictionnaire complet ci-dessous, rien d'autre à
 * modifier ailleurs dans l'app (voir useLangue.ts pour la lecture réactive).
 *
 * Périmètre actuel : la structure est branchée sur les éléments globaux les
 * plus visibles (barre d'onglets, écran Paramètres) pour prouver le
 * mécanisme de bout en bout. Étendre la couverture à d'autres écrans se fait
 * en y ajoutant des clés ici puis des appels à t() dans ces écrans — aucun
 * changement structurel nécessaire.
 */

export type Langue = "fr" | "en";

export const LANGUES: { id: Langue; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
];

export const LANGUE_DEFAUT: Langue = "fr";

export const dictionnaires: Record<Langue, Record<string, string>> = {
  fr: {
    "tab.accueil": "Accueil",
    "tab.tournois": "Tournois",
    "tab.organisateur": "Organisateur",
    "tab.classement": "Ladder",
    "tab.profil": "Profil",
    "parametres.titre": "Réglages",
    "parametres.langue.section": "Langue",
    "parametres.langue.description": "Change la langue de l'application. D'autres langues pourront s'ajouter plus tard.",
  },
  en: {
    "tab.accueil": "Home",
    "tab.tournois": "Tournaments",
    "tab.organisateur": "Organizer",
    "tab.classement": "Ladder",
    "tab.profil": "Profile",
    "parametres.titre": "Settings",
    "parametres.langue.section": "Language",
    "parametres.langue.description": "Change the app's language. More languages can be added later.",
  },
};
