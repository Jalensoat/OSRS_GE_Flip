# Lane 2: Liquidity regimes

*(Agent synopsis — OSRS Flip Lab Phase 0A)*

## 1. What the factor is

Liquidity regimes = depth, two-sidedness, and stability of trade flow—not a single volume number. Regimes: **thick**, **thin**, **spike**, **dry-up**. HighPriceVolume vs lowPriceVolume is the public two-sided split.

## 2. Turnaround, margin, fill probability

- Thick two-sided: fast fills, compressed but realizable margins.
- Thin: paper spreads lie; stuck capital.
- Spike: temporary fill window; margin compression risk.
- Dry-up mid-hold: forced reprice, queue reset.
- min(highVol, lowVol) is true flip capacity bottleneck.

## 3. Observable / proxy

| Signal | Status |
|--------|--------|
| 5m/1h/24h volume | YES |
| High vs low volume split | YES |
| Thin vs thick thresholds | YES |
| Spike vs baseline | YES |
| Dry-up after entry | PARTIAL (needs polling) |
| Book depth / queue | NO |
| Exact TTF for your offer | NO |

## 4. Recommendation: **KEEP**

Primary filter separating realizable edges from traps. Ship hard gates + soft regime class + mid-hold re-score.

## 5. Underused angles

min(side) capacity; imbalance as leg advice; 5m/1h coherence on spread; buy-limit-normalized volume; tax × thinness EV: P(both legs) × post-tax edge.
