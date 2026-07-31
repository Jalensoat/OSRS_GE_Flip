# OSRS Flip Lab

Capital-aware Old School RuneScape Grand Exchange flip finder.

Live wiki/RuneLite prices, volume-weighted “Best” vs aggressive “Hot” flips, starting GP bankroll sizing (buy limits + 1h volume + 2% GE tax), watchlist, investments (polls/news/trends), themes, and PWA install.

## Stack

- React 19 + TypeScript
- Vite 8 + TanStack Start / Router / Query
- Tailwind CSS v4
- Deploy target: Vercel (Nitro preset)

## Run locally

```bash
npm install
npm run dev
# → http://localhost:8080
```

```bash
npm run typecheck
npm run build
```

## App structure (important files)

| Path | Role |
|------|------|
| `src/components/ge/GeApp.tsx` | Shell: header, tabs, lists, **bottom nav** |
| `src/styles.css` | App shell, safe-area, `.bottom-nav`, `.app` layout |
| `src/hooks/useVisualViewport.ts` | iOS height / keyboard reset (`--app-height`) |
| `src/hooks/useDisplayMode.ts` | Desktop vs phone / standalone detection |
| `src/routes/__root.tsx` | Viewport meta, PWA meta, theme-color |
| `public/site.webmanifest` | Home Screen manifest |
| `src/lib/osrs/*` | Prices API, flip math, intel/polls |
| `src/components/ge/*` | Flip board, detail, chart, invest, themes |

## Open bug — iOS Home Screen black gap under tab bar

**Symptom:** After “Add to Home Screen” on iPhone Safari, a large **black empty band** sits under the bottom tabs. Safari browser and in-app preview look fine. Deleting the icon, reloading Safari, and re-adding does **not** fix it.

**Measured:** User screenshot (`IMG_9102`) showed ~70 CSS-px of pure `#0a0b0d` *below* the tab bar (not home-indicator padding inside the bar).

**What was already tried (and failed on device):**

1. Flex column shell + `env(safe-area-inset-bottom)` on nav  
2. Cap safe-area with `min(34px, …)`  
3. Pin shell to `visualViewport.height` / `offsetTop` ← made gap worse on device  
4. `position: fixed; inset: 0` + `100dvh` / `-webkit-fill-available`  
5. Fixed `bottom: 0` tab bar + `window.innerHeight` → `--app-height`  
6. Body/html background set to tab-bar surface (`#12141a`) so residual strip matches  
7. Status bar style `black` vs `black-translucent`  
8. `maximum-scale=1` + 16px inputs (zoom issue was separate; mostly fixed)

**Current layout approach (still broken on user’s Home Screen):**

- `.app` — fixed full-screen grid, height `var(--app-height, 100dvh)`  
- `.bottom-nav` — `position: fixed; bottom: 0` with `env(safe-area-inset-bottom)` padding  
- `.app-main` — padding-bottom for tab bar height + safe area  
- Inline script in `__root.tsx` sets `--app-height` on first paint  

**Likely causes to investigate on PC / real device:**

1. Deployed production CSS lagging or cached PWA shell still serving old layout  
2. iOS standalone layout viewport shorter than screen even with `viewport-fit=cover`  
3. Fixed positioning containing block not the full screen on standalone  
4. Need `100svh` / `100lvh` / `dvh` combo or `screen.availHeight`  
5. Need a single opaque full-bleed bottom chrome that paints with canvas/body to the physical bottom  
6. Compare with a known-good PWA tab bar (user’s “Houseries” todo app works correctly)

**Device context:** iPhone, Safari, “Open as Web App” enabled when adding to Home Screen. Production URL pattern: `osrs-grok-getrading-assistant…` (Grok app deploy).

## Product features (working)

- **Best flips** — 1h/5m averages, volume gates, spike rejection, bankroll-aware qty  
- **Hot flips** — last-trade aggressive model  
- **Invest** — wiki polls + related GE prices, news, momentum  
- **Watchlist / volume / search**  
- **Starting GP** — k/m/b presets, profit/hour after tax  
- **Themes + logo** — PWA icons in `public/`  
- Desktop: wide detail drawer + chart; mobile: bottom tabs + sheet

## License

Private project for personal use. Not affiliated with Jagex.
