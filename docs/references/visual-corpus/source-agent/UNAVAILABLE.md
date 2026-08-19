# Other-agent originals not mounted on this VM

PR #1 (Cursor Cloud setup) documented these artifacts. They are **not** in this workspace (that agent’s store is not mounted; fetch returns not-found / 403).

| Title | Expected file | Agent |
|-------|----------------|-------|
| End-to-end demo | `osrs_flip_lab_end_to_end_demo.mp4` | [setup-dev-environment](https://cursor.com/agents/bc-86447751-9ac9-4065-a478-1f1022d21ebb) |
| Flip list with live data | `flip_list_live_data.webp` | same |
| Item detail — Dragon 2h sword | `item_detail_dragon_2h_sword.webp` | same |
| Watchlist with added item | `watchlist_with_added_item.webp` | same |

Until those files are copied here, the team uses `current-app/` + `walkthrough/` (production ingest). Do not pretend the PR #1 binaries are in git.
