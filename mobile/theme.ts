/**
 * Port TypeScript des tokens Nocturne (src/app/globals.css, bloc
 * `:root[data-theme="nocturne"]` côté web) — seul thème en scope pour cet
 * incrément (cf. CLAUDE.md racine, roadmap V2, phase mobile). Pas
 * d'équivalent CSS custom properties en React Native : valeurs figées ici,
 * à garder synchronisées manuellement si les tokens web changent.
 */
export const theme = {
  color: {
    bg: "#161826",
    surface: "#232532",
    surface2: "#292b31",
    text: "#e9e9ed",
    textMuted: "rgba(233, 233, 237, 0.55)",
    accent: "#9184d9",
    accent100: "#f5f4ff",
    accent300: "#b5abfc",
    accent600: "#796cbf",
    accent900: "#2b2741",
    border: "#3f424d",
    borderStrong: "#595d6c",
    muted: "#75798c",
    danger: "#e5484d",
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 14,
    pill: 999,
  },
  font: {
    // Inter n'est pas embarquée dans cet incrément (pas de chargement de
    // police custom encore) — la police système suffit pour les Fondations.
    heading: undefined as string | undefined,
    body: undefined as string | undefined,
  },
} as const;
