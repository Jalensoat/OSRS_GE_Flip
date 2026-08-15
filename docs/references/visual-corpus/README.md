# Visual corpus (core reference data)

This folder is Flip Lab’s **visual source of truth** — pictures and video of the real app (PC + mobile), ingested from other agent runs or captured from production.

It is **not** optional moodboard. It is backend reference data:

| Layer | Where |
|-------|--------|
| Files | this directory (committed; do **not** use gitignored `screenshots/`) |
| Index | `MANIFEST.json` |
| Database | table `visual_corpus` (`migrations/0002_visual_corpus.sql`) |
| Server API | `listVisualCorpus` in `src/lib/osrs/visualCorpus.ts` |
| Agent law | `AGENTS.md` + `.cursor/rules/visual-corpus.mdc` |

## Rules for every Team Lead

1. **Read this corpus before** any UI, QA, or “what does it look like?” work.
2. Isolated windows **cannot see** another Cursor agent’s VM recordings. If new footage appears in another run, **Director / Platform ingest it here** — do not assume the team can see it.
3. Do not redesign from memory or a generic dashboard. Match or deliberately depart from these frames.
4. After a user-visible UI ship, **add new frames** (PC + mobile) and update `MANIFEST.json`.

## Layout

- `current-app/` — stills of Best / Hot / Alch / Invest / detail (production ingest)
- `walkthrough/` — video of using the app
- `source-agent/` — originals copied from another agent when that VM is reachable

**Provenance:** other Cursor agent artifact stores are not mounted in this workspace. The first corpus is a production capture of https://osrs-ge-flip.vercel.app so the team still has a durable visual database. When another run’s files become available, copy them into `source-agent/` and index them.
