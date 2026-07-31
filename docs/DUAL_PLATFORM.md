# Dual platform rules (PC + iOS / mobile)

**Any agent working on this app must update both desktop and mobile experiences unless the user explicitly scopes a change to one surface.**

## Deploy (required every time)

After any code change that should reach the user:

1. `git push origin main`
2. **Deploy production** (do not skip):

```bash
npm run deploy
# or: npx vercel --prod --yes
```

- **Production URL:** https://osrs-ge-flip.vercel.app  
- **Vercel project:** `house-hold1390/osrs-ge-flip`  
- GitHub is linked; still run `npm run deploy` after push if the live site is stale, or confirm the Vercel deployment for that commit succeeded.  
- Push alone is **not** enough if the user still sees old UI (PWA/cache) — deploy + hard refresh / re-add Home Screen icon.

This app is a single React codebase with responsive + PWA behavior. There is no separate iOS native project — “iOS” means phone Safari / Home Screen web app (`lg:` breakpoint and below, bottom tabs, sheets).

---

## Surfaces

| Surface | Detection | Primary chrome |
|--------|-----------|----------------|
| **PC / desktop** | `min-width: 1024px` (`lg:`) | Top tabs, **full-width list**, full-page item on click (no always-on aside) |
| **Mobile / iOS** | `< 1024px` + bottom `.bottom-nav` | Bottom tabs, bottom sheets, safe-area padding |

Item intelligence metrics: `docs/ITEM_INTELLIGENCE.md` + `src/lib/osrs/itemInsights.ts`.

Helpers: `useDisplayMode()`, `isPhoneLayout()` in `src/hooks/useDisplayMode.ts`.

---

## Shared features (must stay in sync)

When you change any of these, verify **both** PC and mobile (or document why one is intentionally different):

1. **Search typeahead**
   - Both platforms: dropdown under search (`SearchDropdown` portaled/fixed).
   - Selecting an item: desktop → full-page detail (`fullPage`); mobile → bottom sheet (`sheet`).
   - Do **not** replace the main list with live search results on either platform while typing.

2. **List filters**
   - Same fields on both: F2P only, buy limit, buy price, sell price, margin, daily volume (1h×24 est.), potential profit, margin × volume.
   - Component: `ListFilters` + `src/lib/osrs/listFilters.ts`.
   - PC: filters panel **default open** so all fields are visible.
   - Mobile: collapsible is OK, but fields must match PC.

3. **Numeric column sort**
   - Asc/desc on numeric columns for item tables and flip boards (PC headers + mobile sort chips).

4. **Item detail**
   - Stats, chart, flip model, watchlist — same data.
   - Layout may differ (aside / full page / sheet) but content parity.

5. **iOS PWA chrome**
   - Tab bar safe-area, `theme-color` = surface, no dual-height `--app-height` lock. See `IOS_FOOTER_BUG.md`.

---

## Layout traps (do not reintroduce)

| Trap | Effect | Fix |
|------|--------|-----|
| Nested `overflow-y-auto` + `h-full` inside mobile sheet | iOS cannot scroll to content below fold (e.g. graph) | Sheet: **one** scroll owner; `ItemDetail` with `sheet` prop (no inner scroll) |
| Search dropdown `position:absolute` inside header only | Clipped / covered on PC | Portaled **fixed** panel via `SearchDropdown` + `anchorRef` |
| JS `--app-height` vs `position:fixed` tab bar | Black gap under tabs on Home Screen | `inset:0` + min-height only; surface chrome |
| PC-only or mobile-only filters | User sees incomplete tools on one side | Shared `ListFilterState` + same field set |

---

## Checklist before finishing a UI change

- [ ] Behavior works at **&lt; 1024px** and **≥ 1024px**
- [ ] Search dropdown appears and selects on **both**
- [ ] Filters expose the **full field set** on PC (open by default)
- [ ] Mobile item sheet **scrolls** through chart and actions
- [ ] Bottom nav / safe-area still correct on standalone iOS
- [ ] Desktop top tabs and bottom nav hide/show still correct

---

## Key files

| Area | Path |
|------|------|
| Shell / search / sheets | `src/components/ge/GeApp.tsx` |
| Search dropdown | `src/components/ge/SearchDropdown.tsx` |
| Filters UI | `src/components/ge/ListFilters.tsx` |
| Filter/sort logic | `src/lib/osrs/listFilters.ts` |
| Item detail layouts | `src/components/ge/ItemDetail.tsx` |
| Flip table + sort | `src/components/ge/FlipBoard.tsx` |
| Global layout CSS | `src/styles.css` |
| iOS footer notes | `IOS_FOOTER_BUG.md` |
