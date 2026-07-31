# iOS Home Screen — black gap under bottom tabs

## Status: fixed (council 2026-07-31)

**Root cause (3/3 council):** dual height / dual bottom — `.app` was height-locked via `100dvh` + JS `--app-height = Math.max(innerHeight, clientHeight)` while `.bottom-nav` used `position: fixed; bottom: 0`. Those coordinate systems diverge on iOS standalone; the mismatch painted as `#0a0b0d` (content **bg**) under the tab bar.

**Secondary:** `theme-color` was set to **bg**, so any residual system strip looked like void black instead of tab chrome.

## Fix applied

| Area | Change |
|------|--------|
| `.app` | `inset: 0` + `min-height` only (`100dvh` / `-webkit-fill-available`); **no** pixel `--app-height` lock; shell bg = **surface** |
| `.bottom-nav` | Still fixed to bottom; safe-area padding; `::after` surface underlay below the bar |
| `.app-main` | Content field bg = **bg**; pad for tab + safe-area |
| Height JS | `useIosKeyboardReset` only resets scroll (no layout height writes) |
| Root | Removed first-paint `--app-height` script |
| Theme | `applyTheme` → `theme-color` = **surface**; header chrome `bg-surface` |
| Manifest | `theme_color` / `background_color` = `#12141a` (already correct) |

## Surface vs bg (keep in sync)

| Token | Obsidian default | Role |
|-------|------------------|------|
| `surface` | `#12141a` | Tab bar, header, theme-color, manifest, html/body, shell chrome |
| `bg` | `#0a0b0d` | Main content field (`.app-main`) only |

Files that must agree on default surface: `src/lib/theme.ts`, `src/styles.css` `@theme`, `src/routes/__root.tsx`, `public/site.webmanifest`.

## Retest checklist (Home Screen)

1. Deploy / hard-refresh, then **remove** old Home Screen icon and re-add (PWA shell can cache meta/manifest).
2. Open from Home Screen (standalone), not Safari tab.
3. Tab bar flush to physical bottom; home-indicator strip is **surface**, not void black.
4. Switch themes — under-bar / status chrome follow each theme’s **surface**.
5. Rotate / notch: no black band under Best / Hot / Invest / Watch / Volume.
6. Desktop `lg:`: top tabs work; bottom nav hidden.
7. Inputs still 16px on phone (no focus zoom).

## Do not regress

- Flip math, API, board logic  
- Desktop top-nav layout  
- 16px mobile form controls  
