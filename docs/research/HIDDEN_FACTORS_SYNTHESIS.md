# Hidden factors synthesis (Phase 0B)

**Research design:** 10 dedicated lanes (waves of 2), covering markets, OSRS economy, behavior, and execution.  
**Date:** 2026-07-31  
**Purpose:** Constrain which intelligence metrics ship in the full-page item view.

## Decision matrix (priority for app)

| Factor | Turnaround | Edge | Observable? | Priority | Why |
|--------|------------|------|-------------|----------|-----|
| Two-sided liquidity / min(high,low) vol | High | High | YES | **P0** | Separates real flips from phantom margins |
| Print freshness (highTime/lowTime) | High | High | YES | **P0** | Stale prints = bait |
| Net spread after tax | Med | High | YES | **P0** | 2% tax / 5m cap kills thin edges |
| Volume imbalance (buy vs sell prints) | High | Med | YES | **P0** | Identifies weak leg / inventory risk |
| Fill realism score (composite) | High | High | PARTIAL | **P0** | User-facing decision number |
| 5m vs 1h volume pace | High | Med | YES | **P1** | Spike / dry-up |
| Mid trend over lookback | Med | High | YES | **P1** | Avoid mean-reversion into knives |
| Local volatility vs margin | Med | High | YES (history) | **P1** | Edge vs noise |
| Spike last vs 1h avg | Med | High | YES | **P1** | FOMO/dump prints |
| Buy-limit × capital bottleneck | High | Med | YES | **P0** | Already in flip model — surface clearly |
| Profit-per-limit framing | High | High | YES | **P1** | Underused vs raw margin |
| Alch floor distance | Low | Med | YES if highalch | **P2** | Soft floor; needs mapping field |
| Regime labels (thick/thin/spike) | High | High | YES | **P0** | UX chips |
| Info asymmetry / adverse selection | High | High | PARTIAL | **P1** | Proxies only, labeled as risk |
| Panic/FOMO narrative | Med | Med | PARTIAL | **P2** | Price path only; no news NLP v1 |
| Order book / queue position | High | High | **NO** | Graveyard | Cannot claim |
| Counterparty identity | High | High | **NO** | Graveyard | |
| Bot labels | Med | Med | **NO** | Graveyard | |
| Discord/streamer NLP | Med | High | PARTIAL | Later | Event calendar later |
| Multi-account limit abuse | — | — | — | **Out of scope** | Single-player fair app |

## Graveyard (interesting, not buildable with wiki alone)

- True order-book depth and queue rank  
- Exact time-to-fill for *your* offer  
- Who is on the other side of the trade  
- Live item-sink intensity  
- Coordinated merch clan signals  
- RMT gold rates as live feed  

## Canonical metrics for `itemInsights.ts` (implemented)

1. **Net spread** (after tax)  
2. **Fill score** 0–100 (regime + freshness + imbalance + spike + flip flags)  
3. **Liquidity regime** chip  
4. **Trend** (range/up/down from history mid)  
5. **Print freshness**  
6. **Volume imbalance**  
7. **Spike vs 1h avg**  
8. **Edge vs local vol**  
9. **5m pace**  
10. **Flip model** GP/h, qty, bottleneck (existing computeFlip)  
11. **What to check** bullets from playbook  

## Why this set

Research lanes 1–4 and 8 converge: **realized edge = post-tax spread × P(both legs fill) × capital velocity**, not raw high−low. Lanes 5–6 add risk labels (toxicity, FOMO) via proxies. Lanes 7–10 confirm tax, limits, and opportunity cost as first-class — already partly in the flip engine; the full-page must surface them densely without large empty cards.
