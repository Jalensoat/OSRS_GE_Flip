import { useMemo, useState } from "react";
import {
  ALCHS_PER_HOUR,
  ALCH_BATCH,
  ALCH_INTERVAL_SEC,
  EMPTY_ALCH_FILTERS,
  countAlchFilters,
  filterHighAlchs,
  nextAlchSortState,
  rankHighAlchs,
  sortHighAlchs,
  type AlchFilterState,
  type AlchSortKey,
  type HighAlchOpportunity,
  type SortDir,
} from "@/lib/osrs/highAlch";
import type { CatalogItem } from "@/lib/osrs/api";
import { formatGp, formatPercent, formatVolume } from "@/lib/osrs/format";
import { formatQty } from "@/lib/osrs/flip";
import { ItemIcon } from "./ItemIcon";
import { SortableTh } from "./SortableTh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ChevronDown,
  Filter,
  Info,
  Sparkles,
  X,
} from "lucide-react";

const ALCH_GRID =
  "grid-cols-[2rem_minmax(0,1.5fr)_repeat(8,minmax(0,0.85fr))]";

const MOBILE_SORTS: { key: AlchSortKey; label: string }[] = [
  { key: "profit", label: "Profit" },
  { key: "gpHour", label: "GP/h" },
  { key: "roi", label: "ROI" },
  { key: "volume", label: "Vol" },
  { key: "buy", label: "Price" },
  { key: "cost1000", label: "1k cost" },
  { key: "highAlch", label: "Alch" },
  { key: "name", label: "Name" },
];

