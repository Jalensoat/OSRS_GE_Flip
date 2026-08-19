# Flip Lab MCP connections

Status of the stakeholder’s installed Cursor MCP servers for the Flip Lab team.
**Do not put API keys or tokens in this repo.** Authenticate through Cursor’s official Connect / OAuth UI only.

Cloud Agent runs **cannot** open the interactive login popup (`mcp_auth` returns: interactive auth is desktop-only). Finish Connect in Cursor desktop or at [cursor.com/agents](https://cursor.com/agents) (MCP dropdown), **one server at a time**, then send a follow-up so a lead can prove tools.

## Already working (do not re-auth)

| Server | Status | Probe | Tools seen |
|--------|--------|-------|------------|
| Tldraw | ready | `search` returned shape types | `search`, `exec`, `read_checkpoint`, `save_checkpoint`, `_get_canvas_state`, `_exec_callback` |
| GitHub | ready | `get_me` → `Jalensoat` | `get_me`, `list_*`, `search_*`, issue/PR tools |
| cursor-cloud | ready | `run-info` / `environment-info` / `get-events` | `run-info`, `environment-info`, `get-events`, `list-cloud-agents`, … |
| Sonatype-mcp | ready (tools listed) | live call asked for credentials; do not “fix” | `getComponentVersion`, `getLatestComponentVersion`, `getRecommendedComponentVersions` |

## Priority 1 — UI / deploy (need Connect)

These HTTP endpoints are **up**. Cursor marks them `needsAuth`. A cloud run cannot complete OAuth.

| Server | Status | Account to use | Endpoint |
|--------|--------|----------------|----------|
| Magic-patterns | still needsAuth | Magic Patterns (Google if that is how the account was created) | `https://mcp.magicpatterns.com/mcp` |
| Canva | still needsAuth | Canva (the Flip Lab asset account) | `https://mcp.canva.com/mcp` |
| Vercel | still needsAuth | Vercel account that owns **osrs-ge-flip.vercel.app**. Prove auth only — do not deploy from MCP. | `https://mcp.vercel.com` |

### UI Team Lead — example tools (after Connect)

From vendor docs (not live-discovered until OAuth completes):

**Magic-patterns**

- `create_design` — option-card / prototype generation
- `create_inspiration_document` — side-by-side Flip Lab option cards
- `get_design_status` — poll a design without writing

**Canva**

- `search-designs` — list existing asset boards (harmless read)
- `generate-design` — new board candidates
- `get-design` — read one design

Generated mocks are **not** the shipped PWA. Tldraw stays the live canvas.

## Priority 2 — installed, same treatment

All of these are reachable and return 401 without a user token. Same Connect flow. Do not invent keys.

| Server | Status | Account / note |
|--------|--------|----------------|
| Linear | still needsAuth | Linear workspace for Flip Lab issues |
| Supabase | still needsAuth | Supabase (OAuth). Flip Lab preview DB is PGLite unless `DATABASE_URL` is set — do not assume a hosted project exists. |
| Webflow | still needsAuth | Webflow (only if the team actually has a site) |
| Wix-mcp | still needsAuth | Wix (only if the team actually has a site) |
| Sanity | still needsAuth | Sanity (only if a studio exists) |
| Aleph | still needsAuth | Aleph |
| Google-calendar | still needsAuth | Google account. Unauthenticated `tools/list` exists; Cursor still requires Connect before leads can call it. |
| Harness | still needsAuth | Harness. Plugin uses static OAuth client `mcp-client` — still needs a human Connect. |
| Profound | still needsAuth | Profound |
| Subtext | still needsAuth | **Use this region (NA):** `https://api.fullstory.com/mcp/subtext`. FullStory / Subtext (Google signup is fine). |
| Subtext-eu1 | skipped | Same product, EU1 (`https://api.eu1.fullstory.com/mcp/subtext`). Get **Subtext** working; skip EU unless data lives there. |
| GitLab | still needsAuth | GitLab.com (Premium/Ultimate + Duo). Repo of record is GitHub (`Jalensoat/OSRS_GE_Flip`) — optional. |

## Priority 3 — discovery failed (not just login)

| Server | Status | Why it cannot work from here |
|--------|--------|------------------------------|
| Paper | still error | Plugin points at `http://127.0.0.1:29979/mcp` (Paper Desktop). Nothing listens on that port in a Cloud Agent VM. Works only on a machine with Paper Desktop running. |
| Tierzero | still error | `https://api.tierzero.ai/mcp/` is up but initialize returns 401 (`Bearer` / PAT). OAuth resource metadata exists (`https://api.tierzero.ai/.well-known/oauth-protected-resource` → `https://auth.tierzero.ai/oauth/2.1`). Cursor classified this as discovery **error**, not `needsAuth`. Do not paste a PAT into the repo. Connect/authorize Tierzero in Cursor (or add a header only in the Cursor MCP UI). |

## How to finish Priority 1

1. Open [cursor.com/agents](https://cursor.com/agents) → MCP, **or** Cursor desktop → Settings → Tools & MCP.
2. Click **Connect** on **Magic-patterns**. Sign in with the Magic Patterns account.
3. When that finishes, Connect **Canva**, then **Vercel** (the osrs-ge-flip owner). One at a time.
4. Reply in the Flip Lab chat that Connect completed. A lead will rediscover tools and run one read-only probe (no deploy, no issues).

## Laws

- No `.env`, no secrets in git, no invented tokens.
- No production deploy / issue create from an MCP “prove it” probe.
- Dual-platform Flip Lab UI is unchanged by this doc.
