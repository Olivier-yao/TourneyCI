-- Ajoute "solo" a l'enum sous_type_equipe (tailles d'equipe du format
-- "Equipes"), qui affichait jusqu'ici Duo/Trio/Squad/Escouade. Remplace
-- Escouade (5, ajoutee au point 198 pour les formats 5v5 type CODM classe)
-- par Solo cote application, sur demande utilisateur - Postgres ne permet
-- pas de retirer une valeur d'enum facilement, donc "escouade" reste une
-- valeur valide en base (aucune ligne existante ne l'utilise) mais n'est
-- plus proposee/acceptee par l'app (cf. src/lib/mockTournaments.ts).
ALTER TYPE sous_type_equipe ADD VALUE IF NOT EXISTS 'solo';
