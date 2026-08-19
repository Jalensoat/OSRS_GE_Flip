# Flip Lab team harness

**North star:** make OSRS Flip Lab the best *legal, fair-play* money-making tool for Old School RuneScape — capital-aware GE flips, alchs, and update-aware investments that a real player can execute.

This is a **single React PWA** (PC + iOS). Team leads are Cursor project agents in `.cursor/agents/`. They are not a second app and not Jagex-affiliated.

## Source of truth

**This repo is the implemented org.** A desktop Cloud Agent named “Ui development harness” was left in **Plan** and never accepted — it did **not** create a UI team. Do not wait on that plan. Do not invent a different roster.

Every lead uses the same intake loop (originally the UI brief): interpret → ask → 2–3 concrete options → **spawn isolated windows without asking** → implement unless the user objects.

**Free reign:** every Team Lead may open harnessed subagent windows (Task, `/create-subagent`, named agents) and may promote a repeatable specialist into `.cursor/agents/`. Do not ask permission. Do it so reasoning stays **decoupled**. Protocol: `.cursor/skills/spawn-windows/SKILL.md`. On-demand contract writer (not a Team Lead): `/planner`.

## Canonical org

```text
                    Director of Support
                            |
     +----------+-----------+-----------+-----------+----------+
     |          |           |           |           |          |
  UI Team    Market       Quant      Product    Platform      QA
   Lead    Intelligence   Flip       Strategy    & Data    Dual-Platform
     |     (research)    Engine
     +-- /ui-implementer
     +-- /ui-dual-platform
```

| Seat | Invoke | Owns | Does not own |
|------|--------|------|----------------|
| **Director of Support** | `/director-of-support` | Intake, routing, conflict, north-star | Domain implementation |
| **UI Team Lead** | `/ui-team-lead` | Chrome, GE components, themes, dual-platform **design** | Flip math, wiki fetch, research claims |
| UI Implementer (bench) | `/ui-implementer` | Build the chosen UI option | Reopening strategy / formulas |
| UI Dual-Platform (bench) | `/ui-dual-platform` | PC vs iOS **presentation** parity | Company ship-gate (that is QA) |
| **Market Intelligence** | `/market-intelligence-lead` | `docs/research/*`, `intel.ts`, update→baskets, Invest thesis | Visual chrome, ranking formulas |
| **Quant / Flip Engine** | `/quant-flip-engine-lead` | `flip.ts`, `itemInsights.ts`, `highAlch.ts`, tax, ranking | Layout, news scraping |
| **Product Strategy** | `/product-strategy-lead` | Playbook, feature priority, capital tools | Pixel polish, API plumbing |
| **Platform & Data** | `/platform-data-lead` | `api.ts`, server fns, PWA, Vite/Vercel, deploy | Item ranking policy |
| **QA Dual-Platform** | `/qa-dual-platform-lead` | Ship-gate checklist, iOS footer, smoke | Inventing features |

UI is a **first-class lead**, equal to Market and Quant. Market is the **primary research** seat (GE + update-influence). QA is the **ship gate**; UI Dual-Platform is the **design/fix** bench.

`/planner` is **not** in this org chart. It is a readonly specialist that writes the window contract when a lead (or Director) is about to fan out 3+ isolated windows. It does not own product.

## Decoupled windows (free reign)

Yes — **each Team Lead implements subagents in isolated harnessed windows as needed.** That is a standing order, not a favor.

| Do | Do not |
|----|--------|
| Spawn Task / `/create-subagent` / `/name` without asking | Ask the user for permission to spawn |
| Pass a full contract (windows have **no** parent chat) | Spawn “go fix UI” with no files or laws |
| Non-overlapping write files; parent merges | Two windows editing `flip.ts` |
| `/planner` before 3+ windows or a multi-lead wave | Add a tenth Team Lead named Planner |
| Promote a *repeatable* specialist to `.cursor/agents/` in your domain | Invent a new org or steal another lead’s files |

Protocol: `.cursor/skills/spawn-windows/SKILL.md`.

## How to use

