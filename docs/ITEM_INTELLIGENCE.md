# Item intelligence guide (agents + product)

## PC layout contract

| Mode | Behavior |
|------|----------|
| List tabs (Best/Hot/Watch/Volume) | **Full-width list only** — no permanent right drawer |
| Click item (desktop) | **Full-page** `ItemDetail` (`fullPage`) |
| Click item (mobile) | Bottom **sheet** (`sheet`, single scroll owner) |
| Search select | Same as click (full page / sheet) |
| Esc | Closes full page |

See also `docs/DUAL_PLATFORM.md`. Deploy: `npm run deploy` → https://osrs-ge-flip.vercel.app

## Research provenance

Deep dive: `docs/research/` (10 lanes, waves of 2) + `docs/research/HIDDEN_FACTORS_SYNTHESIS.md`.

**Principle:** Prefer metrics that change **turnaround**, **fill probability**, or **post-tax edge**, and that are **observable** from wiki prices/history/limits/bankroll.

## Canonical compute

| Module | Role |
|--------|------|
| `src/lib/osrs/itemInsights.ts` | `computeItemInsights(item, { bankroll, flipMode, history })` |
| `src/lib/osrs/flip.ts` | Bankroll-aware qty, GP/h, bottleneck, spike |
| `src/lib/osrs/api.ts` | Catalog + timeseries |

## Full-page zones (space-efficient)

1. **Header** — icon, name, badges (members, limit, trust, fill score), close  
2. **Decision strip** — 6 compact minis: net spread, fill score, GP/h, qty, volume, bottleneck  
3. **Risk chips** — regime, trend, freshness, imbalance, spike, edge vs vol, 5m pace  
4. **What to check** — 2–5 contextual bullets  
5. **Hero chart** — majority of viewport height on full page  
6. **Dense table** — exact prices, tax, avgs, ages (not large Stat cards)  
7. **Actions** — Watch + Wiki  

## User playbook (short)

1. **Is the spread real?** Fresh prints + two-sided volume (min high/low vol).  
2. **Can both legs fill?** Fill score + imbalance chip.  
3. **Is the mid stable?** Trend range + edge vs vol.  
4. **What binds you?** Bottleneck: limit / volume / capital.  
5. **Size** using bankroll model; don’t assume full limit every hour on thin books.  

## Do not regress

- Nested scroll traps on iOS sheet  
- Always-on PC aside eating list width  
- Pre-tax-only ranking  
- Claims of order-book depth or “smart money identity”  
