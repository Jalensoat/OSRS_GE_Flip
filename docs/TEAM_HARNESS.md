# Flip Lab team harness

**North star:** make OSRS Flip Lab the best *legal, fair-play* money-making tool for Old School RuneScape — capital-aware GE flips, alchs, and update-aware investments that a real player can execute.

This is a **single React PWA** (PC + iOS). Team leads are Cursor project agents in `.cursor/agents/`. They are not a second app and not Jagex-affiliated.

## How to use

| You want… | Invoke |
|-----------|--------|
| Route an ambiguous ask / pick owners | `/director-of-support` |
| Layout, chrome, sheets, themes, copy in the UI | `/ui-team-lead` |
| GE market, Jagex updates, polls, meta, research | `/market-intelligence-lead` |
| Flip / fill / tax / bankroll / ranking math | `/quant-flip-engine-lead` |
| What to build next to make more GP | `/product-strategy-lead` |
| Wiki API, caching, PWA, deploy, reliability | `/platform-data-lead` |
| PC + iOS verification before ship | `/qa-dual-platform-lead` |

Any lead may spawn specialists with `/create-subagent` without asking permission first.

**Cloud Agent:** start a Cloud Agent, name it after the lead, and paste: *Read `.cursor/agents/<name>.md` and `docs/TEAM_HARNESS.md`. You are that Team Lead. Follow the lead intake loop.*

## Shared lead loop (every Team Lead)

Copied from the UI Team Lead brief and required of every lead:

1. **Interpret** the ask against Flip Lab (tabs, bankroll, live wiki prices, dual platform).
2. **Ask the right questions** — a few targeted gaps, not a questionnaire.
3. **Show 2–3 concrete “this is what you’d get” options** before a large build. Tie options to existing surfaces/files. No fake UI screenshots as the product.
4. **Spawn specialists** (`/create-subagent` or Task) at discretion.
5. **Implement the recommended option** unless the user objects or the ask is research-only.
6. **Bypass the options theater** for tiny unambiguous fixes (typo, one-line bug, deploy).

## Roster

| Lead | Owns | Does not own |
|------|------|----------------|
| **Director of Support** | Intake, routing, conflict resolution, north-star check | Domain implementation |
| **UI Team Lead** | `src/components/ge/*`, `src/styles.css`, themes, dual-platform chrome | Flip math, wiki fetch, research claims |
| **Market Intelligence** | `docs/research/*`, `src/lib/osrs/intel.ts`, Invest thesis, update→item baskets | Visual chrome, ranking formulas |
| **Quant / Flip Engine** | `flip.ts`, `itemInsights.ts`, `highAlch.ts`, `format.ts` tax, ranking | Layout, news scraping |
| **Product Strategy** | Playbook, feature priority, capital tools, “does this make GP?” | Pixel polish, API plumbing |
| **Platform & Data** | `api.ts`, server fns, PWA, Vite/Vercel, `startup.sh` | Item ranking policy |
| **QA Dual-Platform** | `docs/DUAL_PLATFORM.md` checklist, iOS footer, smoke | Inventing features |

## Hard product laws (all leads)

- Dual platform unless the user scopes one side. See `docs/DUAL_PLATFORM.md`.
- Search = typeahead dropdown on **both** surfaces. Filters = same field set. Mobile item sheet = **one** scroll owner. PC = list-first, item click → full-page detail.
- Deploy after ship: `npm run deploy` → https://osrs-ge-flip.vercel.app
- Rank and display **post-tax** edge (2% GE tax, 5m cap). Never sort by raw high−low alone.
- Prefer metrics that change **turnaround**, **fill probability**, or **post-tax edge**, and that are **observable** from wiki prices / history / limits / bankroll. See `docs/ITEM_INTELLIGENCE.md` and `docs/research/HIDDEN_FACTORS_SYNTHESIS.md`.
- **Graveyard (do not claim):** order-book depth, queue position, counterparty identity, bot labels, guaranteed time-to-fill, merch-clan signals, RMT gold feeds, multi-account limit abuse.
- Fair play only. No RWT, no botting, no ToS-breaking automation.

## Handoff card

When a lead needs another lead, write this and invoke them:

```text
## Handoff
- From / to:
- User ask (interpreted):
- Why this lead:
- Options already shown (if any):
- Recommended next action:
- Files / research to read:
- Dual-platform impact: yes / no / n/a
- Blocked on:
```

## Existing product map

| Surface | Role |
|---------|------|
| Best / Hot | Volume-weighted vs last-trade flips (`rankFlips`) |
| Alch | High-alch GP/h after nature rune |
| Invest | Wiki polls, news, updates, trend picks (`intel.ts`) |
| Watch / Volume | User list + hot volume |
| Item detail | Decision strip + insights (`itemInsights.ts`) |
| Starting GP | Bankroll-aware qty / bottleneck |

Live prices: `https://prices.runescape.wiki/api/v1/osrs` via `src/lib/osrs/api.ts`.
