import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Star,
  Flame,
  X,
  Coins,
  LineChart,
  Zap,
  Sparkles,
} from "lucide-react";
import { fetchCatalog, type CatalogItem } from "@/lib/osrs/api";
import { useWatchlist } from "@/lib/osrs/watchlist";
import { useBankroll } from "@/lib/osrs/bankroll";
import { parseGpInput, rankFlips, type FlipMode } from "@/lib/osrs/flip";
import {
  EMPTY_FILTERS,
  filterCatalogItems,
  filterFlips,
  nextSortState,
  sortCatalogItems,
  type ItemSortKey,
  type ListFilterState,
  type SortDir,
} from "@/lib/osrs/listFilters";
import { BRAND } from "@/lib/branding";
import { useDisplayMode, isPhoneLayout } from "@/hooks/useDisplayMode";
import { useIosKeyboardReset } from "@/hooks/useVisualViewport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemRow, ITEM_GRID } from "./ItemRow";
import { ItemDetail } from "./ItemDetail";
import { CapitalBar } from "./CapitalBar";
import { FlipBoard } from "./FlipBoard";
import { InvestBoard } from "./InvestBoard";
import { HighAlchBoard } from "./HighAlchBoard";
import { AppLogo } from "./AppLogo";
import { ThemeButton, ThemePicker } from "./ThemePicker";
import { ListFilters } from "./ListFilters";
import { SearchDropdown } from "./SearchDropdown";
import { SortableTh } from "./SortableTh";
import { FlipGuideButton } from "./FlipGuide";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/osrs/format";

type Tab = "flips" | "hot" | "invest" | "alch" | "watch" | "volume" | "search";

const NAV: {
  id: Exclude<Tab, "search">;
  label: string;
  desktopLabel: string;
  icon: typeof Coins;
}[] = [
  { id: "flips", label: "Best", desktopLabel: "Best flips", icon: Coins },
  { id: "hot", label: "Hot", desktopLabel: "Hot flips", icon: Zap },
  { id: "alch", label: "Alch", desktopLabel: "High alch", icon: Sparkles },
  { id: "invest", label: "Invest", desktopLabel: "Investments", icon: LineChart },
  { id: "watch", label: "Watch", desktopLabel: "Watchlist", icon: Star },
  { id: "volume", label: "Volume", desktopLabel: "Hot volume", icon: Flame },
];

