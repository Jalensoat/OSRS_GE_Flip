---
name: osrs-update-influence
description: How to research OSRS game updates and map them to Grand Exchange impact. Use whenever the Market Intelligence lead (or any agent) handles Jagex news, poll blogs, patch notes, new bosses/raids/skills, nerfs/buffs, leagues, DMM, bonds, or “why did this item move.”
---

# OSRS update → GE influence

Do not invent patch notes. Fetch live sources, classify the event, map baskets, then choose a product response.

## 1. Pull sources (in this order)

1. Official OSRS news archive: `https://secure.runescape.com/m=news/archive?oldschool=1`
2. OSRS Wiki “Latest updates” / the specific update page / Upcoming updates
3. Poll blog / lock-in blog if the ask is pre-release
4. In-repo: `src/lib/osrs/intel.ts` (`MARKET_FACTORS`, `KEYWORD_HINTS`, `POLL_BASKETS`)
5. Wiki prices for the basket: existing `fetchCatalog` / item history — not vibes
6. Community (Reddit, etc.) only as **unofficial**, after official text

Record **title, date, URL** for every claim.

## 2. Classify

Set all of:

- **Class:** new content | balance | skilling | PvP | GE rules | bonds/macro | QoL | temp mode | other
- **Phase:** rumor | poll | newspost | release | hotfix | settle | league-week
- **Direction:** dump (new supply) | spike (new demand) | two-way | unclear
- **Horizon:** hours | 48h | 1–2 weeks | structural
- **Confidence:** high (official + live prints) | medium | low

## 3. Map baskets

For each class, list **buy-side** (prep, supplies, required gear) and **sell-side** (new loot, nerfed gear, rumor pumps).

Check `POLL_BASKETS` / `KEYWORD_HINTS`. If the current raid, skill, or boss is missing, add terms. Prefer names that match wiki mapping (`item.name`).

Examples (not exhaustive):

- New raid: uniques dump over days; brews, restores, food, specialty weapons spike on release
- Weapon nerf: that weapon + its swap gear grind down; replacements bid up
- Herblore/farming method: herbs, secondaries, composts
- League: staples and teleports up, then dump at close
- Buy-limit or tax change: **Quant must** recalculate; this is not Invest-only

## 4. Product response

Pick one (see Market Intelligence option cards):

| Finding | Ship |
|---------|------|
| Dated official text + item names | Invest thesis + related prices |
| Recurring pattern (CoX, ToB, ToA, …) | Basket in `intel.ts` |
| Observable in 5m/1h prints only | Handoff to Quant (spike, freshness, imbalance, pace) |
| Unconfirmed rumor | Do not rank. Optional “unconfirmed” note |
| Graveyard (bots, book, RMT) | Refuse |

## 5. Write it down

- Chat is not the archive. Add a short note under `docs/research/` (dated) or extend a lane.
- Include: sources, class, phase, baskets, what we will **not** claim, suggested owner (Invest / Quant / Product).

## 6. Dual platform

Invest and any new calendar UI must work on mobile tabs and PC. You specify content; UI owns chrome.
