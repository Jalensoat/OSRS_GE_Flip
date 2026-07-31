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
| `src/hooks/useVisualViewport.ts` | iOS keyboard scroll reset only (no height lock) |
| `src/hooks/useDisplayMode.ts` | Desktop vs phone / standalone detection |
| `src/routes/__root.tsx` | Viewport meta, PWA meta, theme-color |
| `src/lib/theme.ts` | Themes; `theme-color` follows **surface** |
| `public/site.webmanifest` | Home Screen manifest |
| `src/lib/osrs/*` | Prices API, flip math, intel/polls |
| `src/components/ge/*` | Flip board, detail, chart, invest, themes |
| `IOS_FOOTER_BUG.md` | iOS Home Screen footer gap — **fixed**; keep as regression notes |

## iOS Home Screen layout — FIXED

**Status:** Fixed by **Grok Build on PC** (2026-07-31, commit `3e10ba1`). User confirmed.

**Was:** Large black band under bottom tabs in standalone Home Screen PWA only.

**Root cause:** Dual height systems — JS `--app-height` pixel lock on `.app` fought `position: fixed; bottom: 0` on the tab bar; mismatch painted content `bg` under the tabs. `theme-color` also used `bg`, so residual chrome looked like a void.

**Fix summary:** No pixel height lock; shell/chrome use **surface**; tab bar fixed bottom + surface underlay; keyboard hook only resets scroll. Full write-up: [`IOS_FOOTER_BUG.md`](./IOS_FOOTER_BUG.md).

**Do not reintroduce** `--app-height` / visualViewport height pins or set `theme-color` to content `bg`.

## Product features (working)

- **Best flips** — 1h/5m averages, volume gates, spike rejection, bankroll-aware qty  
- **Hot flips** — last-trade aggressive model  
- **Invest** — wiki polls + related GE prices, news, momentum  
- **Watchlist / volume / search**  
- **Starting GP** — k/m/b presets, profit/hour after tax  
- **Themes + logo** — PWA icons in `public/`  
- **Desktop** — wide detail drawer + chart; **mobile** — bottom tabs + sheet  
- **iOS Home Screen PWA** — tab bar flush to bottom (see above)

## License

Private project for personal use. Not affiliated with Jagex.
