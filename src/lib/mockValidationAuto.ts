/**
 * PRÉ-BACKEND (point 157) : tant qu'il n'y a pas de vrai back-office de
 * vérification, toutes les demandes qui nécessiteraient normalement une
 * validation administrative (statut organisateur certifié, annulation de
 * tournoi, litige...) sont auto-validées immédiatement après envoi, pour ne
 * pas bloquer les tests du reste de l'app en attendant une intervention
 * manuelle.
 *
 * À retirer (repasser à false, puis supprimer les branches qui le lisent)
 * dès que le vrai backend de vérification est branché — voir le règlement
 * organisateur certifié (point 159) qui annonce un délai réel de 24h une
 * fois ce contournement levé.
 */
export const VALIDATION_AUTOMATIQUE_ACTIVE = true;