export function GeApp() {
  useIosKeyboardReset();
  const display = useDisplayMode();

  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 45_000,
    refetchInterval: 60_000,
  });

  const watchlist = useWatchlist();
  const { input: bankrollInput } = useBankroll();
  const bankroll = parseGpInput(bankrollInput);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("flips");
  const [itemSortKey, setItemSortKey] = useState<ItemSortKey | null>("volume");
  const [itemSortDir, setItemSortDir] = useState<SortDir>("desc");
  const [filters, setFilters] = useState<ListFilterState>({ ...EMPTY_FILTERS });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [fullPageOpen, setFullPageOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);

  const items = catalog.data?.items ?? [];
  const byId = useMemo(() => {
    const m = new Map<number, CatalogItem>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const safeFlips = useMemo(
    () => filterFlips(rankFlips(items, bankroll, 40, "safe"), filters),
    [items, bankroll, filters],
  );
  const hotFlips = useMemo(
    () => filterFlips(rankFlips(items, bankroll, 40, "hot"), filters),
    [items, bankroll, filters],
  );

  const flipMode: FlipMode = tab === "hot" ? "hot" : "safe";
  const activeFlips = tab === "hot" ? hotFlips : safeFlips;

  /** Typeahead matches for the search dropdown (desktop + mobile). */
  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored: { item: CatalogItem; score: number }[] = [];
    for (const it of items) {
      const name = it.name.toLowerCase();
      if (!name.includes(q)) continue;
      let score = 0;
      if (name === q) score = 1000;
      else if (name.startsWith(q)) score = 500;
      else score = 100;
      score += Math.min(it.volume1h, 50);
      scored.push({ item: it, score });
    }
    scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    return scored.slice(0, 24).map((s) => s.item);
  }, [items, query]);

  /** Mobile-only search tab list (more results, still filterable/sortable). */
  const searchListItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored: CatalogItem[] = [];
    for (const it of items) {
      if (it.name.toLowerCase().includes(q)) scored.push(it);
    }
    return scored.slice(0, 80);
  }, [items, query]);

  const listItems = useMemo(() => {
    let list: CatalogItem[] = [];
    if (tab === "search") {
      list = searchListItems;
    } else if (tab === "watch") {
      list = watchlist.ids
        .map((id) => byId.get(id))
        .filter((x): x is CatalogItem => Boolean(x));
    } else if (tab === "volume") {
      list = items.filter((i) => i.volume1h > 0 && i.high != null).slice(0, 120);
    } else {
      return [];
    }

    list = filterCatalogItems(list, filters);
    const key = itemSortKey ?? (tab === "volume" ? "volume" : "name");
    const dir = itemSortKey ? itemSortDir : tab === "volume" ? "desc" : "asc";
    return sortCatalogItems(list, key, dir);
  }, [tab, searchListItems, watchlist.ids, byId, items, filters, itemSortKey, itemSortDir]);

  const selected = useMemo(() => {
    if (selectedId != null) {
      const hit = byId.get(selectedId);
      if (hit) return hit;
    }
    if ((tab === "flips" || tab === "hot") && activeFlips[0]) return activeFlips[0].item;
    return listItems[0] ?? null;
  }, [selectedId, byId, listItems, tab, activeFlips]);

  const activeId = selected?.id ?? null;

  /** Open item: mobile sheet; desktop full-page (no permanent right drawer). */
  const openItem = useCallback((id: number) => {
    setSelectedId(id);
    if (isPhoneLayout()) {
      setMobileDetailOpen(true);
      setFullPageOpen(false);
    } else {
      setFullPageOpen(true);
      setMobileDetailOpen(false);
    }
  }, []);

  const onSelect = useCallback((item: CatalogItem) => {
    openItem(item.id);
  }, [openItem]);

  const onSelectId = useCallback((id: number) => {
    openItem(id);
  }, [openItem]);

  /** Search dropdown selection — both platforms (PC full page, mobile sheet). */
  const onSelectFromSearch = useCallback((item: CatalogItem) => {
    setQuery("");
    setSearchOpen(false);
    openItem(item.id);
  }, [openItem]);

  const goTab = useCallback((id: Exclude<Tab, "search">) => {
    setTab(id);
    setQuery("");
    setSearchOpen(false);
    setFullPageOpen(false);
  }, []);

  const onItemSort = useCallback((key: ItemSortKey) => {
    setItemSortKey((prev) => {
      const next = nextSortState(prev, itemSortDir, key);
      setItemSortDir(next.dir);
      return next.key;
    });
  }, [itemSortDir]);

  useEffect(() => {
    if (!fullPageOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullPageOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullPageOpen]);

  const lastTradeAge =
    catalog.data?.priceTimestamp != null
      ? formatRelativeTime(catalog.data.priceTimestamp)
      : null;

  const showItemList = tab === "watch" || tab === "volume";
  const showFlipBoard = tab === "flips" || tab === "hot";
  const showAlchBoard = tab === "alch";
  const activeNav = tab === "search" ? null : tab;
  // List-first: keep filters collapsed by default so the table gets the page
  const filtersDefaultOpen = false;

  return (
    <div
      className="app"
      data-layout={display.isDesktop ? "desktop" : "mobile"}
      data-standalone={display.isStandalone ? "true" : "false"}
    >
      <header className="relative z-40 w-full min-w-0 shrink-0 overflow-visible border-b border-border bg-surface pad-top-safe">
        <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-2 px-4 pb-2.5 pt-2 sm:gap-3 sm:px-6 sm:pb-3 sm:pt-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <AppLogo size="md" className="shrink-0" />
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-fg sm:text-lg">
                  {BRAND.name}
                </h1>
                <p className="truncate text-xs text-muted">
                  <span className="lg:hidden">Live GE flips</span>
                  <span className="hidden lg:inline">{BRAND.tagline}</span>
                  {lastTradeAge ? ` · ${lastTradeAge}` : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <FlipGuideButton />
              <ThemeButton onClick={() => setThemeOpen(true)} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => catalog.refetch()}
                disabled={catalog.isFetching}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", catalog.isFetching && "animate-spin")}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          <CapitalBar className="min-w-0 w-full" />

          {/*
            Search typeahead: same dropdown on PC + mobile (portaled fixed panel).
            Do not replace the main list while typing on either platform.
          */}
          <div ref={searchAnchorRef} className="relative z-30 min-w-0 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setSearchOpen(Boolean(v.trim()));
              }}
              onFocus={() => {
                if (query.trim()) setSearchOpen(true);
              }}
              placeholder="Search any item…"
              className="w-full min-w-0 pl-10 pr-10"
              aria-label="Search items"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-fg"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <SearchDropdown
              open={searchOpen}
              query={query}
              results={searchSuggestions}
              onSelect={onSelectFromSearch}
              onClose={() => setSearchOpen(false)}
              anchorRef={searchAnchorRef}
            />
          </div>

          <div className="hidden min-w-0 items-center gap-1 lg:flex">
            <div className="scroll-x min-w-0 flex-1">
              <div className="flex w-max items-center gap-1 pb-0.5">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.id;
                  const count = item.id === "watch" ? watchlist.ids.length : undefined;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTab(item.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-border-strong bg-surface-2 text-fg"
                          : "border-transparent text-muted hover:bg-surface hover:text-fg",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.desktopLabel}
                      {count != null && count > 0 && (
                        <span className="tabular text-subtle">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* List-first: full-width list on PC; item detail is full-page overlay only */}
      <main className="app-main mx-auto grid w-full max-w-[1800px] min-w-0 grid-cols-1">
        <section
          className="flex min-w-0 flex-col overflow-hidden border-border"
          style={{ minHeight: 0, height: "100%" }}
        >
          <div
            className="min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain"
            style={{ flex: "1 1 0%", minHeight: 0 }}
          >
            {catalog.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : catalog.isError ? (
              <div className="m-4 rounded-lg border border-loss/30 bg-loss/10 p-4 text-sm text-loss">
                Could not load live prices. Try refresh.
              </div>
            ) : showFlipBoard ? (
              <>
                <ListFilters
                  value={filters}
                  onChange={setFilters}
                  defaultOpen={filtersDefaultOpen}
                />
                <FlipBoard
                  flips={activeFlips}
                  selectedId={activeId}
                  onSelect={onSelectId}
                  bankroll={bankroll}
                  mode={flipMode}
                />
              </>
            ) : showAlchBoard ? (
              <HighAlchBoard
                items={items}
                selectedId={activeId}
                onSelect={onSelectId}
              />
            ) : tab === "invest" ? (
              <InvestBoard
                items={items}
                bankroll={bankroll}
                onSelectItem={(id) => {
                  onSelectId(id);
                  setTab("flips");
                }}
              />
            ) : showItemList ? (
              <>
                <ListFilters
                  value={filters}
                  onChange={setFilters}
                  defaultOpen={filtersDefaultOpen}
                />
                {(tab === "watch" || tab === "volume") && (
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                      {tab === "watch"
                        ? `Watchlist · ${listItems.length}`
                        : `Highest 1h volume · ${listItems.length}`}
                    </p>
                  </div>
                )}
                <div
                  className={cn(
                    ITEM_GRID,
                    "hidden shrink-0 items-center border-b border-border px-2.5 py-2 sm:grid sm:px-3",
                  )}
                >
                  <div />
                  <SortableTh
                    label="Item"
                    align="left"
                    active={itemSortKey === "name"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("name")}
                  />
                  <SortableTh
                    label="Buy"
                    active={itemSortKey === "buy"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("buy")}
                  />
                  <SortableTh
                    label="Sell"
                    active={itemSortKey === "sell"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("sell")}
                  />
                  <SortableTh
                    label="Margin"
                    active={itemSortKey === "margin"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("margin")}
                  />
                  <SortableTh
                    label="1h trades"
                    active={itemSortKey === "volume"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("volume")}
                  />
                  <SortableTh
                    label="5m"
                    title="Trades in the last 5 minutes — not 5 million GP"
                    active={itemSortKey === "volume5m"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("volume5m")}
                  />
                  <SortableTh
                    label="Fill"
                    title="Will it fill? 0–100 both buy and sell complete"
                    active={itemSortKey === "fill"}
                    dir={itemSortDir}
                    onClick={() => onItemSort("fill")}
                  />
                  <div />
                </div>
                {/* Mobile numeric sort chips */}
                <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2 sm:hidden">
                  {(
                    [
                      ["fill", "Fill"],
                      ["volume", "Vol"],
                      ["volume5m", "5m"],
                      ["margin", "Margin"],
                      ["buy", "Buy"],
                      ["sell", "Sell"],
                      ["limit", "Limit"],
                      ["potential", "Potential"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onItemSort(key)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[11px] font-medium",
                        itemSortKey === key
                          ? "border-border-strong bg-surface-2 text-fg"
                          : "border-border bg-surface text-muted",
                      )}
                    >
                      {label}
                      {itemSortKey === key ? (itemSortDir === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  ))}
                </div>
                <div className="space-y-0.5 p-2 sm:p-3">
                  {listItems.length === 0 ? (
                    <EmptyState tab={tab} hasQuery={Boolean(query.trim())} />
                  ) : (
                    listItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        selected={activeId === item.id}
                        onSelect={onSelect}
                      />
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="hidden shrink-0 border-t border-border bg-bg px-4 py-2 text-center text-[11px] text-subtle lg:block">
        Live prices: OSRS Wiki / RuneLite. Not affiliated with Jagex. Flips are estimates only.
      </footer>

      {/*
        Bottom tabs — fixed to physical bottom (.bottom-nav in styles.css).
        Safe-area padding is on the nav so surface bg fills the home-indicator strip.
        theme-color / html body also use surface so any residual system strip matches.
      */}
      <nav className="bottom-nav z-20 lg:hidden" aria-label="Main">
        <div className="mx-auto flex h-12 max-w-7xl items-stretch justify-around px-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            const count = item.id === "watch" ? watchlist.ids.length : undefined;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTab(item.id)}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted active:text-fg",
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.25px]")} />
                <span className="truncate leading-none">{item.label}</span>
                {count != null && count > 0 && (
                  <span className="absolute right-1/2 top-0.5 translate-x-3.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-primary-fg">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {mobileDetailOpen && selected && tab !== "invest" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Close detail"
            onClick={() => setMobileDetailOpen(false)}
          />
          {/* Single scroll owner — min-h-0 flex-1 + overscroll so iOS can reach the graph */}
          <div className="relative z-10 flex max-h-[min(92dvh,100%)] min-h-0 w-full flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong" />
            <div
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <ItemDetail
                item={selected}
                bankroll={bankroll}
                flipMode={showFlipBoard ? flipMode : "safe"}
                sheet
                onClose={() => setMobileDetailOpen(false)}
              />
            </div>
            <div className="home-indicator-pad shrink-0" aria-hidden />
          </div>
        </div>
      )}

      {/* Desktop full-page item intelligence — opens on any item click */}
      {fullPageOpen && selected && (
        <div
          className="fixed inset-0 z-50 hidden overflow-hidden bg-bg lg:block"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} details`}
        >
          <div className="flex h-full min-h-0 flex-col">
            <ItemDetail
              item={selected}
              bankroll={bankroll}
              flipMode={showFlipBoard ? flipMode : "safe"}
              fullPage
              onClose={() => {
                setFullPageOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <ThemePicker open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  );
}

function EmptyState({ tab, hasQuery }: { tab: Tab; hasQuery: boolean }) {
  if (tab === "search" && hasQuery) {
    return (
      <div className="m-6 text-center">
        <p className="text-sm font-medium text-fg">No items match</p>
        <p className="mt-1 text-xs text-muted">Try a shorter name or check spelling.</p>
      </div>
    );
  }
  if (tab === "watch") {
    return (
      <div className="m-6 text-center">
        <Star className="mx-auto h-6 w-6 text-subtle" />
        <p className="mt-2 text-sm font-medium text-fg">Watchlist empty</p>
        <p className="mt-1 text-xs text-muted">
          Search for items and tap the star to track them here.
        </p>
      </div>
    );
  }
  return (
    <div className="m-6 text-center text-sm text-muted">Nothing to show yet.</div>
  );
}
