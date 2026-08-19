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

1. **Set Starting GP** — Best/Hot qty and GP/h size to this cash + 4h limit + 1h trades. Empty hides those lists. Alch/Invest do not rank as flips from this number.  
2. **Pick the job** — Best = reliable volume-weighted sits. Hot = last-trade aggressive. Alch = nature-rune downtime (3s tick). Invest = update/thesis hold. Watch = your local list. Volume = busiest tape, not a flip rank.  
3. **Is the spread real after tax?** Fresh prints + two-sided volume. Instant last prints can be red while Best is green — sit, don’t force. Don’t merge Best and Hot.  
4. **Can both legs fill?** Fill score + imbalance + last-5m pace (trade *count*, not 5m GP). Quiet or one-sided = stuck GP. Fill is a wiki estimate, not a timer or the GE book.  
5. **Sit the reliable plan** — type sit-buy / sit-sell. Chart lows are often thin dumps and are not what GP/h assumes.  
6. **What binds you?** Bottleneck: limit / volume / capital. Size from the model; verify in the GE. Start smaller if stale, quiet, or weird vs the hour.  

## Do not regress

- Nested scroll traps on iOS sheet  
- Always-on PC aside eating list width  
- Pre-tax-only ranking  
- Claims of order-book depth or “smart money identity”  
