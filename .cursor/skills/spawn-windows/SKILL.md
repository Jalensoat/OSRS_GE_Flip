---
name: spawn-windows
description: Standing order for isolated subagent windows. Use whenever a Team Lead or Director splits research, implementation, or verification. Free reign to spawn — do not ask permission. Required before 3+ parallel windows or any multi-lead wave.
---

# Decoupled windows (standing order)

Each Team Lead **already has free reign** to open isolated (harnessed) subagent windows. You do **not** ask the stakeholder. Admin and distribution sit with **`/director-of-support`**; the human only talks to **`/deputy`**. You do **not** wait for a company Planner lead. Isolated windows exist so reasoning stays **decoupled** — a research dump must not pollute flip-math context, and a CSS pass must not rewrite `flip.ts`.

Read this skill. Follow it. Charter: `docs/TEAM_HARNESS.md`.

## You may do this without asking

1. **Ephemeral windows** — Task tool, `/create-subagent`, or `/name` of a project agent. Parallel launches in **one** parent message.
2. **Named bench** — UI already has `/ui-implementer` and `/ui-dual-platform`. Other leads spawn the specialists listed on their card.
3. **Promote a repeatable specialist** — if you will need the same window again, write `.cursor/agents/<kebab-name>.md` (frontmatter `name` + `description` only, plus the prompt). Stay inside your domain. Do not invent a new Team Lead or a second org chart.
4. **Resume** a window by agent id when the same isolated thread should continue.

## You must do this so the window is actually decoupled

Subagents start with a **clean context**. They cannot see the parent chat. If you spawn “fix the sheet” with no files, laws, or chosen option, you get coupled mush in a new tab.

**Before parallel writes**, have a contract (you write it, or invoke `/planner`):

```text
## Window contract
- Goal (GP lever: turnaround / fill / post-tax edge / or verify):
- Chosen option (from lead intake):
- Product laws that apply:
- Shared types / names (do not invent new ones):
- Windows (non-overlapping):
  | Window | Files they may write | Must return | Must not touch |
- Merge owner (the calling lead):
```

Rules:

- **Non-overlapping files.** Two windows must not both edit `flip.ts` or `GeApp.tsx`.
- **One domain per window.** Market does not restyle. UI does not change tax. Quant does not scrape blogs.
- **Parent merges.** Windows return facts; the lead integrates and stays accountable.
- **Nesting:** you (lead) and your direct windows may spawn children. A child of a child must **not** spawn further. Prefer a flat fan-out from the lead.
- **Tiny work stays in-process.** One-line fix, typo, single-file deploy — no window.

## When to call `/planner`

`/planner` is an **on-demand isolator**, not a Team Lead and not a gate.

| Situation | Action |
|-----------|--------|
| 1 window, obvious files | Spawn it yourself |
| 2 windows, you can name non-overlapping files | Spawn in parallel; skip planner |
| **3+ windows**, or two Team Leads in one wave | **`/planner` first** (or write the same contract yourself), then spawn |
| Whole-app “make it the best” | Deputy defines → DoS → `/planner` → leads; each lead fans out their own windows |

Planner is `readonly`. It returns the contract. It does not implement. You still own the spawn.

## Do not

- Ask “may I use a subagent?”
- Ask the stakeholder (that is Deputy’s job) or skip DoS to spawn leads from Deputy
- Open five windows that each invent their own schema
- Treat the unaccepted Plan-mode UI cloud chat as a window manager
- Add a tenth Team Lead named Planner
- Dump raw wiki HTML or Playwright DOM into the parent when a window can summarize
