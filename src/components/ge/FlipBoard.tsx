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
import { ItemIcon } from "./ItemIcon";
import { SortableTh } from "./SortableTh";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Timer, Coins, ShieldCheck, Activity, Flame } from "lucide-react";

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

  return (
    <div className="min-w-0 w-full max-w-full space-y-3 overflow-x-hidden p-2 sm:p-3">
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard
          icon={isHot ? <Flame className="h-3.5 w-3.5" /> : <Coins className="h-3.5 w-3.5" />}
          label="Best / hour"
          value={formatGp(best.profitPerHour)}
          sub={best.item.name}
        />
        <SummaryCard
          icon={<Activity className="h-3.5 w-3.5" />}
          label="1h trades (best)"
          value={formatVolume(best.soldTotal1h)}
          sub={`${formatVolume(best.soldBuySide1h)} buy · ${formatVolume(best.soldSellSide1h)} sell`}
        />
        <SummaryCard
          icon={isHot ? <Flame className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          label={isHot ? "Mode" : "Confidence"}
          value={isHot ? "Hot" : best.confidenceLabel}
          sub={isHot ? "Last-trade prices" : `${best.confidence}/100 · avg prices`}
        />
        <SummaryCard
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Best / day est."
          value={formatGp(best.profitPerDay)}
          sub="Limit + volume capped"
        />
      </div>

      <div
        className={cn(
          "min-w-0 rounded-md border px-3 py-2 text-xs leading-relaxed",
          isHot
            ? "border-warn/30 bg-warn/5 text-muted"
            : "border-border bg-surface text-muted",
        )}
      >
        {isHot ? (
          <>
            <span className="text-warn font-medium">Higher risk. </span>
            Uses <span className="text-fg">latest high/low trades</span> (same style as before) so
            fast movers like thin-margin pumps can appear — but a single print can reverse. Always
            check <span className="text-fg">Sold 1h</span> and 5m volume before filling.
          </>
        ) : (
          <>
            Prices use <span className="text-fg">1h / 5m trade averages</span>, not the last single
            offer — so one pump trade can't invent a fake margin. Ranked by{" "}
            <span className="text-fg">GP/hour × volume confidence</span>. Min{" "}
            <span className="text-fg">12 trades/side/hour</span> required. Click column headers to
            sort.
          </>
        )}
      </div>

      {/* Mobile sort chips for numeric columns */}
      <div className="flex flex-wrap gap-1 lg:hidden">
        {(
          [
            ["gpHour", "GP/hour"],
            ["sold1h", "Sold 1h"],
            ["margin", "Margin"],
            ["roi", "ROI"],
            ["qty", "Qty"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSort(key)}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-medium",
              sortKey === key
                ? "border-border-strong bg-surface-2 text-fg"
                : "border-border bg-surface text-muted",
            )}
          >
            {label}
            {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>

      <div className="hidden min-w-0 lg:grid grid-cols-[2rem_minmax(0,1.5fr)_repeat(6,minmax(0,1fr))] gap-2 border-b border-border px-2.5 pb-2">
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
          label="ROI"
          active={sortKey === "roi"}
          dir={sortDir}
          onClick={() => onSort("roi")}
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
    <div className="min-w-0 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate text-base font-semibold tabular tracking-tight text-fg sm:text-lg">
        {value}
      </div>
      <div className="mt-0.5 truncate text-xs text-subtle">{sub}</div>
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full min-w-0 max-w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-2.5 text-left transition-colors lg:grid-cols-[2rem_minmax(0,1.5fr)_repeat(6,minmax(0,1fr))]",
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
        </div>
      </div>

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
        <div className="text-[11px] tabular text-subtle">{formatGp(flip.profitOnce)} / fill</div>
      </div>
      <div className="hidden min-w-0 text-right lg:block">
        <div className="text-sm tabular font-medium text-fg">{formatPercent(flip.roiPct)}</div>
        <div className="text-[11px] text-subtle">/ fill</div>
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

      <div className="min-w-0 shrink-0 text-right lg:hidden">
        <div className="text-sm tabular font-semibold text-gain">{formatGp(flip.profitPerHour)}</div>
        {isHot ? (
          <Badge variant={flip.spikeRisk ? "warn" : "accent"} className="mt-0.5 text-[10px]">
            {flip.spikeRisk ? "Risky" : "Hot"}
          </Badge>
        ) : (
          <ConfidencePill label={flip.confidenceLabel} score={flip.confidence} compact />
        )}
      </div>
    </button>
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
