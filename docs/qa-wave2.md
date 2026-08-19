# Wave 2 — Dual-platform ship-gate (QA)

**To:** Director of Support  
**From:** `/qa-dual-platform-lead`  
**Date:** 2026-08-18  
**Surfaces:** **local working tree** `http://127.0.0.1:8080/` is the ship-gate. Live glanced only (still old). No `src/**` edits. No commit.

## Ship-gate

**PASS — SHIPPABLE on both breakpoints.**  
PC (≥1024 / 1440×900) and mobile (<1024 / 390×844 iPhone UA) both load live Wiki prices, keep auth off the board, search via typeahead (no list swap), open item detail correctly (full-page vs one-scroll sheet + pinned sit plan), keep Invest on Invest after an item click, size flips from Starting GP, and show the Wave 1 residual fixes (PC filters default open, one “24h mid move” card, GP/h hint not “Set starting GP”).

**Do not claim iOS Home Screen.** Footer/safe-area checked in-browser only (`theme-color` + CSS contract + flush bottom-nav at 390×844). Real iPhone standalone / notch / home-indicator / rotate was not tested.

**Live https://osrs-ge-flip.vercel.app is not this tree.** Filters still default closed on prod. Local is the gate; deploy is still required before players see Wave 2.

---

## 1. Surfaces tested

| Surface | How | Result |
|---------|-----|--------|
| Local PC 1440×900 | Playwright Chromium vs http://127.0.0.1:8080/ | Exercised |
| Local mobile 390×844 (iPhone UA) | Playwright Chromium vs same URL | Exercised |
| Live prod glance | Playwright vs https://osrs-ge-flip.vercel.app | Up, **old UI** (filters closed) |
| Real iPhone Safari / Home Screen PWA | — | **Not tested** |
| Real iOS keyboard + safe-area / rotate / notch | — | **Not tested** |

Runtime log: `screenshots/wave2-findings.json` (72 pass / 2 harness-noise fails, both overturned by screenshot).

---

## 2. Always-check (Director interrupt list)

| Check | PC | Mobile | Evidence |
|-------|----|--------|----------|
| Filters default | **Open** (`aria-expanded=true`) | **Collapsed** (`false`); same 7 ranges + F2P when opened | `wave2-pc-filters-open.png`, `wave2-mobile-01-best.png` |
| Search typeahead, no list-swap | Pass — listbox; Best board stayed | Pass — listbox; Best board stayed | `wave2-*-search-dropdown.png`; arrows/Enter opened item |
| Item click layout | Full-page dialog (Aquanite hopper) | One overflow-y owner; sit-plan footer pinned | `wave2-pc-item-fullpage.png`, `wave2-mobile-item-sheet.png` |
| Invest stays on Invest | Pass (`tabStillInvest=true`) | Pass; Blood rune sheet over Invest | `wave2-mobile-invest-item.png`, `wave2-pc-tab-invest.png` |
| Starting GP copy on phone | Desktop subtitle + footer | **Visible:** “Sizes Best/Hot stacks to this cash…” | Capital bar on both Best shots |
| Best / Hot / Alch / Invest / Watch / Volume | All live-looking | All live-looking | `wave2-*-tab-*.png` |
| Capital bar sizes flips | 1m vs 10m changed board | 1m vs 10m changed board | `wave2-*-bankroll-1m.png` |
| `theme-color` = surface | `#12141a` | `#12141a` | meta + manifest |
| Auth does not block | Board, no sign-in | Board, no sign-in | `/` renders GeApp |

---

## 3. Pass list (Wave 2 claims)

**UI**
- PC filters default open; mobile collapsed; same field set (Buy limit, Buy/Sell price, Margin, Daily volume, Potential profit, Margin × volume, F2P).
- Search is a portaled typeahead **combobox** on both; typing “abyssal” does not replace the Best list; Arrow/Enter opens the item.
- PC item = full-page dialog. Mobile item = sheet, **one** scroll owner, sit plan pinned (`Plan · buy … · sell …`).
- Invest item click stays on Invest (does not switch to Best).
- Starting GP uses STARTING_GP_GUIDE; mobile teaching visible.
- One “24h mid move” hero card (not two identical titles). Hold-edge fallback is a **different** card (“Day direction” on Blood rune; “Premium vs hour mid” on Aquanite hopper).
- GP/h hint is ROI when sized, or “No sized stack for this item” when bankroll is set but no model — not “Set starting GP”.
- Watch a11y: PC `Watchlist, 6`; mobile `Watch, 6`.
- PC Watch/Volume header is **`1h` / `5m`** — Wave 1 “1H TRA…” is gone (scraper false-fail in JSON; column text is `Item Buy Sell Margin 1h 5m Fill`).
- Phone Starting GP input **16px**. `theme-color` = `#12141a`. No `--app-height`. Viewport allows pinch (`no maximum-scale=1`).
- Refresh `aria-label="Refresh prices"`. Esc closes item sheet/full-page **and** theme picker. Retry exists on catalog error (not triggered this run).

