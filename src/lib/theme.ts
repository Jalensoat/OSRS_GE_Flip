import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId =
  | "obsidian"
  | "gilded"
  | "runestone"
  | "wilderness"
  | "zaros"
  | "parchment";

export type ThemeTokens = {
  id: ThemeId;
  label: string;
  description: string;
  /** Preview swatches */
  swatches: [string, string, string];
  vars: {
    bg: string;
    surface: string;
    surface2: string;
    surface3: string;
    fg: string;
    muted: string;
    subtle: string;
    border: string;
    borderStrong: string;
    primary: string;
    primaryFg: string;
    accent: string;
    gain: string;
    loss: string;
    warn: string;
    ring: string;
    scheme: "dark" | "light";
  };
};

export const THEMES: ThemeTokens[] = [
  {
    id: "obsidian",
    label: "Obsidian",
    description: "Default dark charcoal with cool steel accent",
    swatches: ["#0a0b0d", "#1a1d26", "#6b8cae"],
    vars: {
      bg: "#0a0b0d",
      surface: "#12141a",
      surface2: "#1a1d26",
      surface3: "#232733",
      fg: "#e8e9ed",
      muted: "#8b90a0",
      subtle: "#5c6272",
      border: "#2a2e3a",
      borderStrong: "#3a4050",
      primary: "#c5ccd8",
      primaryFg: "#0a0b0d",
      accent: "#6b8cae",
      gain: "#3d9a6a",
      loss: "#c45c5c",
      warn: "#c49a4a",
      ring: "#6b8cae",
      scheme: "dark",
    },
  },
  {
    id: "gilded",
    label: "Gilded GE",
    description: "Near-black with warm gold coin highlights",
    swatches: ["#0c0a08", "#1c1610", "#c9a227"],
    vars: {
      bg: "#0c0a08",
      surface: "#14110c",
      surface2: "#1c1610",
      surface3: "#2a2118",
      fg: "#f3e6c8",
      muted: "#a8946e",
      subtle: "#6e5f48",
      border: "#3a3020",
      borderStrong: "#5a4a30",
      primary: "#e0c56a",
      primaryFg: "#14110c",
      accent: "#c9a227",
      gain: "#4aa86a",
      loss: "#c45c5c",
      warn: "#d4a017",
      ring: "#c9a227",
      scheme: "dark",
    },
  },
  {
    id: "runestone",
    label: "Runestone",
    description: "Deep slate with rune-blue glow",
    swatches: ["#070b12", "#121a28", "#4d8fd9"],
    vars: {
      bg: "#070b12",
      surface: "#0d1420",
      surface2: "#121a28",
      surface3: "#1a2436",
      fg: "#e4ebf5",
      muted: "#8a9bb3",
      subtle: "#556578",
      border: "#243044",
      borderStrong: "#354a66",
      primary: "#9ec0ef",
      primaryFg: "#070b12",
      accent: "#4d8fd9",
      gain: "#3d9a6a",
      loss: "#d06a6a",
      warn: "#c9a04a",
      ring: "#4d8fd9",
      scheme: "dark",
    },
  },
  {
    id: "wilderness",
    label: "Wilderness",
    description: "Danger-zone dark with skull-red accent",
    swatches: ["#0e0a0a", "#1a1212", "#c44a4a"],
    vars: {
      bg: "#0e0a0a",
      surface: "#141010",
      surface2: "#1a1212",
      surface3: "#261818",
      fg: "#f0e4e4",
      muted: "#a88888",
      subtle: "#6e5555",
      border: "#3a2828",
      borderStrong: "#5a3838",
      primary: "#e8b0b0",
      primaryFg: "#140c0c",
      accent: "#c44a4a",
      gain: "#4aa86a",
      loss: "#e06060",
      warn: "#d4a04a",
      ring: "#c44a4a",
      scheme: "dark",
    },
  },
  {
    id: "zaros",
    label: "Zaros Purple",
    description: "Void purple surfaces with amethyst accent",
    swatches: ["#0b0912", "#16121f", "#9b7ad8"],
    vars: {
      bg: "#0b0912",
      surface: "#110e1a",
      surface2: "#16121f",
      surface3: "#221c30",
      fg: "#ece6f5",
      muted: "#9a90b0",
      subtle: "#655c7a",
      border: "#2e2740",
      borderStrong: "#443a5c",
      primary: "#d0c4ef",
      primaryFg: "#110e1a",
      accent: "#9b7ad8",
      gain: "#4aaa7a",
      loss: "#d06a7a",
      warn: "#c9a04a",
      ring: "#9b7ad8",
      scheme: "dark",
    },
  },
  {
    id: "parchment",
    label: "Parchment",
    description: "Light journal theme for daytime banking",
    swatches: ["#f4efe4", "#e8e0d0", "#5a6e4a"],
    vars: {
      bg: "#f4efe4",
      surface: "#faf6ee",
      surface2: "#ebe3d4",
      surface3: "#ddd2be",
      fg: "#1c1812",
      muted: "#6a6254",
      subtle: "#8a8070",
      border: "#d0c4ae",
      borderStrong: "#b0a48e",
      primary: "#2a241c",
      primaryFg: "#faf6ee",
      accent: "#5a6e4a",
      gain: "#2d7a4a",
      loss: "#b04040",
      warn: "#a07020",
      ring: "#5a6e4a",
      scheme: "light",
    },
  },
];

export function getTheme(id: ThemeId): ThemeTokens {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

/** Apply CSS custom properties on :root (works with Tailwind @theme aliases). */
export function applyTheme(id: ThemeId) {
  const t = getTheme(id);
  const r = document.documentElement;
  const v = t.vars;
  r.style.setProperty("--color-bg", v.bg);
  r.style.setProperty("--color-surface", v.surface);
  r.style.setProperty("--color-surface-2", v.surface2);
  r.style.setProperty("--color-surface-3", v.surface3);
  r.style.setProperty("--color-fg", v.fg);
  r.style.setProperty("--color-muted", v.muted);
  r.style.setProperty("--color-subtle", v.subtle);
  r.style.setProperty("--color-border", v.border);
  r.style.setProperty("--color-border-strong", v.borderStrong);
  r.style.setProperty("--color-primary", v.primary);
  r.style.setProperty("--color-primary-fg", v.primaryFg);
  r.style.setProperty("--color-accent", v.accent);
  r.style.setProperty("--color-gain", v.gain);
  r.style.setProperty("--color-loss", v.loss);
  r.style.setProperty("--color-warn", v.warn);
  r.style.setProperty("--color-ring", v.ring);
  r.style.colorScheme = v.scheme;
  r.dataset.theme = id;

  // Safari / PWA chrome: theme-color paints the system strip (and any residual
  // under-tab gap). Must match tab-bar surface — NOT content bg — so a void
  // under the bar looks like continuous chrome, not #0a0b0d black.
  // html/body already use background: var(--color-surface) in styles.css;
  // setting --color-surface above keeps them in sync across theme switches.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", v.surface);
}

type ThemeState = {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: "obsidian",
      setTheme: (themeId) => {
        set({ themeId });
        if (typeof document !== "undefined") applyTheme(themeId);
      },
    }),
    {
      name: "osrs-ge-theme-v1",
      // Do not applyTheme here — mutating <html> before React hydrates
      // mismatches SSR (no data-theme / inline vars) and logs a hydration warning.
      // ThemeProvider applies after mount.
    },
  ),
);
