import { useMemo, useState } from "react";
import type { FlipMode, FlipOpportunity } from "@/lib/osrs/flip";
import { formatQty } from "@/lib/osrs/flip";
import { formatGp, formatPercent, formatVolume } from "@/lib/osrs/format";
import {
  nextSortState,
  sortFlips,
  type FlipSortKey,
  type SortDir,
} from "@/lib/osrs/listFilters";
import { computeItemInsights } from "@/lib/osrs/itemInsights";
import { METRIC_BY_ID } from "@/lib/osrs/metricGuide";
import { ItemIcon } from "./ItemIcon";
import { SortableTh } from "./SortableTh";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Timer,
  Coins,
  ShieldCheck,
  Activity,
  Flame,
  ChevronDown,
  ArrowUpDown,
  Info,
} from "lucide-react";

/** PC table grid: icon · name · sold · prices · qty · gp/h · margin · fill · trust */
const FLIP_GRID =
  "grid-cols-[2rem_minmax(0,1.4fr)_repeat(7,minmax(0,0.95fr))]";

const MOBILE_SORTS: { key: FlipSortKey; label: string }[] = [
  { key: "gpHour", label: "GP/h" },
  { key: "fill", label: "Fill" },
  { key: "sold1h", label: "Sold 1h" },
  { key: "margin", label: "Margin" },
  { key: "roi", label: "ROI" },
  { key: "qty", label: "Qty" },
  { key: "trust", label: "Trust" },
  { key: "name", label: "Name" },
];

