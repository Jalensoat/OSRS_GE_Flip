# Wave 1 — Dual-platform ship-gate (QA)

**To:** Director of Support  
**From:** `/qa-dual-platform-lead`  
**Date:** 2026-08-18  
**Surfaces:** live production only (browser widths). No `src/**` edits.

## Ship-gate

**SHIPPABLE — no blockers on the flip loop.**  
PC (≥1024) and mobile (<1024) browser widths both load live Wiki prices, search via typeahead (no list swap), open item detail correctly (full-page vs one-scroll sheet), size flips from Starting GP, and keep auth off the board.

**Do not claim iOS Home Screen.** Footer/safe-area was checked in-browser only (`theme-color` + CSS contract). Real iPhone standalone / notch / home-indicator was not tested.

---

## 1. Surfaces tested

| Surface | How | Result |
|---------|-----|--------|
| Live PC 1440×900 | Playwright Chromium vs https://osrs-ge-flip.vercel.app | Exercised |
| Live mobile 390×844 (iPhone UA) | Playwright Chromium vs same URL | Exercised |
| Local Vite `:8080` | Probe | **Unreachable** (`ERR_CONNECTION_REFUSED`) |
| Real iPhone Safari / Home Screen PWA | — | **Not tested** |
| Real iOS keyboard + safe-area / rotate / notch | — | **Not tested** |

Code read (no edits): `GeApp.tsx`, `ListFilters.tsx`, `SearchDropdown.tsx`, `ItemDetail.tsx`, `FlipBoard.tsx`, `CapitalBar.tsx`, `styles.css`, `theme.ts`, `site.webmanifest`, `__root.tsx`, `useVisualViewport.ts`, `useDisplayMode.ts`, `watchlist.ts`, `itemInsights.ts`.

---

## 2. Pass list

- Auth does **not** block the flip board. `/` renders GeApp with no sign-in gate. `/login` is a bare 404 (auth routes not mounted).
- `theme-color` = `#12141a`. Shell `.app` surface `rgb(18,20,26)`; `.app-main` content bg `rgb(10,11,13)`. Manifest `theme_color` / `background_color` `#12141a`, `display: standalone`.
- No `--app-height` lock. `.app` is `inset: 0` + min-height only. Bottom nav `position:fixed; bottom:0` on mobile; `display:none` on PC.
- Search: portaled typeahead listbox on **both** widths. Typing “abyssal” does **not** replace the Best list. Select → PC full-page dialog; mobile bottom sheet.
- Mobile sheet: one overflow owner (`ownerCount=1`, nested inner scrollers `0`). Chart + “What to check” + Watch/Wiki reachable after scroll. Close (X) dismisses sheet.
- Item click: PC row → `role=dialog` full-page. Mobile row / search / Invest related item → sheet (`z-40`), not a desktop dialog.
- Filters field set matches on both: F2P, buy limit, buy/sell price, margin (after 2% tax), daily volume, potential profit, margin × volume. Mobile collapsible OK; remaining fields reachable by scrolling the list.
- Capital bar + presets (1m…1b) present on both. Changing 50m → 1m / 10m re-sizes Best (qty / GP/h).
- Live data: Best, Hot, Alch (nature rune + profit list), Invest (wiki polls + related GE), Watch (seeded 6 items), Volume (120 highest 1h) all populated. Empty/error copy exists for load failure and empty watch/search.
- Mobile sort chips on Best/Hot/Volume/Watch; PC sortable headers on boards.
- Inputs use `text-base` (16px) below `lg:` (iOS zoom guard). PC Starting GP measured 14px (`lg:text-sm`) — expected.
- Post-tax copy visible (capital bar, margin filter hint, item “No model edge after tax”). No order-book / bot / queue claims in the exercised UI.
- PWA meta: apple-mobile-web-app-capable, manifest link, apple-touch-icon.

---

## 3. Fail list

| # | Symptom | Repro | Owner | Severity |
|---|---------|-------|-------|----------|
| 1 | **PC Filters default closed** vs `docs/DUAL_PLATFORM.md` (“PC: filters panel default open”). Code: `filtersDefaultOpen = false` in `GeApp.tsx`. | Open live ≥1024 on Best. Filters `aria-expanded=false` until clicked. | **UI** | shippable |
| 2 | **Duplicate “24h mid move” hero cards** on item detail (PC full-page + mobile sheet). `ItemDetail` always renders that card; `holdEdge` fallback in `itemInsights.ts` uses the same label when there is no dip/premium/model edge. | Search “abyssal” → Abyssal ashes. Two identical-titled cards, same +5.07%. | **UI** (dedupe display) / **Quant** (holdEdge label) | shippable |
| 3 | **GP/h hint says “Set starting GP”** when bankroll is already set but there is no flip model (negative after-tax edge). | Starting GP = 1m, open Abyssal ashes. GP per hour = — / “Set starting GP”. | **UI** (copy) | later |
| 4 | **Watch tab accessible name includes badge count.** `getByRole('button', { name: 'Watch', exact: true })` misses the tab; name is effectively “Watch 6”. Tap still works. | Mobile bottom nav Watch with seeded count. | **UI** | later |
| 5 | **PC Watch/Volume header truncates** (“1H TRA…”). | Live PC Watch or Volume table. | **UI** | later |
| 6 | **`maximum-scale=1`** on viewport (`__root.tsx`) blocks pinch-zoom. | Any mobile browser. | **UI** | later |
| 7 | **Unknown routes are a chrome-less 404** (“Not Found” only). | https://osrs-ge-flip.vercel.app/login | **Platform** | later |
| 8 | **Hot can rank Fill 0** with huge GP/h (e.g. Team-11 cape Fill 0 next to 1.92m/h). Last-trade Hot by design; easy to misread as “will fill”. | Mobile Hot tab. | **Quant** (sort/filter?) or **Product** (is this the right Hot default?) | later |

No **blocker** filed. Flip loop is usable on both browser widths.

---

## 4. Could not test

- Real iPhone Home Screen (standalone), home-indicator strip, notch, rotate, theme-switch under the bar.
- Real iOS keyboard covering the bottom nav (in-browser focus on Starting GP does not overlap the tab bar; that is **not** an iOS keyboard).
- Local Vite preview (port 8080 refused). Live is the ship surface.
- Tablet 768–1023 as its own pass (code treats `<1024` as phone: bottom nav + sheet).
- Install-to-Home-Screen / “Add to Home Screen” flow.

---

## 5. Files written

Evidence only (no `src/**`):

- `docs/qa-wave1.md` (this file)
- `screenshots/live-pc-*.png` — Best, bankroll, filters, search, full-page item, tabs
- `screenshots/live-mobile-*.png` — Best, bankroll, filters, search, sheet + scrolled sheet, all tabs, Invest→item sheet
- `screenshots/live-login-route.png` — `/login` 404

---

## Handoff back

```text
## Handoff
- From / to: /qa-dual-platform-lead → /director-of-support
- User ask (interpreted): Wave 1 audit-only dual-platform ship-gate
- Why this lead: Done. Gate is SHIPPABLE with residuals.
- Recommended next action: Route residual #1–2 to /ui-team-lead (filters default open; duplicate 24h card). Do not block a player-facing ship on those. Home Screen confirmation still needs a real iPhone.
- Dual-platform impact: yes (residuals are UI)
- Blocked on: nothing for Wave 1
```
