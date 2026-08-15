# UI Team Lead — three redesign options

**Interpreted ask:** Stakeholder wants *images* of three distinct Flip Lab redesigns (same PWA, both platforms) so they can pick a direction. Not a production rewrite.

**Tldraw (live layout map):** canvas `s5ymmo50` — three option cards + laws. Examples only; PNGs below are the “this is what you’d get” shots.

**GP job:** get a real sit into the GE faster, with honest fill + post-tax edge, without breaking dual-platform laws.

---

## Option A — Command Deck

**Thesis:** Put the Quant decision set *on the list* so a 50m flipper can sit without opening every row. GP lever = **turnaround** (seconds to sit) + **fill** (Will fill? / freshness / flow / 5m visible before click).

**PC (`lg:` ≥1024)**
- Compact terminal chrome; Best/Hot/Alch/Invest/Watch/Volume stay top tabs.
- Full-width flip table (list-first). Extra columns are *existing* insights only: fill bar, freshness, buy-vs-sell flow, 5m pace, bottleneck.
- Sit tape on the #1 row: sit buy / sit sell / post-tax / fill.
- Filters **default open**, same 7 ranges + F2P.
- Item click → full-page strip (all 8 Quant cards + sits + risk chips + chart). No right drawer.

**Mobile (&lt;1024 + bottom tabs)**
- Same search field; typeahead **dropdown** (list does not swap).
- 2×2 sit tape for #1, then dense cards with the same chips.
- Sort chips unchanged (GP/h, fill, sold 1h, …).
- Item tap → one-scroll sheet. Tab bar + home-indicator safe-area.

**Stays:** Live wiki prices, Best ≠ Hot, bankroll bar, post-tax ranking, watch/volume/alch/invest tabs, `SearchDropdown`, `ListFilterState`.
**Changes:** Density + chip columns on the board; PC filters forced open (today’s `filtersDefaultOpen = false` in `GeApp.tsx` is a law miss); sit tape on Best.

**Images**
- `docs/ui/redesigns/option-a-command-deck-pc.png`
- `docs/ui/redesigns/option-a-command-deck-mobile.png`
- Extra: `option-a-search-dropdown-pc.png`, `option-a-search-dropdown-mobile.png`, `option-a-item-detail-pc.png`

**Risk / would NOT ship**
- Do not add fake depth, queue, or “smart money.”
- Do not dump 40 metrics (Product anti-goal). Chips = `itemInsights` only.
- Do not merge Best and Hot.

**GP effect:** faster sit · clearer fill · same post-tax math.

---

## Option B — Field Kit

**Thesis:** One-handed phone sessions are where attention dies. Hero the sit prices and one fat action; hide wobble / 24h / vs-hour until the sheet. GP lever = **attention** (less staring) + **turnaround** on iOS.

**PC**
- Same tabs + typeahead + **open** filter field set.
- Hero “Next sit” card: huge sit buy / sit sell, Copy sit prices, fill + bottleneck chips.
- Simplified card list (profit + traffic-light fill only). Still full-width; click → full-page with the **full** Quant strip.

**Mobile**
- 16px search (no iOS zoom). Bankroll as a chip.
- Huge BUY / SELL + “Sit this in the GE” in the thumb zone.
- Filters collapsed but **same fields** (note on-screen).
- Sheet = one scroll owner: sits → profit/fill/GP/h/bottleneck → more strip → chart → primary button.

**Stays:** All six tabs, tax copy, sit-plan semantics (avg clears, not chart floor).
**Changes:** Visual system (parchment/gold), list density down, teaching copy up.

**Images**
- `docs/ui/redesigns/option-b-field-kit-pc.png`
- `docs/ui/redesigns/option-b-field-kit-mobile.png`
- Extra: `option-b-sheet-mobile.png`

**Risk / would NOT ship**
- Do not drop fill, post-tax profit, GP/h, bottleneck, or sits from **item detail**.
- Do not invent a second “hold plan.”
- PC must not become a marketing landing page with a hidden table.

**GP effect:** fewer wasted taps on phone · same honest numbers on the strip.

---

## Option C — Update War Room

**Thesis:** Update weeks destroy sits that looked green yesterday. Promote Invest (polls, news, wiki updates, baskets, phase) so capital is not parked into a dump. GP lever = **avoided loss / better timing**, not a fatter Best margin.