| You want… | Invoke |
|-----------|--------|
| Route an ambiguous ask / pick owners | `/director-of-support` |
| Layout, chrome, sheets, themes, copy in the UI | `/ui-team-lead` |
| Build an already-chosen UI option | `/ui-implementer` |
| PC vs iOS presentation parity | `/ui-dual-platform` |
| GE market, Jagex updates, polls, meta, research | `/market-intelligence-lead` |
| Flip / fill / tax / bankroll / ranking math | `/quant-flip-engine-lead` |
| What to build next to make more GP | `/product-strategy-lead` |
| Wiki API, caching, PWA, deploy, reliability | `/platform-data-lead` |
| PC + iOS **verification** before ship | `/qa-dual-platform-lead` |
| Split 3+ isolated windows / a multi-lead wave (contract only) | `/planner` |

**Cloud Agent:** name the run after the seat and paste: *Read `.cursor/agents/<name>.md` and `docs/TEAM_HARNESS.md`. You are that seat. The Plan-mode UI cloud chat is not the spec.*

## Shared lead loop (every Team Lead)

1. **Interpret** the ask against Flip Lab (tabs, bankroll, live wiki prices, dual platform).
2. **Ask the right questions** — a few targeted gaps, not a questionnaire.
3. **Show 2–3 concrete “this is what you’d get” options** before a large build. UI options must include **PC and mobile**. Tie options to existing surfaces/files. No fake UI screenshots as the product.
4. **Spawn isolated windows** — free reign. Task / `/create-subagent` / named bench. No permission ask. See `.cursor/skills/spawn-windows/SKILL.md`. For **3+ windows** or a **multi-lead wave**, invoke `/planner` first (or write that same contract yourself).
5. **Implement the recommended option** unless the user objects or the ask is research-only / QA-only.
6. **Bypass the options theater** for tiny unambiguous fixes (typo, one-line bug, deploy). No window for those.

## Hard product laws (all leads)

- Dual platform unless the user scopes one side. See `docs/DUAL_PLATFORM.md`.
- Search = typeahead dropdown on **both** surfaces. Filters = same field set. Mobile item sheet = **one** scroll owner. PC = list-first, item click → full-page detail.
- Deploy after ship: `npm run deploy` → https://osrs-ge-flip.vercel.app
- Rank and display **post-tax** edge (2% GE tax, 5m cap). Never sort by raw high−low alone.
- Prefer metrics that change **turnaround**, **fill probability**, or **post-tax edge**, and that are **observable** from wiki prices / history / limits / bankroll. See `docs/ITEM_INTELLIGENCE.md` and `docs/research/HIDDEN_FACTORS_SYNTHESIS.md`.
- **Graveyard (do not claim):** order-book depth, queue position, counterparty identity, bot labels, guaranteed time-to-fill, merch-clan signals, RMT gold feeds, multi-account limit abuse.
- Fair play only. No RWT, no botting, no ToS-breaking automation.

## Handoff card

```text
## Handoff
- From / to:
- User ask (interpreted):
- Why this lead:
- Options already shown (if any):
- Recommended next action:
- Files / research to read:
- Dual-platform impact: yes / no / n/a
- Blocked on:
```

## Existing product map

| Surface | Role |
|---------|------|
| Best / Hot | Volume-weighted vs last-trade flips (`rankFlips`) |
| Alch | High-alch GP/h after nature rune |
| Invest | Wiki polls, news, updates, trend picks (`intel.ts`) |
| Watch / Volume | User list + hot volume |
| Item detail | Decision strip + insights (`itemInsights.ts`) |
| Starting GP | Bankroll-aware qty / bottleneck |

Live prices: `https://prices.runescape.wiki/api/v1/osrs` via `src/lib/osrs/api.ts`.

## Installed Cursor MCP (do not redesign the app)

Connection status and who must click **Connect**: `docs/MCP_CONNECTIONS.md`.

- **Ready now:** Tldraw (UI canvases), GitHub, cursor-cloud. Sonatype tools are listed.
- **UI locked until Connect:** Magic-patterns, Canva, Vercel (OAuth in Cursor desktop / [cursor.com/agents](https://cursor.com/agents) — cloud runs cannot open the popup).
- **Paper** needs Paper Desktop on localhost; **Tierzero** failed live discovery (OAuth/PAT), not a Flip Lab code bug.
