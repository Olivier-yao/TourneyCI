/**
 * Analyse automatique d'une demande de statut organisateur certifié (point
 * 170) : remplace l'auto-validation systématique du point 157 pour ce type
 * de demande précis — une certification accordée à l'aveugle expose la
 * plateforme (mauvaise publicité si l'organisateur n'est pas sérieux), donc
 * seules les demandes qui passent ce filtre sont auto-validées ; les autres
 * restent "en_attente" pour une revue manuelle dans l'interface admin
 * (point 160), qui affiche le détail des critères non remplis. Mock
 * pré-backend : critères déterministes et transparents, à remplacer par une
 * vraie revue (humaine ou automatisée) quand le backend existera.
 */

export type CritereAnalyse = { label: string; rempli: boolean };

export type AnalyseDemandeOrganisateur = {
  score: number;
  total: number;
  criteres: CritereAnalyse[];
  pertinente: boolean;
};

const SEUIL_PERTINENCE = 2;

export function analyserDemandeOrganisateur(
  motivation: string,
  identiteVerifiee: boolean,
): AnalyseDemandeOrganisateur {
  const criteres: CritereAnalyse[] = [
    { label: "Motivation détaillée (80 caractères ou plus)", rempli: motivation.trim().length >= 80 },
    { label: "Mentionne un volume ou une communauté (ex : nombre de joueurs)", rempli: /\d/.test(motivation) },
    { label: "Identité déjà vérifiée (CNI)", rempli: identiteVerifiee },
  ];
  const score = criteres.filter((c) => c.rempli).length;
  return { score, total: criteres.length, criteres, pertinente: score >= SEUIL_PERTINENCE };
}
