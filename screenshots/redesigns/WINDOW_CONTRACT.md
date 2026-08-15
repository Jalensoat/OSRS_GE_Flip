# Window contract — UI redesign options (images only)

**Calling lead / merge owner:** `/ui-team-lead`  
**Goal (GP lever):** faster sit decisions + honest fill/post-tax attention — **not** a production rewrite.  
**Chosen option:** none (stakeholder picks). Deliverable = 3 option cards + PC/mobile PNGs.

## Shared types / names (do not invent)

- Tabs: Best / Hot / Alch / Invest / Watch / Volume
- Filters (`ListFilterState`): F2P, buy limit, buy price, sell price, margin, daily volume, potential profit, margin × volume
- Decision strip (Quant, `metricGuide.ts` / `ITEM_INTELLIGENCE.md`): flip profit after tax, Will it fill?, GP/h, bottleneck, vs hour avg, 24h mid move, context edge, price wobble, reliable sit buy→sell
- Risk chips: regime, trend, freshness, imbalance, spike, edge vs vol, 5m pace
- Invest content (`intel.ts`): polls, official news, wiki updates, trend picks, `MARKET_FACTORS`, `POLL_BASKETS`

## Product laws

- Search = typeahead **dropdown on both** (never live-list-swap)
- Same filter fields; PC panel **default open**
- Mobile item sheet = **one** scroll owner
- PC list-first (no permanent right drawer); click → full-page
- iOS tab bar / safe-area; no `--app-height` lock
- Honest post-tax numbers; no order-book / bot / “smart money”

## Dual-platform

Yes — every option has `lg:` ≥1024 and `<1024` + bottom tabs.

## Windows (this wave)

This seat could not spawn isolated Task windows from the current runner (no Task tool). Contract written in-process (planner-equivalent). Consult was **readonly** against other leads’ briefs + source:

| Window | Write | Return | Do not touch |
|--------|-------|--------|--------------|
| Product Strategy (consult) | none | GP thesis per option | `src/**` |
| Market Intelligence (consult) | none | Invest/calendar surfaces that may change | `intel.ts` formulas |
| Quant Flip Engine (consult) | none | Numbers that MUST stay on the strip | `flip.ts` / tax |
| UI Team Lead (this seat) | `screenshots/redesigns/**` only | 6+ PNGs + option cards | production `src/components/ge/*` |

**Sequence:** consult → render mockups → screenshot.  
**Out of scope:** `/ui-implementer` build, `/qa-dual-platform-lead` ship-gate, `npm run deploy`.

## Consult notes (facts, not invented math)

### Quant — must stay on the decision strip

From `KEY_DECISION_METRICS` + `ITEM_INTELLIGENCE.md` full-page zones:

1. Flip profit / item (post-tax; 2% / 5m cap)
2. Will it fill? (0–100)
3. GP per hour (bankroll × limit × volume)
4. What's stopping you (limit / volume / cash)
5. Vs hour average
6. 24h mid move
7. Context edge
8. Price wobble
9. Reliable sits (avg-clear sit buy → sit sell)

Field Kit may **demote** 5–8 into a “More” fold on the list, but must not drop 1–4 + sits from item detail. Do not invent tax/fill math in mockups — labels match `metricGuide.ts`.

### Market — Invest / update surfaces

War Room may promote existing `InvestBoard` blocks (polls + related prices, official news, wiki updates, rising/dipping/liquidity, historical factors) and add **phase** chips already in the Market brief: rumor | poll | newspost | release | settle | league.  
Do **not** sort Best by “update hype.” Baskets stay `POLL_BASKETS` (CoX, ToB, …). Example headlines in mockups are **layout placeholders**, not live patch notes.

### Product — which redesign makes more GP

- Best ≠ Hot; Invest is not a second flip list; Alch is a different engine.
- Success: “act in under 30 seconds with an honest fill story.”
- Anti-goal: Bloomberg vanity that dumps 40 metrics.
- Command Deck wins **turnaround** if chips are the *existing* Quant set, not new fake signals.
- Field Kit wins **attention** on phone (one-handed sit).
- War Room wins **update weeks** (avoid sitting into a dump); weaker as everyday default home.
