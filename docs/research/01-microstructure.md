# Lane 1: General market microstructure

*(Agent synopsis — OSRS Flip Lab Phase 0A)*

## 1. What the factor is

**Market microstructure** is how trading rules, information, and frictions turn into prices, spreads, and fill outcomes—not “where the price should go,” but *how* two sides of a market meet. Core objects: **bid**, **ask**, **spread**, **depth**, **adverse selection**, **inventory risk**.

On the **Grand Exchange** there is no public order book. Players post buy/sell offers; matching when buy ≥ sell. High ≈ instant-buy print; low ≈ instant-sell print. Wiki data is *transaction-sampled*, not a full book. GE tax and buy limits are structural frictions.

## 2. Turnaround, margin, fill probability

- Wider high–low looks good; after tax many are unprofitable unless you sit *inside* extremes.
- **Taking** (insta) = fill speed, pays the spread. **Making** (sit) = harvests spread, slower fills, inventory risk.
- Depth is unobserved; volume + print freshness proxy it.
- Adverse selection: fills when market is about to move against you; destroys margin.
- Buy limit caps cycle velocity.

## 3. Observable / proxy

| Signal | Status |
|--------|--------|
| Last high/low + times | YES |
| 1h/5m avg prices & volumes | YES |
| Buy limit | YES |
| Bankroll | PARTIAL (user constraint) |
| Timeseries | YES |
| Full book / queue position | NO |

## 4. Recommendation: **KEEP**

Core engine of flipping. Condition margin on volume + freshness; score legs separately; never sort by raw high−low alone.

## 5. Underused angles

Stale high/low trap; volume asymmetry = leg risk; tax as floor; multi-slot correlation; 5m vs 1h disagreement; partial fills overstate edge.