export function HighAlchBoard({
  items,
  selectedId,
  onSelect,
}: {
  items: CatalogItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [filters, setFilters] = useState<AlchFilterState>({
    ...EMPTY_ALCH_FILTERS,
  });
  const [sortKey, setSortKey] = useState<AlchSortKey | null>("profit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [tipOpen, setTipOpen] = useState(false);

  const ranked = useMemo(() => rankHighAlchs(items, 400), [items]);
  const natureCost = ranked[0]?.natureCost ?? 0;

  const filtered = useMemo(
    () => filterHighAlchs(ranked, filters),
    [ranked, filters],
  );

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return sortHighAlchs(filtered, sortKey, sortDir);
  }, [filtered, sortKey, sortDir]);

  const onSort = (key: AlchSortKey) => {
    const next = nextAlchSortState(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const best = sorted[0];

  return (
    <div className="min-w-0 w-full max-w-full space-y-2 overflow-x-hidden p-2 sm:space-y-3 sm:p-3">
      {/* Summary */}
      <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        <SummaryCard
          label="Nature rune"
          value={natureCost > 0 ? formatGp(natureCost) : "—"}
          sub="Live GE buy"
        />
        <SummaryCard
          label="Alch rate"
          value={`${ALCHS_PER_HOUR}/h`}
          sub={`Every ${ALCH_INTERVAL_SEC}s`}
        />
        <SummaryCard
          label="Listed"
          value={String(sorted.length)}
          sub={filters.profitOnly ? "Profit > 0" : "All with alch data"}
        />
        <SummaryCard
          label="Best profit"
          value={best ? formatGp(best.profit) : "—"}
          sub={best ? best.item.name : "—"}
        />
      </div>

      <div className="min-w-0 rounded-md border border-border bg-surface">
        <button
          type="button"
          onClick={() => setTipOpen((o) => !o)}
          className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-muted"
          aria-expanded={tipOpen}
        >
          <Info className="h-3.5 w-3.5 shrink-0 text-subtle" />
          <span className="min-w-0 flex-1 truncate">How high-alch profit works</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              tipOpen && "rotate-180",
            )}
          />
        </button>
        {tipOpen && (
          <div className="space-y-1.5 border-t border-border/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            <p>
              <span className="text-fg font-medium">Profit</span> = High alch value −
              item buy (GE insta-buy / wiki high) − nature rune.{" "}
              <span className="text-fg font-medium">GP/h</span> assumes one cast every{" "}
              {ALCH_INTERVAL_SEC}s ({ALCHS_PER_HOUR.toLocaleString()} alchs/hour) with no
              banking downtime.
            </p>
            <p>
              <span className="text-fg font-medium">Cost / {ALCH_BATCH}</span> = capital
              for {ALCH_BATCH.toLocaleString()} items + {ALCH_BATCH.toLocaleString()}{" "}
              natures. Buy prices use last high print so margins aren’t fake-cheap.
            </p>
          </div>
        )}
      </div>

      <AlchFilters value={filters} onChange={setFilters} />

      {/* Mobile sorts */}
      <div className="flex min-w-0 items-center gap-1.5 lg:hidden">
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-subtle">
          <ArrowUpDown className="h-3 w-3" />
          Sort
        </span>
        <div className="scroll-x min-w-0 flex-1">
          <div className="flex w-max items-center gap-1 pb-0.5">
            {MOBILE_SORTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onSort(key)}
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  sortKey === key
                    ? "border-border-strong bg-surface-2 text-fg"
                    : "border-border bg-surface text-muted active:bg-surface-2",
                )}
              >
                {label}
                {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div
        className={cn(
          "hidden min-w-0 gap-2 border-b border-border px-2.5 pb-2 lg:grid",
          ALCH_GRID,
        )}
      >
        <div />
        <SortableTh
          label="Item"
          align="left"
          active={sortKey === "name"}
          dir={sortDir}
          onClick={() => onSort("name")}
        />
        <SortableTh
          label="Buy"
          title="GE insta-buy (wiki high)"
          active={sortKey === "buy"}
          dir={sortDir}
          onClick={() => onSort("buy")}
        />
        <SortableTh
          label="High alch"
          active={sortKey === "highAlch"}
          dir={sortDir}
          onClick={() => onSort("highAlch")}
        />
        <SortableTh
          label="Nature"
          active={sortKey === "nature"}
          dir={sortDir}
          onClick={() => onSort("nature")}
        />
        <SortableTh
          label="Profit"
          active={sortKey === "profit"}
          dir={sortDir}
          onClick={() => onSort("profit")}
        />
        <SortableTh
          label="ROI"
          active={sortKey === "roi"}
          dir={sortDir}
          onClick={() => onSort("roi")}
        />
        <SortableTh
          label="GP / hour"
          title={`${ALCHS_PER_HOUR} alchs/h at 1 cast / ${ALCH_INTERVAL_SEC}s`}
          active={sortKey === "gpHour"}
          dir={sortDir}
          onClick={() => onSort("gpHour")}
        />
        <SortableTh
          label={`Cost / ${ALCH_BATCH / 1000}k`}
          title={`Capital for ${ALCH_BATCH} items + natures`}
          active={sortKey === "cost1000"}
          dir={sortDir}
          onClick={() => onSort("cost1000")}
        />
        <SortableTh
          label="1h vol"
          active={sortKey === "volume"}
          dir={sortDir}
          onClick={() => onSort("volume")}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="m-6 text-center">
          <p className="text-sm font-medium text-fg">No alch rows match filters</p>
          <p className="mt-1 text-xs text-muted">
            Loosen volume / profit / ROI filters, or turn off “Profit only”.
          </p>
        </div>
      ) : (
        <div className="min-w-0 space-y-0.5">
          {sorted.map((row, i) => (
            <AlchRow
              key={row.item.id}
              rank={i + 1}
              row={row}
              selected={selectedId === row.item.id}
              onSelect={() => onSelect(row.item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface px-1.5 py-1.5 sm:rounded-lg sm:p-3">
      <div className="truncate text-[9px] text-muted sm:text-[11px]">{label}</div>
      <div className="mt-0.5 truncate text-[11px] font-semibold tabular tracking-tight text-fg sm:mt-1 sm:text-base">
        {value}
      </div>
      <div className="mt-0 truncate text-[9px] text-subtle sm:mt-0.5 sm:text-xs">{sub}</div>
    </div>
  );
}

function AlchRow({
  row,
  rank,
  selected,
  onSelect,
}: {
  row: HighAlchOpportunity;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { item } = row;
  const gain = row.profit > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-2.5 text-left transition-colors",
        "grid-cols-[2rem_minmax(0,1fr)_auto]",
        "lg:grid-cols-[2rem_minmax(0,1.5fr)_repeat(8,minmax(0,0.85fr))]",
        selected
          ? "border-border-strong bg-surface-2"
          : "border-transparent hover:border-border hover:bg-surface",
      )}
    >
      <div className="relative shrink-0">
        <ItemIcon icon={item.icon} name={item.name} size="sm" />
        <span className="absolute left-0 top-0 flex h-4 w-4 -translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-surface-3 text-[9px] font-semibold tabular text-muted ring-1 ring-border">
          {rank}
        </span>
      </div>

      <div className="min-w-0 overflow-hidden">
        <div className="truncate text-sm font-medium text-fg">{item.name}</div>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-subtle">
          {item.limit != null && (
            <span className="tabular">Limit {formatQty(item.limit)}</span>
          )}
          {item.members ? (
            <Badge variant="accent" className="text-[10px] py-0">
              Members
            </Badge>
          ) : (
            <Badge className="text-[10px] py-0">F2P</Badge>
          )}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-xs lg:hidden">
          <span className={cn("tabular font-medium", gain ? "text-gain" : "text-loss")}>
            {formatGp(row.profit)}
          </span>
          <span className="tabular text-muted">{formatPercent(row.roiPct)} ROI</span>
          <span className="tabular text-fg">{formatGp(row.profitPerHour)}/h</span>
          <span className="tabular text-subtle">{formatVolume(row.volume1h)}/h</span>
        </div>
      </div>

      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">{formatGp(row.buyPrice)}</div>
        <div className="text-[11px] text-subtle">insta buy</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">{formatGp(row.highAlch)}</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">{formatGp(row.natureCost)}</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div
          className={cn(
            "text-sm tabular font-semibold",
            gain ? "text-gain" : "text-loss",
          )}
        >
          {formatGp(row.profit)}
        </div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div
          className={cn(
            "text-sm tabular font-medium",
            gain ? "text-gain" : "text-loss",
          )}
        >
          {formatPercent(row.roiPct)}
        </div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div
          className={cn(
            "text-sm tabular font-medium",
            gain ? "text-gain" : "text-fg",
          )}
        >
          {formatGp(row.profitPerHour)}
        </div>
        <div className="text-[11px] text-subtle">@ {ALCHS_PER_HOUR}/h</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">
          {formatGp(row.costFor1000)}
        </div>
        <div className="text-[11px] tabular text-subtle">
          +{formatGp(row.profitFor1000)} if green
        </div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">
          {formatVolume(row.volume1h)}
        </div>
        <div className="text-[11px] text-subtle">1h trades</div>
      </div>

      <div className="min-w-0 shrink-0 text-right lg:hidden">
        <div
          className={cn(
            "text-sm tabular font-semibold",
            gain ? "text-gain" : "text-loss",
          )}
        >
          {formatGp(row.profit)}
        </div>
        <div className="text-[10px] tabular text-subtle">
          {formatGp(row.profitPerHour)}/h
        </div>
      </div>
    </button>
  );
}

function AlchFilters({
  value,
  onChange,
}: {
  value: AlchFilterState;
  onChange: (next: AlchFilterState) => void;
}) {
  const [open, setOpen] = useState(true);
  const active = countAlchFilters(value);
  const set = <K extends keyof AlchFilterState>(key: K, v: AlchFilterState[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="rounded-md border border-border bg-surface-2/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
        aria-expanded={open}
      >
        <Filter className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1 text-[11px] font-semibold text-fg">
          Alch filters
          {active > 0 && (
            <span className="ml-1.5 tabular text-subtle">({active} active)</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-2.5 py-2.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set("profitOnly", !value.profitOnly)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                value.profitOnly
                  ? "border-gain/40 bg-gain/10 text-gain"
                  : "border-border text-muted",
              )}
            >
              <Sparkles className="mr-1 inline h-3 w-3" />
              Profit only
            </button>
            <button
              type="button"
              onClick={() => set("f2pOnly", !value.f2pOnly)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                value.f2pOnly
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-muted",
              )}
            >
              F2P only
            </button>
            {active > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => onChange({ ...EMPTY_ALCH_FILTERS })}
              >
                <X className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <RangeField
              label="1h volume"
              min={value.volumeMin}
              max={value.volumeMax}
              onMin={(v) => set("volumeMin", v)}
              onMax={(v) => set("volumeMax", v)}
              hint="Trade count last hour"
            />
            <RangeField
              label="ROI %"
              min={value.roiMin}
              max={value.roiMax}
              onMin={(v) => set("roiMin", v)}
              onMax={(v) => set("roiMax", v)}
              hint="Profit ÷ cost per alch"
            />
            <RangeField
              label="Price / item"
              min={value.priceMin}
              max={value.priceMax}
              onMin={(v) => set("priceMin", v)}
              onMax={(v) => set("priceMax", v)}
              hint="GE insta-buy price"
            />
            <RangeField
              label="GP / hour"
              min={value.gpHourMin}
              max={value.gpHourMax}
              onMin={(v) => set("gpHourMin", v)}
              onMax={(v) => set("gpHourMax", v)}
              hint={`${ALCHS_PER_HOUR}/h theoretical`}
            />
            <RangeField
              label={`Cost for ${ALCH_BATCH}`}
              min={value.cost1000Min}
              max={value.cost1000Max}
              onMin={(v) => set("cost1000Min", v)}
              onMax={(v) => set("cost1000Max", v)}
              hint="Items + natures"
            />
            <RangeField
              label="Profit / alch"
              min={value.profitMin}
              max={value.profitMax}
              onMin={(v) => set("profitMin", v)}
              onMax={(v) => set("profitMax", v)}
            />
            <RangeField
              label="High alch value"
              min={value.alchMin}
              max={value.alchMax}
              onMin={(v) => set("alchMin", v)}
              onMax={(v) => set("alchMax", v)}
            />
            <RangeField
              label="Buy limit"
              min={value.limitMin}
              max={value.limitMax}
              onMin={(v) => set("limitMin", v)}
              onMax={(v) => set("limitMax", v)}
              hint="GE 4h buy limit"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  onMin,
  onMax,
  hint,
}: {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <Input
          value={min}
          onChange={(e) => onMin(e.target.value)}
          placeholder="Min"
          inputMode="decimal"
          aria-label={`${label} minimum`}
          className="h-9 min-w-0 px-2 text-sm"
        />
        <span className="text-xs text-subtle">–</span>
        <Input
          value={max}
          onChange={(e) => onMax(e.target.value)}
          placeholder="Max"
          inputMode="decimal"
          aria-label={`${label} maximum`}
          className="h-9 min-w-0 px-2 text-sm"
        />
      </div>
      {hint ? <p className="text-[10px] text-subtle">{hint}</p> : null}
    </div>
  );
}