**PC**
- Invest is the pictured home. Best/Hot remain list-first tabs (not a second flip list, not a right drawer).
- Phase rail from Market: rumor | poll | newspost | release | settle | league.
- Existing `InvestBoard` blocks restaged: poll + `POLL_BASKETS` (CoX example), official news, wiki updates, rising/dipping/liquidity, `MARKET_FACTORS`.
- Search still typeahead. Basket item click → full-page item (same strip).

**Mobile**
- Invest tab active in the **same** 6-tab bar.
- Phase chips + one scroll of poll basket / news / momentum.
- Search dropdown; item → one-scroll sheet.

**Stays:** Best ranking is still post-tax × fill × velocity. Intel fetch + factors.
**Changes:** Invest chrome + phase labels; calendar-first *attention*, not a new engine.

**Images**
- `docs/ui/redesigns/option-c-war-room-pc.png`
- `docs/ui/redesigns/option-c-war-room-mobile.png`

**Risk / would NOT ship**
- Do **not** sort Best by “update hype.”
- Headlines in the mock are **layout placeholders**, not live patch notes (Market must fetch).
- No order-book / bot / merch-clan claims. “Thin book” language is graveyard — mock uses limit-locked / high-ticket.

**GP effect:** better update-week attention · zero change to flip formulas unless Quant accepts a freshness/spike flag.

---

## Consulted (readonly — no Task windows in this runner)

| Seat | How | What they constrained |
|------|-----|------------------------|
| `/planner` | Contract written in-process (`WINDOW_CONTRACT.md`) | Images-only write set; no `src/` rewrite |
| `/product-strategy-lead` | Brief + playbook truths | Best ≠ Hot; Invest ≠ second Best; “act in &lt;30s with an honest fill story”; anti-Bloomberg |
| `/market-intelligence-lead` | Brief + `intel.ts` + InvestBoard | Phase model; baskets; Invest surfaces; no invented notes; no hype-sort |
| `/quant-flip-engine-lead` | Brief + `metricGuide.ts` + `ITEM_INTELLIGENCE.md` | Strip must keep: post-tax profit, fill, GP/h, bottleneck, vs hour, 24h mid, context edge, wobble, sit buy→sell |
| `/ui-implementer` / `/ui-dual-platform` | Briefs read; **not spawned** | Would build only after a pick |
| `/qa-dual-platform-lead` | Not handed | No ship / no deploy (research-only images) |

---

## Recommended: **Option A — Command Deck** (restrained)

Everyday job is still **Best/Hot sits**, not Invest. A wins GP if the extra chips are the Quant set already computed (`fillScore`, freshness, imbalance, 5m, bottleneck) — that is turnaround, not vanity.

- Pick **B** if the stakeholder is phone-primary / one-handed (ask #1).
- Treat **C** as the Invest *upgrade* (and a seasonal skin on update weeks), not the default chrome. Can ship C’s Invest restage *after* A without a second app.

**Would build next (only if they pick A):** `/ui-implementer` on `FlipBoard` + `GeApp` filter default + sit tape; `/ui-dual-platform` parity; Quant unchanged; QA ship-gate; then `npm run deploy`.

---

## Questions for the stakeholder (max 3)

1. **Where do you sit flips — mostly PC, or mostly phone Home Screen?** (A vs B)
2. **Is this an update-week problem** (sitting into dumps) **or a daily Best-list speed problem?** (C vs A)
3. **Bankroll band you actually play** — ~5–25m, ~50–100m, or 500m+? (changes which bottleneck we hero)

---

## Image index (absolute)

1. `docs/ui/redesigns/option-a-command-deck-pc.png`
2. `docs/ui/redesigns/option-a-command-deck-mobile.png`
3. `docs/ui/redesigns/option-b-field-kit-pc.png`
4. `docs/ui/redesigns/option-b-field-kit-mobile.png`
5. `docs/ui/redesigns/option-c-war-room-pc.png`
6. `docs/ui/redesigns/option-c-war-room-mobile.png`
7. `docs/ui/redesigns/option-a-search-dropdown-pc.png`
8. `docs/ui/redesigns/option-a-search-dropdown-mobile.png`
9. `docs/ui/redesigns/option-a-item-detail-pc.png`
10. `docs/ui/redesigns/option-b-sheet-mobile.png`

HTML sources: `docs/ui/redesigns/html/`
