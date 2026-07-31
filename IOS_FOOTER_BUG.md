# iOS Home Screen — black gap under bottom tabs

## Status: **FIXED**

| | |
|---|---|
| **Fixed by** | Grok Build on PC |
| **Date** | 2026-07-31 |
| **Commit** | `3e10ba1` — `fix(ios-pwa): close Home Screen gap under bottom tab bar` |
| **Verified** | User confirmed Home Screen layout is correct after the PC fix |

---

## What was wrong

After “Add to Home Screen” on iPhone Safari, a large **black empty band** sat under the bottom tabs (Best / Hot / Invest / Watch / Volume). Safari tab + Grok live preview looked fine; standalone PWA did not. Re-adding the icon did not help.

Measured on user screenshot (`IMG_9102`): ~70 CSS-px of pure `#0a0b0d` *below* the entire tab bar (not normal home-indicator padding inside the bar).

## Root cause

**Dual height / dual bottom:**

1. `.app` was height-locked via `100dvh` **plus** JS `--app-height = Math.max(innerHeight, clientHeight)`
2. `.bottom-nav` used `position: fixed; bottom: 0`

Those coordinate systems diverge on iOS standalone. The mismatch painted as `#0a0b0d` (content **bg**) under the tab bar.

**Secondary:** `theme-color` was set to **bg**, so any residual system strip looked like void black instead of tab chrome.

## What failed before (web App Builder iterations)

1. Flex column shell + `env(safe-area-inset-bottom)` on nav  
2. Cap safe-area with `min(34px, …)`  
3. Pin shell to `visualViewport.height` / `offsetTop` ← made gap worse  
4. `position: fixed; inset: 0` + `100dvh` / `-webkit-fill-available` alone  
5. Fixed `bottom: 0` tab bar + `window.innerHeight` → `--app-height` pixel lock  
6. Body/html background = surface without removing height lock  
7. Status bar `black` vs `black-translucent`  
8. `maximum-scale=1` + 16px inputs (fixed zoom; not the footer gap)

## Fix applied (Grok Build on PC)

| Area | Change |
|------|--------|
| `.app` | `inset: 0` + `min-height` only (`100dvh` / `-webkit-fill-available`); **no** pixel `--app-height` lock; shell bg = **surface** |
| `.bottom-nav` | Still fixed to bottom; safe-area padding; `::after` surface underlay below the bar |
| `.app-main` | Content field bg = **bg**; pad for tab + safe-area |
| Height JS | `useIosKeyboardReset` only resets scroll (no layout height writes) |
| Root | Removed first-paint `--app-height` script |
| Theme | `applyTheme` → `theme-color` = **surface**; header chrome `bg-surface` |
| Manifest | `theme_color` / `background_color` = `#12141a` (surface) |

## Surface vs bg (keep in sync)

| Token | Obsidian default | Role |
|-------|------------------|------|
| `surface` | `#12141a` | Tab bar, header, theme-color, manifest, html/body, shell chrome |
| `bg` | `#0a0b0d` | Main content field (`.app-main`) only |

Files that must agree on default surface: `src/lib/theme.ts`, `src/styles.css` `@theme`, `src/routes/__root.tsx`, `public/site.webmanifest`.

## Key files

- `src/styles.css` — `.app`, `.bottom-nav`, `.app-main`
- `src/hooks/useVisualViewport.ts` — keyboard scroll reset only
- `src/routes/__root.tsx` — viewport / PWA meta (no height script)
- `src/lib/theme.ts` — theme-color = surface
- `src/components/ge/GeApp.tsx` — shell markup
- `public/site.webmanifest`

## Retest checklist (Home Screen)

1. Deploy / hard-refresh, then **remove** old Home Screen icon and re-add (PWA shell can cache meta/manifest).
2. Open from Home Screen (standalone), not Safari tab.
3. Tab bar flush to physical bottom; home-indicator strip is **surface**, not void black.
4. Switch themes — under-bar / status chrome follow each theme’s **surface**.
5. Rotate / notch: no black band under Best / Hot / Invest / Watch / Volume.
6. Desktop `lg:`: top tabs work; bottom nav hidden.
7. Inputs still 16px on phone (no focus zoom).

## Do not regress

- Reintroducing JS `--app-height` / visualViewport height pins on `.app`
- Setting `theme-color` or shell chrome back to content **bg**
- Flip math, API, board logic  
- Desktop top-nav layout  
- 16px mobile form controls  