**Product (in “How to read” / Act in 30 seconds)**
- 30s playbook present. Best≠Hot, Alch≠flip, Invest≠flip, “sales under 100 gp have no GE tax”.

**Market**
- Invest baskets show Aug 2026 copy: Fractured Archive lock-in, CoX unique weights, Wyrmscraig uniques (`wave2-pc-tab-invest.png`). Mobile Invest also showed those strings.

**Quant / Platform (code-read + UI, not unit-tested here)**
- `geTax` exempts sales &lt;100. Hot qty uses thinner 1h side (`min(buy,sell)*0.7`). Best/Hot filters use sit buy/sell and modelled GP/h. Missing limit ≠ 10k. Missing print times are not “fresh”. `natureCost <= 0` → no alch rows. Wiki 429 retry + last-good catalog. `startup.sh` is relative. Manifest icons split any/maskable.

---

## 4. Fail / residual list

| # | Symptom | Repro | Owner | Severity |
|---|---------|-------|-------|----------|
| 1 | **Live prod is the old tree.** Filters still default closed on vercel.app. Players will not see Wave 2 until deploy. | Open https://osrs-ge-flip.vercel.app ≥1024. Filters `aria-expanded=false`. | **Platform** (DoS: `npm run deploy` after merge) | shippable *(local gate PASS; prod not this SHA)* |
| 2 | **Mobile Best sort chip truncates** (“Tr…”). | Local 390 Best list sort row. | **UI** | later |
| 3 | **How to read modal does not dismiss on Esc** (item + theme do). First harness pass left the guide overlay blocking later clicks until Close was used. Not in the shipped Esc claim, but it bit automation and will bit keyboard users. | Open How to read → Esc. | **UI** | later |
| 4 | Catalog **Retry** and last-good stale banner were not forced (wiki was healthy). | n/a this run | **Platform** | later *(code present)* |

No **blocker**. Flip loop is usable on both browser widths.

Automated JSON listed two extra fails — **overturned**:
- `pc-1h-header`: scraper grabbed ancestor text; Watch table headers are `1h` / `5m`.
- `pc market-baskets`: first Invest paint race; later `wave2-pc-tab-invest.png` shows Wyrmscraig + Fractured Archive.

---

## 5. Could not test

- Real iPhone Home Screen (standalone), home-indicator strip, notch, rotate, theme-switch under the bar.
- Real iOS keyboard vs bottom nav.
- Tablet 768–1023 as its own pass (code treats &lt;1024 as phone).
- Forced wiki 429 / empty nature / missing limit runtime paths.
- Add-to-Home-Screen install flow.

---

## 6. Files written

Evidence only (no `src/**`):

- `docs/qa-wave2.md` (this file)
- `screenshots/wave2-findings.json`
- `screenshots/wave2-pc-*.png` — Best, filters, search, bankroll, full-page item, guide, tabs, Invest
- `screenshots/wave2-mobile-*.png` — Best, filters, search, bankroll, sheet + scrolled, Invest item, tabs
- `screenshots/wave2-live-glance-pc.png` — old prod

---

## Handoff back

```text
## Handoff
- From / to: /qa-dual-platform-lead → /director-of-support
- User ask (interpreted): Wave 2 re-audit of local working tree (audit fixes). Local is ship-gate; live is old.
- Why this lead: Done. Gate is PASS / SHIPPABLE on PC and mobile browser widths. No blockers.
- Recommended next action: Deploy this tree (`npm run deploy`) so live matches local. Residual #2–3 to /ui-team-lead when convenient. Home Screen still needs a real iPhone.
- Dual-platform impact: yes (verified both)
- Blocked on: production deploy (not a local fail)
```
