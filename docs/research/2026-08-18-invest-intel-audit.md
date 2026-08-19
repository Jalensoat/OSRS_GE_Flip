# Invest intel audit — 18 August 2026

Market Intelligence content pass. Fetch helpers were not touched.

## Live sources (pulled this audit)

| Title | Date | URL | Class / phase |
| --- | --- | --- | --- |
| Upcoming updates (wiki) | page as of audit | https://oldschool.runescape.wiki/w/Upcoming_updates | calendar |
| Category:Game updates (API) | live list | https://oldschool.runescape.wiki/w/Game_updates | release feed |
| Category:Polls (API) | live list | wiki `Category:Polls` | poll feed |
| Summer Sweep Up - Agility & Chambers of Xeric Changes | 12 Aug 2026 | https://oldschool.runescape.wiki/w/Update:Summer_Sweep_Up_-_Agility_%26_Chambers_of_Xeric_Changes | balance / release / settle |
| Summer Sweep-Up Gear & PvM Changes | wiki 2026 (prior batch) | https://oldschool.runescape.wiki/w/Update:Summer_Sweep-Up_Gear_%26_PvM_Changes | balance / settle |
| Bronzeman Mode & A Ruff Situation | 11 Aug 2026 (blog rev 12 Aug) | https://oldschool.runescape.wiki/w/Update:Bronzeman_Mode_%26_A_Ruff_Situation | poll / newspost |
| Poll: A Ruff Situation, Crab Quest & Bronzeman Mode | opened 14 Aug 2026, closes 21 Aug 2026 | https://oldschool.runescape.wiki/w/Poll:A_Ruff_Situation,_Crab_Quest_%26_Bronzeman_Mode | poll (not locked this audit) |
| Poll: The Fractured Archive - Rewards Lock-in Poll | 3–10 Aug 2026 | https://oldschool.runescape.wiki/w/Poll:The_Fractured_Archive_-_Rewards_Lock-in_Poll | lock-in; raid **not released** |
| Poll: Wyrmscraig Unique Rewards | 8–15 Jul 2026 | https://oldschool.runescape.wiki/w/Poll:Wyrmscraig_Unique_Rewards | passed; content live |
| Wyrmscraig & Sailing Changes | 5 Aug 2026 | https://oldschool.runescape.wiki/w/Update:Wyrmscraig_%26_Sailing_Changes | release / hotfix |
| Wyrmscraig Is Out Today! | 29 Jul 2026 | wiki game-updates list | release |
| Blood Moon Rises Rewards (official) | 17 Feb 2026 blog; content 30 Jun 2026 | https://secure.runescape.com/m=news/blood-moon-rises-rewards?oldschool=1 | settle |
| Leagues VI: Demonic Pacts - Launches Today! | 15 Apr 2026 | wiki game-updates list | league-week → settle |

Jagex news archive HTML on this pull still showed **July 2026** as the visible month. Wiki `Category:Game_updates` was the fresher official-copy feed.

## What was wrong

1. **Missing current baskets** — Fractured Archive (fourth raid, lock-in closed), live Wyrmscraig (Hallowfell / Jeweller's Chisel), Blood Moon / Maggot King, Agility Sweep-Up, Inquisitor buff, Bronzeman/quest poll. Players would see generic PvM/Bossing copy on those titles.
2. **False tags** — bare `wyrm` tagged Wyrmscraig and Colossal Wyrm Agility as boss uniques (scythe/shadow/torva). Bare `ge` tagged any title containing “ge” (change, challenge, agility) as a GE-rules event. Bare `port` tagged portal/report as Sailing. Bare `boss` accumulated raid uniques onto every “boss” title.
3. **Stale CoX thesis** — hinted as pre-blog/patch front-run after **12 Aug 2026 unique-weighting already shipped** (ancestral weighting up; arcane/dex scrolls down).
4. **Trend theses** sold “momentum” / “dip-buy if fundamentals hold.” Wiki 1h vs mid is a print sample, not a fundamental.

## What we will not claim

- Fractured Archive reward names as live GE (Elemental Fragments / Zeal untradeable; others not printing until release).
- Bronzeman / Ruff / Crab Quest **passed** — wiki vote table was still a placeholder this audit; poll window 14–21 Aug 2026.
- Bot, book, queue, RMT, or an “update score” Best-list key.
- Invented patch notes beyond the cited official/wiki text.

## Product response (shipped B)

- **A** — Invest thesis only: done via factor/hint/trend strings.
- **B** — Baskets + match terms: **implemented** in `src/lib/osrs/intel.ts`.
- **C** — Quant proxy: handoff only (below). Not a sort key.

## Specs (do not implement here)

**Platform HTTP**

- Wiki `Category:Game_updates` currently interleaves `Update:RS2 Launched!` in the latest-timestamp list. Filter non-OSRS / ancient titles or use a better source. Do not change fetch in this pass.
- Jagex archive HTML lagged the wiki official-copy list this audit.

**Quant**

- CoX ancestral + prayer-scroll 5m/1h disagreement after 12 Aug weighting is a **spike / freshness / imbalance** case, not an update-hype rank.
- Do not sort Best by Fractured Archive lock-in.

## Player action

- CoX uniques: **watch settle**, do not treat as a fresh rumor pump.
- Wyrmscraig Hallowfell: **watch dumps** as volume ramps.
- Fractured Archive: **watch competing weapons / supplies only**; exit if you were only holding a name that is not on the GE.
- Bronzeman poll: **do not front-run**.
