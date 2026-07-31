import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  TrendingUp,
  Star,
  Flame,
  ArrowUpDown,
  X,
  Coins,
  LineChart,
  Zap,
} from "lucide-react";
import { fetchCatalog, type CatalogItem } from "@/lib/osrs/api";
import { useWatchlist } from "@/lib/osrs/watchlist";
import { useBankroll } from "@/lib/osrs/bankroll";
import { parseGpInput, rankFlips, type FlipMode } from "@/lib/osrs/flip";
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
import { AppLogo } from "./AppLogo";
import { ThemeButton, ThemePicker } from "./ThemePicker";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/osrs/format";

type Tab = "flips" | "hot" | "invest" | "watch" | "volume" | "search";
type SortKey = "volume" | "margin" | "price" | "name";

const NAV: {
  id: Exclude<Tab, "search">;
  label: string;
  desktopLabel: string;
  icon: typeof Coins;
}[] = [
  { id: "flips", label: "Best", desktopLabel: "Best flips", icon: Coins },
  { id: "hot", label: "Hot", desktopLabel: "Hot flips", icon: Zap },
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
  const [sort, setSort] = useState<SortKey>("volume");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const items = catalog.data?.items ?? [];
  const byId = useMemo(() => {
    const m = new Map<number, CatalogItem>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const safeFlips = useMemo(
    () => rankFlips(items, bankroll, 40, "safe"),
    [items, bankroll],
  );
  const hotFlips = useMemo(
    () => rankFlips(items, bankroll, 40, "hot"),
    [items, bankroll],
  );

  const flipMode: FlipMode = tab === "hot" ? "hot" : "safe";
  const activeFlips = tab === "hot" ? hotFlips : safeFlips;

  const searchResults = useMemo(() => {
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
    return scored.slice(0, 80).map((s) => s.item);
  }, [items, query]);

  const listItems = useMemo(() => {
    let list: CatalogItem[] = [];
    if (tab === "search") {
      list = searchResults;
    } else if (tab === "watch") {
      list = watchlist.ids
        .map((id) => byId.get(id))
        .filter((x): x is CatalogItem => Boolean(x));
    } else if (tab === "volume") {
      list = items
        .filter((i) => i.volume1h > 0 && i.high != null)
        .slice()
        .sort((a, b) => b.volume1h - a.volume1h)
        .slice(0, 60);
    } else {
      return [];
    }

    if (tab === "watch" || tab === "search") {
      const sorted = list.slice();
      sorted.sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "price") return (b.high ?? 0) - (a.high ?? 0);
        if (sort === "margin") return (b.margin ?? -Infinity) - (a.margin ?? -Infinity);
        return b.volume1h - a.volume1h;
      });
      return sorted;
    }
    return list;
  }, [tab, searchResults, watchlist.ids, byId, items, sort]);

  const selected = useMemo(() => {
    if (selectedId != null) {
      const hit = byId.get(selectedId);
      if (hit) return hit;
    }
    if ((tab === "flips" || tab === "hot") && activeFlips[0]) return activeFlips[0].item;
    return listItems[0] ?? null;
  }, [selectedId, byId, listItems, tab, activeFlips]);

  const activeId = selected?.id ?? null;

  const onSelect = useCallback((item: CatalogItem) => {
    setSelectedId(item.id);
    if (isPhoneLayout()) setMobileDetailOpen(true);
  }, []);

  const onSelectId = useCallback((id: number) => {
    setSelectedId(id);
    if (isPhoneLayout()) setMobileDetailOpen(true);
  }, []);

  const goTab = useCallback((id: Exclude<Tab, "search">) => {
    setTab(id);
    setQuery("");
  }, []);

  const lastTradeAge =
    catalog.data?.priceTimestamp != null
      ? formatRelativeTime(catalog.data.priceTimestamp)
      : null;

  const showItemList = tab === "watch" || tab === "volume" || tab === "search";
  const showDetailAside = tab !== "invest";
  const showFlipBoard = tab === "flips" || tab === "hot";
  const activeNav = tab === "search" ? null : tab;

  return (
    <div
      className="app"
      data-layout={display.isDesktop ? "desktop" : "mobile"}
      data-standalone={display.isStandalone ? "true" : "false"}
    >
      <header className="z-20 w-full min-w-0 shrink-0 border-b border-border bg-surface pad-top-safe">
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

          <div className="relative min-w-0 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setTab("search");
              }}
              placeholder="Search any item…"
              className="w-full min-w-0 pl-10 pr-10"
              aria-label="Search items"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  if (tab === "search") setTab("flips");
                }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-fg"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
                {tab === "search" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg">
                    <Search className="h-3.5 w-3.5" />
                    Results · {searchResults.length}
                  </span>
                )}
              </div>
            </div>
            {(tab === "watch" || tab === "search") && (
              <div className="ml-2 flex shrink-0 items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-subtle" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-10 rounded-md border border-border bg-surface-2 px-2 text-base text-fg sm:h-8 sm:text-xs"
                  aria-label="Sort by"
                >
                  <option value="volume">Volume</option>
                  <option value="margin">Margin</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
              </div>
            )}
          </div>

          {tab === "search" && (
            <div className="flex items-center gap-2 text-xs text-muted lg:hidden">
              <Search className="h-3.5 w-3.5" />
              <span>
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-subtle" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-10 rounded-md border border-border bg-surface-2 px-2 text-base text-fg"
                  aria-label="Sort by"
                >
                  <option value="volume">Volume</option>
                  <option value="margin">Margin</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      <main
        className={cn(
          "app-main mx-auto grid w-full max-w-[1600px] min-w-0",
          showDetailAside
            ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(480px,54%)] xl:grid-cols-[minmax(0,1fr)_minmax(560px,58%)]"
            : "grid-cols-1",
        )}
      >
        <section
          className="flex min-w-0 flex-col overflow-hidden border-border lg:border-r"
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
              <FlipBoard
                flips={activeFlips}
                selectedId={activeId}
                onSelect={onSelectId}
                bankroll={bankroll}
                mode={flipMode}
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
                {(tab === "watch" || tab === "volume") && (
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                      {tab === "watch"
                        ? `Watchlist · ${listItems.length}`
                        : "Highest 1h volume"}
                    </p>
                    {tab === "watch" && (
                      <div className="flex items-center gap-1 lg:hidden">
                        <ArrowUpDown className="h-3.5 w-3.5 text-subtle" />
                        <select
                          value={sort}
                          onChange={(e) => setSort(e.target.value as SortKey)}
                          className="h-10 rounded-md border border-border bg-surface-2 px-2 text-base text-fg"
                          aria-label="Sort by"
                        >
                          <option value="volume">Volume</option>
                          <option value="margin">Margin</option>
                          <option value="price">Price</option>
                          <option value="name">Name</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    ITEM_GRID,
                    "hidden shrink-0 items-center border-b border-border px-2.5 py-2 sm:grid sm:px-3",
                  )}
                >
                  <div />
                  <div className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                    Item
                  </div>
                  <div className="text-right text-[11px] font-medium uppercase tracking-wide text-subtle">
                    Buy
                  </div>
                  <div className="text-right text-[11px] font-medium uppercase tracking-wide text-subtle">
                    Sell
                  </div>
                  <div className="text-right text-[11px] font-medium uppercase tracking-wide text-subtle">
                    Margin
                  </div>
                  <div className="text-right text-[11px] font-medium uppercase tracking-wide text-subtle">
                    1h vol
                  </div>
                  <div />
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

        {showDetailAside && (
          <aside className="hidden min-h-0 min-w-0 overflow-x-hidden overflow-y-auto border-l border-border bg-surface lg:block">
            {selected ? (
              <ItemDetail
                item={selected}
                bankroll={bankroll}
                flipMode={showFlipBoard ? flipMode : "safe"}
                onClose={() => setSelectedId(null)}
                chartTall
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <TrendingUp className="h-8 w-8 text-subtle" />
                <p className="text-sm font-medium text-fg">Select a flip</p>
                <p className="max-w-[220px] text-xs text-muted">
                  Set starting GP, then pick an item to see quantity-aware profit.
                </p>
              </div>
            )}
          </aside>
        )}
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
        <div className="fixed inset-0 z-40 overflow-hidden lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Close detail"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[92%] w-full overflow-hidden rounded-t-xl border border-border bg-surface shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" />
            <div className="max-h-[min(88dvh,100%)] overflow-x-hidden overflow-y-auto">
              <ItemDetail
                item={selected}
                bankroll={bankroll}
                flipMode={showFlipBoard ? flipMode : "safe"}
                onClose={() => setMobileDetailOpen(false)}
              />
            </div>
            <div className="home-indicator-pad" aria-hidden />
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
