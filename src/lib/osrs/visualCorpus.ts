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
      "Live production. Sibling-agent VM recordings are not mounted unless copied here.",
  },
  {
    id: "pc-hot",
    path: "docs/references/visual-corpus/current-app/pc-hot.png",
    kind: "screenshot",
    surface: "pc",
    title: "Hot flips — desktop",
    source: "production-capture",
    notes: "",
  },
  {
    id: "pc-alch",
    path: "docs/references/visual-corpus/current-app/pc-alch.png",
    kind: "screenshot",
    surface: "pc",
    title: "High alch — desktop",
    source: "production-capture",
    notes: "",
  },
  {
    id: "pc-invest",
    path: "docs/references/visual-corpus/current-app/pc-invest.png",
    kind: "screenshot",
    surface: "pc",
    title: "Investments — desktop",
    source: "production-capture",
    notes: "",
  },
  {
    id: "pc-item-detail",
    path: "docs/references/visual-corpus/current-app/pc-item-detail.png",
    kind: "screenshot",
    surface: "pc",
    title: "Item detail — desktop",
    source: "production-capture",
    notes: "",
  },
  {
    id: "mobile-best",
    path: "docs/references/visual-corpus/current-app/mobile-best.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Best flips — mobile",
    source: "production-capture",
    notes: "390×844 · bottom tabs.",
  },
  {
    id: "mobile-hot",
    path: "docs/references/visual-corpus/current-app/mobile-hot.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Hot flips — mobile",
    source: "production-capture",
    notes: "",
  },
  {
    id: "mobile-alch",
    path: "docs/references/visual-corpus/current-app/mobile-alch.png",
    kind: "screenshot",
    surface: "mobile",
    title: "High alch — mobile",
    source: "production-capture",
    notes: "",
  },
  {
    id: "mobile-invest",
    path: "docs/references/visual-corpus/current-app/mobile-invest.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Investments — mobile",
    source: "production-capture",
    notes: "",
  },
  {
    id: "mobile-item-detail",
    path: "docs/references/visual-corpus/current-app/mobile-item-detail.png",
    kind: "screenshot",
    surface: "mobile",
    title: "Item / invest context — mobile",
    source: "production-capture",
    notes: "",
  },
  {
    id: "walkthrough-pc",
    path: "docs/references/visual-corpus/walkthrough/app-walkthrough-pc.webm",
    kind: "video",
    surface: "pc",
    title: "Desktop walkthrough — Best / Hot / Alch / Invest",
    source: "production-capture",
    notes: "Playwright recording of production.",
  },
  {
    id: "walkthrough-best-item-invest",
    path: "docs/references/visual-corpus/walkthrough/best-item-invest-pc.webm",
    kind: "video",
    surface: "pc",
    title: "Desktop walkthrough — Best → item detail → Invest",
    source: "production-capture",
    notes: "Second pass: list click into full-page detail, then Invest.",
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
