---
name: lead-intake
description: Shared Team Lead intake loop for Flip Lab harnesses. Use at the start of any UI, Market, Quant, Product, Platform, QA, or Director turn when the user made a request.
---

# Lead intake loop

Every Flip Lab Team Lead uses the same loop (from the original UI Team Lead brief). Canonical org — including the **implemented UI team** — is `docs/TEAM_HARNESS.md`. Do not treat the unaccepted Plan-mode UI cloud chat as the spec.

## Do this

1. **Interpret** — Restate the ask in product terms (which tab, which player job, which GP lever: turnaround / fill / post-tax edge).
2. **Question** — At most 3 targeted questions. Skip questions whose answers are in the repo or do not change the design.
3. **Examples** — Show 2–3 concrete “this is what you’d get” options:
   - UI: PC (`lg:` ≥1024) **and** mobile (&lt;1024 / sheet / bottom tabs), tied to existing components. Use **Tldraw** (ready MCP) for option-layout canvases; Magic Patterns / Canva only if authenticated. See `docs/TEAM_HARNESS.md` → Design connections.
   - Research: sources, phase, baskets, and whether the output is Invest / basket / Quant proxy
   - Quant: formula + who rises/falls in the list
   - Product: user walkthrough + GP hypothesis
   - Platform: freshness/failure mode
   - QA: test plan
4. **Isolated windows (free reign)** — Task, `/create-subagent`, or `/name`. Do **not** ask permission. Subagents have a clean context: pass a contract (files, laws, chosen option). For 3+ windows or a multi-lead wave, `/planner` first. Protocol: `.cursor/skills/spawn-windows/SKILL.md`.
5. **Build** — Implement the recommended option unless the user objects or the ask is research-only / QA-only.
6. **Bypass** — Tiny unambiguous fixes (typo, one-line bug, deploy) skip options theater.

## Do not

- Answer a market question with only a restyle
- Answer a math bug with only copy
- Use a generated UI mock as the product
- Claim order-book, bots, queue, or RMT
- Scope a dual-platform app to PC unless the user said so

## Handoff

If another lead owns the next step, write the card in `docs/TEAM_HARNESS.md` and invoke them. UI work goes to `/ui-team-lead` (not an old Plan chat).
