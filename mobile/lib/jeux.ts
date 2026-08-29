/** Port de JEUX (src/lib/mockTournaments.ts) — ids réels, doivent exister
 * dans la table `jeux` (vérifié côté serveur à la création d'un tournoi).
 * Genre omis : le filtrage des formats par genre (FORMATS_PAR_GENRE) reste
 * hors scope pour cet incrément, tous les jeux proposent 1v1/Équipes. */
export const JEUX: { id: string; label: string }[] = [
  { id: "eafc", label: "EA FC" },
  { id: "freefire", label: "Free Fire" },
  { id: "codm", label: "CODM" },
  { id: "tekken", label: "Tekken" },
  { id: "pubgm", label: "PUBG Mobile" },
  { id: "mlbb", label: "Mobile Legends" },
  { id: "bloodstrike", label: "Bloodstrike" },
  { id: "farlight84", label: "Farlight 84" },
  { id: "valorant", label: "Valorant" },
  { id: "wildrift", label: "LoL: Wild Rift" },
  { id: "fortnite", label: "Fortnite" },
  { id: "brawlstars", label: "Brawl Stars" },
  { id: "clashroyale", label: "Clash Royale" },
  { id: "efootball", label: "eFootball" },
  { id: "nba2k", label: "NBA 2K" },
  { id: "standoff2", label: "Standoff 2" },
  { id: "criticalops", label: "Critical Ops" },
  { id: "aov", label: "Arena of Valor" },
  { id: "marvelsuperwar", label: "Marvel Super War" },
  { id: "mortalkombat", label: "Mortal Kombat" },
  { id: "shadowfight3", label: "Shadow Fight 3" },
  { id: "streetfighter", label: "Street Fighter Duel" },
  { id: "basketballstars", label: "Basketball Stars" },
  { id: "headsoccer", label: "Head Soccer" },
  { id: "newstate", label: "New State Mobile" },
  { id: "rulesofsurvival", label: "Rules of Survival" },
];