export function FlipBoard({
  flips,
  selectedId,
  onSelect,
  bankroll,
  mode = "safe",
}: {
  flips: FlipOpportunity[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  bankroll: number;
  mode?: FlipMode;
}) {
  const isHot = mode === "hot";
  const [sortKey, setSortKey] = useState<FlipSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [tipOpen, setTipOpen] = useState(false);

  const sorted = useMemo(() => {
    if (!sortKey) return flips;
    return sortFlips(flips, sortKey, sortDir);
  }, [flips, sortKey, sortDir]);

  const onSort = (key: FlipSortKey) => {
    const next = nextSortState(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  if (bankroll <= 0) {
    return (
      <div className="m-6 text-center">
        <p className="text-sm font-medium text-fg">Enter your starting GP</p>
        <p className="mt-1 text-xs text-muted">
          We need a bankroll to size quantity and realized profit.
        </p>
      </div>
    );
  }

  if (!flips.length) {
    return (
      <div className="m-6 text-center">
        <p className="text-sm font-medium text-fg">
          {isHot ? "No hot spreads right now" : "No liquid flips for this bankroll"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {isHot
            ? "Nothing with a positive last-trade margin for this bankroll. Try Safe flips or a larger bankroll."
            : "We only list items with enough 1h trades on both sides and stable average prices — thin spike margins are filtered out."}
        </p>
      </div>
    );
  }

  const best = sorted[0]!;

  const tipBody = isHot ? (
    <>
      <span className="text-warn font-medium">Higher risk. </span>
      Uses <span className="text-fg">latest high/low trades</span> so fast movers can appear —
      a single print can reverse. Check <span className="text-fg">Will fill?</span>, sold/h, and
      trades last 5m before filling.
    </>
  ) : (
    <>
      Prices use <span className="text-fg">1h / 5m trade averages</span>, not the last single
      offer. Ranked by <span className="text-fg">GP/hour × volume confidence</span>. Check{" "}
      <span className="text-fg">Will fill?</span> (0–100) before full limits. Min{" "}
      <span className="text-fg">12 trades/side/hour</span>.
    </>
  );

  return (
    <div className="min-w-0 w-full max-w-full space-y-2 overflow-x-hidden p-2 sm:space-y-3 sm:p-3">
      {/* Compact summary strip — denser on phone so the flip list gets the page */}
      <div className="grid min-w-0 grid-cols-4 gap-1 sm:gap-2">
        <SummaryCard
          icon={isHot ? <Flame className="h-3 w-3" /> : <Coins className="h-3 w-3" />}
          label="Best /h"
          value={formatGp(best.profitPerHour)}
          sub={best.item.name}
        />
        <SummaryCard
          icon={<Activity className="h-3 w-3" />}
          label="1h trades"
          value={formatVolume(best.soldTotal1h)}
          sub={`${formatVolume(best.soldBuySide1h)}/${formatVolume(best.soldSellSide1h)}`}
        />
        <SummaryCard
          icon={isHot ? <Flame className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
          label={isHot ? "Mode" : "Trust"}
          value={isHot ? "Hot" : best.confidenceLabel}
          sub={isHot ? "Last trade" : `${best.confidence}/100`}
        />
        <SummaryCard
          icon={<Timer className="h-3 w-3" />}
          label="Best /day"
          value={formatGp(best.profitPerDay)}
          sub="Capped"
        />
      </div>

      {/* Collapsible pricing tip — collapsed by default (saves ~1/3 page on mobile) */}
      <div
        className={cn(
          "min-w-0 rounded-md border",
          isHot ? "border-warn/30 bg-warn/5" : "border-border bg-surface",
        )}
      >
        <button
          type="button"
          onClick={() => setTipOpen((o) => !o)}
          className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-muted"
          aria-expanded={tipOpen}
        >
          <Info className="h-3.5 w-3.5 shrink-0 text-subtle" />
          <span className="min-w-0 flex-1 truncate">
            {isHot ? "How Hot prices work" : "How Safe prices work"}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              tipOpen && "rotate-180",
            )}
          />
        </button>
        {tipOpen && (
          <div className="border-t border-border/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            {tipBody}
          </div>
        )}
      </div>

      {/* Mobile sort row — always visible on Best / Hot tabs */}
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

      <div
        className={cn(
          "hidden min-w-0 gap-2 border-b border-border px-2.5 pb-2 lg:grid",
          FLIP_GRID,
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
          label="Sold 1h"
          active={sortKey === "sold1h"}
          dir={sortDir}
          onClick={() => onSort("sold1h")}
        />
        <SortableTh
          label="Buy → sell"
          active={sortKey === "buy"}
          dir={sortDir}
          onClick={() => onSort("buy")}
        />
        <SortableTh
          label="Qty"
          active={sortKey === "qty"}
          dir={sortDir}
          onClick={() => onSort("qty")}
        />
        <SortableTh
          label="GP / hour"
          active={sortKey === "gpHour"}
          dir={sortDir}
          onClick={() => onSort("gpHour")}
        />
        <SortableTh
          label="Margin"
          active={sortKey === "margin"}
          dir={sortDir}
          onClick={() => onSort("margin")}
        />
        <SortableTh
          label="Will fill?"
          title={METRIC_BY_ID.fillScore?.short}
          active={sortKey === "fill"}
          dir={sortDir}
          onClick={() => onSort("fill")}
        />
        <SortableTh
          label={isHot ? "Risk" : "Trust"}
          active={sortKey === "trust"}
          dir={sortDir}
          onClick={() => onSort("trust")}
        />
      </div>

      <div className="min-w-0 space-y-0.5">
        {sorted.map((f, i) => (
          <FlipRow
            key={f.item.id}
            rank={i + 1}
            flip={f}
            selected={selectedId === f.item.id}
            onSelect={() => onSelect(f.item.id)}
            isHot={isHot}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface px-1.5 py-1.5 sm:rounded-lg sm:p-3">
      <div className="flex min-w-0 items-center gap-0.5 text-[9px] text-muted sm:gap-1.5 sm:text-[11px]">
        <span className="hidden shrink-0 sm:inline">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-0.5 truncate text-[11px] font-semibold tabular tracking-tight text-fg sm:mt-1 sm:text-base sm:text-lg">
        {value}
      </div>
      <div className="mt-0 truncate text-[9px] text-subtle sm:mt-0.5 sm:text-xs">{sub}</div>
    </div>
  );
}

function FlipRow({
  flip,
  rank,
  selected,
  onSelect,
  isHot,
}: {
  flip: FlipOpportunity;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  isHot: boolean;
}) {
  const { item } = flip;
  // Catalog-only fill score (same formula as ItemDetail — no history/bankroll).
  const fillScore = useMemo(
    () => computeItemInsights(item).fillScore,
    [item],
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full min-w-0 max-w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-2.5 text-left transition-colors lg:grid-cols-[2rem_minmax(0,1.4fr)_repeat(7,minmax(0,0.95fr))]",
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
          <span className="tabular text-gain">+{formatGp(flip.marginPerItem)} ea</span>
          <BottleneckBadge kind={flip.bottleneck} />
          {flip.spikeRisk && (
            <Badge variant="warn" className="text-[10px] py-0">
              {isHot ? "Spike risk" : "Spike filtered"}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-xs lg:hidden">
          <span className="tabular text-fg">{formatVolume(flip.soldTotal1h)} sold/h</span>
          <span className="tabular text-muted">
            {formatGp(flip.buyPrice)}→{formatGp(flip.sellPrice)}
          </span>
          <span className="tabular text-gain">{formatGp(flip.profitPerHour)}/h</span>
          <FillScore value={fillScore} compact />
        </div>
      </div>

      {/* Desktop columns */}
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">
          {formatVolume(flip.soldTotal1h)}
        </div>
        <div className="text-[11px] tabular text-subtle">
          {formatVolume(flip.soldBuySide1h)}/{formatVolume(flip.soldSellSide1h)} ·{" "}
          {formatVolume(flip.soldTotal5m)} 5m
        </div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">{formatGp(flip.buyPrice)}</div>
        <div className="text-[11px] tabular text-subtle">→ {formatGp(flip.sellPrice)}</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">{formatQty(flip.qty)}</div>
        <div className="text-[11px] tabular text-subtle">{formatGp(flip.capitalUsed)} in</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-gain">{formatGp(flip.profitPerHour)}</div>
        <div className="text-[11px] tabular text-subtle">{formatGp(flip.profitOnce)} / cycle</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-gain">
          +{formatGp(flip.marginPerItem)}
        </div>
        <div className="text-[11px] tabular text-subtle">{formatPercent(flip.roiPct)} ROI</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <FillScore value={fillScore} />
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        {isHot ? (
          <Badge variant={flip.spikeRisk ? "warn" : "accent"} className="text-[10px]">
            {flip.spikeRisk ? "Risky" : "Hot"}
          </Badge>
        ) : (
          <ConfidencePill label={flip.confidenceLabel} score={flip.confidence} />
        )}
      </div>

      {/* Mobile trailing: GP/h + fill */}
      <div className="min-w-0 shrink-0 text-right lg:hidden">
        <div className="text-sm tabular font-semibold text-gain">{formatGp(flip.profitPerHour)}</div>
        <div className="mt-0.5">
          <FillScore value={fillScore} compact />
        </div>
      </div>
    </button>
  );
}

/** Colored 0–100 “Will it fill?” score for list rows. */
function FillScore({ value, compact }: { value: number; compact?: boolean }) {
  const tone =
    value >= 70 ? "text-gain" : value < 45 ? "text-warn" : "text-accent";
  const tip = METRIC_BY_ID.fillScore
    ? `${METRIC_BY_ID.fillScore.title}: ${METRIC_BY_ID.fillScore.short}\n${METRIC_BY_ID.fillScore.howToRead}`
    : "Will both buy and sell complete?";
  if (compact) {
    return (
      <span className={cn("tabular text-xs font-semibold", tone)} title={tip}>
        Fill {value}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-end" title={tip}>
      <div className={cn("text-sm tabular font-semibold", tone)}>{value}</div>
      <div className="text-[10px] text-subtle">/100 fill</div>
    </div>
  );
}

function ConfidencePill({
  label,
  score,
  compact,
}: {
  label: FlipOpportunity["confidenceLabel"];
  score: number;
  compact?: boolean;
}) {
  const variant =
    label === "High" || label === "Solid"
      ? "gain"
      : label === "OK" || label === "Hot"
        ? "accent"
        : "warn";
  return (
    <div className={cn(!compact && "flex flex-col items-end gap-0.5")}>
      <Badge variant={variant as "gain" | "accent" | "warn"} className="text-[10px]">
        {label}
      </Badge>
      {!compact && <span className="text-[10px] tabular text-subtle">{score}/100</span>}
    </div>
  );
}

function BottleneckBadge({ kind }: { kind: FlipOpportunity["bottleneck"] }) {
  if (kind === "none") return null;
  const label =
    kind === "capital" ? "GP capped" : kind === "buy_limit" ? "Limit capped" : "Volume capped";
  const variant = kind === "volume" ? "warn" : kind === "buy_limit" ? "accent" : "default";
  return (
    <Badge variant={variant as "warn" | "accent" | "default"} className="text-[10px] py-0">
      {label}
    </Badge>
  );
}
