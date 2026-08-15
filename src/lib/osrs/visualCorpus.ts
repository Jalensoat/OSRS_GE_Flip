import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

/**
 * Backend index of the visual corpus. Files live at
 * `docs/references/visual-corpus/`. Isolated agent windows cannot see another
 * Cursor run's screenshots/video unless those files were ingested here.
 *
 * Keep `docs/references/visual-corpus/MANIFEST.json` in sync with this list.
 */
export type VisualKind = "screenshot" | "video" | "icon";
export type VisualSurface = "pc" | "mobile" | "both" | "unknown";

export type VisualCorpusEntry = {
  id: string;
  path: string;
  kind: VisualKind;
  surface: VisualSurface;
  title: string;
  source: "other-agent" | "production-capture" | "repo";
  notes: string;
};

/** Canonical catalog — seed / upsert into `visual_corpus` on read. Keep in sync with MANIFEST.json. */
export const VISUAL_CORPUS_CATALOG: VisualCorpusEntry[] = [
  {
    id: "pc-best",
    path: "docs/references/visual-corpus/current-app/pc-best.png",
    kind: "screenshot",
    surface: "pc",
    title: "Best flips — desktop",
    source: "production-capture",
    notes:
      `Live https://osrs-ge-flip.vercel.app · 1280×800. Sibling-agent VM recordings were not available in this workspace.`,
  },
  {
    id: "pc-hot",
    path: "docs/references/visual-corpus/current-app/pc-hot.png",
    kind: "screenshot",
    surface: "pc",
    title: "Hot flips — desktop",
    source: "production-capture",
    notes:
      `Same production pass as pc-best.`,
  },
  {
    id: "pc-alch",
    path: "docs/references/visual-corpus/current-app/pc-alch.png",
    kind: "screenshot",
    surface: "pc",
    title: "High alch — desktop",
    source: "production-capture",
    notes:
      `Same production pass as pc-best.`,
  },
  {
    id: "pc-invest",
    path: "docs/references/visual-corpus/current-app/pc-invest.png",
    kind: "screenshot",
    surface: "pc",
    title: "Investments — desktop",
    source: "production-capture",
    notes:
      `Wiki polls + related GE prices.`,
  },
  {
    id: "pc-item-detail",
    path: "docs/references/visual-corpus/current-app/pc-item-detail.png",
    kind: "screenshot",
    surface: "pc",
    title: "Item detail — Arcane prayer scroll (desktop full-page)",
    source: "production-capture",
    notes:
      `Recaptured after first pass landed on Invest instead of full-page detail. Shows Quant strip + reliable sits + chart.`,
  },
  {
    id: "mobile-best",
    path: "docs/references/visual-corpus/current-app/mobile-best.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Best flips — mobile",
    source: "production-capture",
    notes:
      `390×844 · bottom tabs.`,
  },
  {
    id: "mobile-hot",
    path: "docs/references/visual-corpus/current-app/mobile-hot.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Hot flips — mobile",
    source: "production-capture",
    notes:
      `Same production pass as mobile-best.`,
  },
  {
    id: "mobile-alch",
    path: "docs/references/visual-corpus/current-app/mobile-alch.png",
    kind: "screenshot",
    surface: "mobile",
    title: "High alch — mobile",
    source: "production-capture",
    notes:
      `Same production pass as mobile-best.`,
  },
  {
    id: "mobile-invest",
    path: "docs/references/visual-corpus/current-app/mobile-invest.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Investments — mobile",
    source: "production-capture",
    notes:
      `Same production pass as mobile-best.`,
  },
  {
    id: "mobile-item-detail",
    path: "docs/references/visual-corpus/current-app/mobile-item-detail.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Item sheet — Arcane prayer scroll (mobile)",
    source: "production-capture",
    notes:
      `Recaptured bottom sheet after first pass missed the sheet. Single scroll owner visible.`,
  },
  {
    id: "walkthrough-pc-tabs",
    path: "docs/references/visual-corpus/walkthrough/app-walkthrough-pc.webm",
    kind: "video",
    surface: "pc",
    title: "Desktop walkthrough — Best / Hot / Alch / Invest tabs",
    source: "production-capture",
    notes:
      `Playwright recording of production tab clicks. Sibling-agent demo mp4 was not mounted.`,
  },
  {
    id: "walkthrough-pc-best-item-invest",
    path: "docs/references/visual-corpus/walkthrough/best-item-invest-pc.webm",
    kind: "video",
    surface: "pc",
    title: "Desktop walkthrough — Best → item detail → Invest",
    source: "production-capture",
    notes:
      `Playwright webm (~10s, 1280×800). Replacement for unmounted PR #1 end-to-end demo.`,
  },
  {
    id: "redesign-option-a-command-deck-pc",
    path: "docs/references/visual-corpus/source-agent/option-a-command-deck-pc.png",
    kind: "screenshot",
    surface: "pc",
    title: "UI redesign Option A — Command Deck (PC)",
    source: "other-agent",
    notes:
      `Original PNG from local ui-redesign agent work in screenshots/redesigns/. Not overwritten by later HTML recapture.`,
  },
  {
    id: "redesign-option-a-command-deck-mobile",
    path: "docs/references/visual-corpus/source-agent/option-a-command-deck-mobile.png",
    kind: "screenshot",
    surface: "mobile",
    title: "UI redesign Option A — Command Deck (mobile)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-a-item-detail-pc",
    path: "docs/references/visual-corpus/source-agent/option-a-item-detail-pc.png",
    kind: "screenshot",
    surface: "pc",
    title: "UI redesign Option A — item detail (PC)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-a-search-dropdown-pc",
    path: "docs/references/visual-corpus/source-agent/option-a-search-dropdown-pc.png",
    kind: "screenshot",
    surface: "pc",
    title: "UI redesign Option A — search dropdown (PC)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-a-search-dropdown-mobile",
    path: "docs/references/visual-corpus/source-agent/option-a-search-dropdown-mobile.png",
    kind: "screenshot",
    surface: "mobile",
    title: "UI redesign Option A — search dropdown (mobile)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-b-field-kit-pc",
    path: "docs/references/visual-corpus/source-agent/option-b-field-kit-pc.png",
    kind: "screenshot",
    surface: "pc",
    title: "UI redesign Option B — Field Kit (PC)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-b-field-kit-mobile",
    path: "docs/references/visual-corpus/source-agent/option-b-field-kit-mobile.png",
    kind: "screenshot",
    surface: "mobile",
    title: "UI redesign Option B — Field Kit (mobile)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-b-sheet-mobile",
    path: "docs/references/visual-corpus/source-agent/option-b-sheet-mobile.png",
    kind: "screenshot",
    surface: "mobile",
    title: "UI redesign Option B — item sheet (mobile)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-c-war-room-pc",
    path: "docs/references/visual-corpus/source-agent/option-c-war-room-pc.png",
    kind: "screenshot",
    surface: "pc",
    title: "UI redesign Option C — War Room (PC)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "redesign-option-c-war-room-mobile",
    path: "docs/references/visual-corpus/source-agent/option-c-war-room-mobile.png",
    kind: "screenshot",
    surface: "mobile",
    title: "UI redesign Option C — War Room (mobile)",
    source: "other-agent",
    notes:
      `Rendered from other-agent HTML mockup via their capture.mjs.`,
  },
  {
    id: "icon-anglerfish",
    path: "docs/references/visual-corpus/source-agent/icons/Anglerfish.png",
    kind: "icon",
    surface: "both",
    title: "Anglerfish",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-blood-rune",
    path: "docs/references/visual-corpus/source-agent/icons/Blood_rune.png",
    kind: "icon",
    surface: "both",
    title: "Blood rune",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-coal",
    path: "docs/references/visual-corpus/source-agent/icons/Coal.png",
    kind: "icon",
    surface: "both",
    title: "Coal",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-death-rune",
    path: "docs/references/visual-corpus/source-agent/icons/Death_rune.png",
    kind: "icon",
    surface: "both",
    title: "Death rune",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-dragon-bones",
    path: "docs/references/visual-corpus/source-agent/icons/Dragon_bones.png",
    kind: "icon",
    surface: "both",
    title: "Dragon bones",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-gold-ore",
    path: "docs/references/visual-corpus/source-agent/icons/Gold_ore.png",
    kind: "icon",
    surface: "both",
    title: "Gold ore",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-iron-ore",
    path: "docs/references/visual-corpus/source-agent/icons/Iron_ore.png",
    kind: "icon",
    surface: "both",
    title: "Iron ore",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-magic-logs",
    path: "docs/references/visual-corpus/source-agent/icons/Magic_logs.png",
    kind: "icon",
    surface: "both",
    title: "Magic logs",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-mahogany-plank",
    path: "docs/references/visual-corpus/source-agent/icons/Mahogany_plank.png",
    kind: "icon",
    surface: "both",
    title: "Mahogany plank",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-maple-logs",
    path: "docs/references/visual-corpus/source-agent/icons/Maple_logs.png",
    kind: "icon",
    surface: "both",
    title: "Maple logs",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-nature-rune",
    path: "docs/references/visual-corpus/source-agent/icons/Nature_rune.png",
    kind: "icon",
    surface: "both",
    title: "Nature rune",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-old-school-bond",
    path: "docs/references/visual-corpus/source-agent/icons/Old_school_bond.png",
    kind: "icon",
    surface: "both",
    title: "Old school bond",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-pure-essence",
    path: "docs/references/visual-corpus/source-agent/icons/Pure_essence.png",
    kind: "icon",
    surface: "both",
    title: "Pure essence",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-ranarr-weed",
    path: "docs/references/visual-corpus/source-agent/icons/Ranarr_weed.png",
    kind: "icon",
    surface: "both",
    title: "Ranarr weed",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-raw-shark",
    path: "docs/references/visual-corpus/source-agent/icons/Raw_shark.png",
    kind: "icon",
    surface: "both",
    title: "Raw shark",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-rune-arrow-5",
    path: "docs/references/visual-corpus/source-agent/icons/Rune_arrow_5.png",
    kind: "icon",
    surface: "both",
    title: "Rune arrow 5",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-super-restore-4",
    path: "docs/references/visual-corpus/source-agent/icons/Super_restore(4).png",
    kind: "icon",
    surface: "both",
    title: "Super restore (4)",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-twisted-bow",
    path: "docs/references/visual-corpus/source-agent/icons/Twisted_bow.png",
    kind: "icon",
    surface: "both",
    title: "Twisted bow",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-yew-logs",
    path: "docs/references/visual-corpus/source-agent/icons/Yew_logs.png",
    kind: "icon",
    surface: "both",
    title: "Yew logs",
    source: "other-agent",
    notes:
      `Wiki item icon used by ui-redesign agent mockups.`,
  },
  {
    id: "icon-mockup-logo",
    path: "docs/references/visual-corpus/source-agent/icons/mockup-logo.png",
    kind: "icon",
    surface: "both",
    title: "Redesign mockup logo",
    source: "other-agent",
    notes:
      `Logo copied from screenshots/redesigns/html/logo.png.`,
  },
  {
    id: "icon-repo-logo",
    path: "docs/references/visual-corpus/source-agent/icons/repo-logo.png",
    kind: "icon",
    surface: "both",
    title: "Flip Lab logo (repo)",
    source: "repo",
    notes:
      `Copied from public/logo.png (initial commit branding).`,
  },
  {
    id: "icon-repo-icon-512",
    path: "docs/references/visual-corpus/source-agent/icons/repo-icon-512.png",
    kind: "icon",
    surface: "both",
    title: "PWA icon 512 (repo)",
    source: "repo",
    notes:
      `Copied from public/icon-512.png.`,
  },
];

export async function syncVisualCorpus(): Promise<VisualCorpusEntry[]> {
  const sql = await getSql();
  for (const row of VISUAL_CORPUS_CATALOG) {
    await sql`
      insert into visual_corpus (id, path, kind, surface, title, source, notes, updated_at)
      values (
        ${row.id},
        ${row.path},
        ${row.kind},
        ${row.surface},
        ${row.title},
        ${row.source},
        ${row.notes},
        now()
      )
      on conflict (id) do update set
        path = excluded.path,
        kind = excluded.kind,
        surface = excluded.surface,
        title = excluded.title,
        source = excluded.source,
        notes = excluded.notes,
        updated_at = now()
    `;
  }
  const rows = await sql<VisualCorpusEntry>`
    select id, path, kind, surface, title, source, notes
    from visual_corpus
    order by kind, surface, id
  `;
  return rows;
}

export const listVisualCorpus = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisualCorpusEntry[]> => syncVisualCorpus(),
);
