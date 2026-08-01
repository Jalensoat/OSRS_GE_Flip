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

1. **Header** — icon, name, badges (members, limit, trust), close  
2. **Decision strip (full width)** — flip profit, fill score, GP/h, bottleneck, vs hour avg, 24h mid move, context edge, price wobble; plus reliable sit buy→sell plan  
3. **Last GE prints** — typing aids (may disagree with model sits)  
4. **Risk chips** — regime, trend, freshness, imbalance, spike, edge vs vol, 5m pace  
5. **Hero chart** — lookback is zoom only; Quick signals use fixed 24h  
6. **What to check** + **More detail** — dense numbers (tax, avgs, ages, stack)  
7. **Actions** — Watch + Wiki · sticky plan footer on PC  

**Not in product:** dual “longer hold” panel or “quick flip is optimal” badge — one decision strip only.  

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
