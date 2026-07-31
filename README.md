# OSRS Flip Lab

Capital-aware Old School RuneScape Grand Exchange flip finder.

Live wiki/RuneLite prices, volume-weighted “Best” vs aggressive “Hot” flips, starting GP bankroll sizing (buy limits + 1h volume + 2% GE tax), watchlist, investments (polls/news/trends), themes, and PWA install.

## Stack

- React 19 + TypeScript
- Vite 8 + TanStack Start / Router / Query
- Tailwind CSS v4
- Deploy target: Vercel (Nitro preset)  
- **Live site:** https://osrs-ge-flip.vercel.app

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

## Deploy (do this after every product change)

```bash
git push origin main
npm run deploy   # vercel --prod --yes
```

Production: **https://osrs-ge-flip.vercel.app**  
Agents must deploy after push so PC/iOS users don’t keep an old build.

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
| `IOS_FOOTER_BUG.md` | iOS Home Screen footer gap — **fixed** (PC); regression notes |

## iOS Home Screen layout — fixed

Fixed by **Grok Build on PC** (2026-07-31, `3e10ba1`). User confirmed on device.

Root cause and full fix table live in [`IOS_FOOTER_BUG.md`](./IOS_FOOTER_BUG.md) (written with the fix — dual height lock vs fixed tab bar; shell/theme-color use **surface**). Do not reintroduce `--app-height` pixel locks or set `theme-color` to content `bg`.

## Product features (working)

- **Best flips** — 1h/5m averages, volume gates, spike rejection, bankroll-aware qty  
- **Hot flips** — last-trade aggressive model  
- **Invest** — wiki polls + related GE prices, news, momentum  
- **Watchlist / volume / search**  
- **Starting GP** — k/m/b presets, profit/hour after tax  
- **Themes + logo** — PWA icons in `public/`  
- **Desktop** — wide detail drawer + chart; **mobile** — bottom tabs + sheet  
- **iOS Home Screen PWA** — tab bar flush to bottom  

## License

Private project for personal use. Not affiliated with Jagex.
