import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, X, ExternalLink, Users, Package } from "lucide-react";
import {
  fetchItemHistory,
  type CatalogItem,
  type Lookback,
} from "@/lib/osrs/api";
import {
  formatGp,
  formatGpExact,
  formatPercent,
  formatVolume,
  geTax,
  flipMargin,
} from "@/lib/osrs/format";
import { formatQty, type FlipMode } from "@/lib/osrs/flip";
import { computeItemInsights } from "@/lib/osrs/itemInsights";
import { useWatchlist } from "@/lib/osrs/watchlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemIcon } from "./ItemIcon";
import { PriceChart } from "./PriceChart";
import { cn } from "@/lib/utils";

const LOOKBACKS: Lookback[] = ["6h", "24h", "7d", "30d"];

export function ItemDetail({
  item,
  onClose,
  bankroll = 0,
  flipMode = "safe",
  chartTall = false,
  fullPage = false,
  sheet = false,
}: {
  item: CatalogItem;
  onClose: () => void;
  bankroll?: number;
  flipMode?: FlipMode;
  chartTall?: boolean;
  fullPage?: boolean;
  sheet?: boolean;
}) {
  const [lookback, setLookback] = useState<Lookback>("24h");
  const watchlist = useWatchlist();
  const watched = watchlist.ids.includes(item.id);
  const isHot = flipMode === "hot";
  const dense = fullPage || sheet;
  const chartSize = fullPage ? "full" : chartTall ? "tall" : "normal";

  const history = useQuery({
    queryKey: ["history", item.id, lookback],
    queryFn: () => fetchItemHistory({ data: { id: item.id, lookback } }),
    staleTime: 60_000,
  });

  const insights = useMemo(
    () =>
      computeItemInsights(item, {
        bankroll,
        flipMode,
        history: history.data?.points ?? [],
      }),
    [item, bankroll, flipMode, history.data?.points],
  );

  const flip = insights.flip;
  const flipBuy =
    item.low != null && item.high != null
      ? Math.min(item.low, item.high)
      : (item.low ?? item.high);
  const flipSell =
    item.low != null && item.high != null
      ? Math.max(item.low, item.high)
      : (item.high ?? item.low);
  const taxOnSell = flipSell != null ? geTax(flipSell) : 0;
  const lastMargin = flipMargin(item.high, item.low);

  const chartBlock = (
    <div className={cn(fullPage && "min-w-0")}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-fg">Price history</h3>
        <div className="flex gap-1 rounded-md border border-border bg-surface-2 p-0.5">
          {LOOKBACKS.map((lb) => (
            <button
              key={lb}
              type="button"
              onClick={() => setLookback(lb)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                lookback === lb
                  ? "bg-surface-3 text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              {lb}
            </button>
          ))}
        </div>
      </div>
      {history.isLoading ? (
        <Skeleton
          className={cn(
            "w-full rounded-lg",
            fullPage ? "h-[min(52vh,32rem)]" : chartTall ? "h-80" : "h-48",
          )}
        />
      ) : history.isError ? (
        <p className="text-sm text-loss">Could not load history.</p>
      ) : (
        <PriceChart
          points={history.data?.points ?? []}
          lookback={lookback}
          size={chartSize}
        />
      )}
      {(insights.midChangePct != null || insights.volatilityPct != null) && (
        <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-subtle">
          {insights.midChangePct != null && (
            <span className="tabular">
              Mid Δ {insights.midChangePct >= 0 ? "+" : ""}
              {insights.midChangePct.toFixed(1)}%
            </span>
          )}
          {insights.volatilityPct != null && (
            <span className="tabular">σ {insights.volatilityPct.toFixed(2)}%</span>
          )}
          <span className="text-muted">Lookback: {lookback}</span>
        </div>
      )}
    </div>
  );

  const decisionStrip = (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
      <Mini
        label="Net spread"
        value={formatGp(insights.netSpread)}
        sub={
          insights.netSpreadPct != null
            ? `${insights.netSpreadPct.toFixed(2)}% after tax`
            : "After tax"
        }
        tone={
          insights.netSpread != null && insights.netSpread > 0 ? "gain" : "loss"
        }
      />
      <Mini
        label="Fill score"
        value={`${insights.fillScore}`}
        sub={insights.fillDetail}
        tone={
          insights.fillScore >= 70
            ? "gain"
            : insights.fillScore < 45
              ? "warn"
              : undefined
        }
      />
      <Mini
        label="Est. GP / hour"
        value={flip ? formatGp(flip.profitPerHour) : "—"}
        sub={flip ? `${formatPercent(flip.roiPct)} ROI` : "Set bankroll"}
        tone="gain"
      />
      <Mini
        label="Flip qty"
        value={flip ? formatQty(flip.qty) : "—"}
        sub={flip ? `${formatGp(flip.capitalUsed)} capital` : "—"}
      />
      <Mini
        label="1h volume"
        value={formatVolume(item.volume1h)}
        sub={`${formatVolume(insights.volHigh1h)}↑ ${formatVolume(insights.volLow1h)}↓ · min ${formatVolume(insights.volMin1h)}`}
      />
      <Mini
        label="Bottleneck"
        value={
          flip
            ? flip.bottleneck === "none"
              ? "None"
              : flip.bottleneck === "buy_limit"
                ? "Buy limit"
                : flip.bottleneck === "volume"
                  ? "Volume"
                  : "Capital"
            : "—"
        }
        sub={item.limit != null ? `Limit ${formatQty(item.limit)}` : "No limit data"}
      />
    </div>
  );

  const chipRow = (
    <div className="flex flex-wrap gap-1.5">
      {insights.chips.map((c) => (
        <span
          key={c.id}
          title={c.detail}
          className={cn(
            "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
            c.tone === "gain" && "border-gain/30 bg-gain/10 text-gain",
            c.tone === "loss" && "border-loss/30 bg-loss/10 text-loss",
            c.tone === "warn" && "border-warn/30 bg-warn/10 text-warn",
            c.tone === "accent" && "border-accent/30 bg-accent/10 text-accent",
            c.tone === "muted" && "border-border bg-surface-2 text-muted",
          )}
        >
          {c.label}
        </span>
      ))}
    </div>
  );

  const checks = (
    <div className="rounded-md border border-border bg-surface-2/40 px-2.5 py-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-subtle">
        What to check
      </div>
      <ul className="space-y-1 text-[11px] leading-snug text-muted">
        {insights.checks.map((c, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-subtle">•</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const denseTable = (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-left text-[11px]">
        <tbody className="divide-y divide-border">
          <Row k="Flip buy / sell" v={`${formatGpExact(flipBuy)} → ${formatGpExact(flipSell)}`} />
          <Row k="Tax on sell" v={`−${formatGpExact(taxOnSell)}`} />
          <Row k="Net margin / item" v={formatGpExact(lastMargin)} />
          <Row
            k="1h avg L / H"
            v={`${formatGp(item.avgLow1h)} / ${formatGp(item.avgHigh1h)}`}
          />
          <Row
            k="5m volume"
            v={`${formatVolume(item.volume5m)} (${formatVolume(item.volHigh5m)}↑ ${formatVolume(item.volLow5m)}↓)`}
          />
          <Row
            k="Print age"
            v={`H ${insights.highAgeSec != null ? `${Math.round(insights.highAgeSec / 60)}m` : "—"} · L ${insights.lowAgeSec != null ? `${Math.round(insights.lowAgeSec / 60)}m` : "—"}`}
          />
          {flip && (
            <>
              <Row k="Model prices" v={`${formatGp(flip.buyPrice)} → ${formatGp(flip.sellPrice)} (${flip.priceSource})`} />
              <Row k="Once / day est." v={`${formatGp(flip.profitOnce)} · ${formatGp(flip.profitPerDay)}/d`} />
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      className={cn(
        sheet ? "flex flex-col bg-surface" : "flex h-full min-h-0 flex-col",
        fullPage && "bg-surface",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 border-b border-border p-3 sm:p-4",
          fullPage && "shrink-0 pad-top-safe",
          sheet && "shrink-0",
        )}
      >
        <ItemIcon icon={item.icon} name={item.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2
                className={cn(
                  "font-semibold tracking-tight text-fg",
                  fullPage ? "text-xl sm:text-2xl" : "truncate text-lg",
                )}
              >
                {item.name}
              </h2>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.examine}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.members ? (
              <Badge variant="accent">
                <Users className="mr-1 h-3 w-3" />
                Members
              </Badge>
            ) : (
              <Badge>F2P</Badge>
            )}
            {item.limit != null && (
              <Badge>
                <Package className="mr-1 h-3 w-3" />
                Limit {item.limit.toLocaleString()}
              </Badge>
            )}
            {isHot ? (
              <Badge variant="warn">Hot model</Badge>
            ) : flip ? (
              <Badge
                variant={
                  flip.confidenceLabel === "High" || flip.confidenceLabel === "Solid"
                    ? "gain"
                    : flip.confidenceLabel === "OK"
                      ? "accent"
                      : "warn"
                }
              >
                {flip.confidenceLabel} trust
              </Badge>
            ) : null}
            <Badge className="tabular">ID {item.id}</Badge>
            <Badge
              variant={
                insights.fillScore >= 70
                  ? "gain"
                  : insights.fillScore < 45
                    ? "warn"
                    : "default"
              }
            >
              Fill {insights.fillScore}
            </Badge>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "p-3 sm:p-4",
          dense ? "space-y-3" : "space-y-5",
          sheet ? "" : "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
      >
        {/* Dense intelligence first on full page / sheet */}
        {(fullPage || sheet) && (
          <>
            {decisionStrip}
            {chipRow}
            {checks}
          </>
        )}

        {/* Chart dominates full page */}
        {(fullPage || chartTall) && chartBlock}

        {!(fullPage || sheet) && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Flip buy (low)" value={formatGp(flipBuy)} sub="Entry" tone="gain" />
            <Stat label="Flip sell (high)" value={formatGp(flipSell)} sub="Exit" />
            <Stat
              label="1h avg L/H"
              value={`${formatGp(item.avgLow1h)} / ${formatGp(item.avgHigh1h)}`}
            />
            <Stat
              label="Sold 1h"
              value={formatVolume(item.volume1h)}
              sub={`${formatVolume(item.volHigh1h)}↑ ${formatVolume(item.volLow1h)}↓`}
            />
          </div>
        )}

        {(fullPage || sheet) && denseTable}

        {!(fullPage || chartTall) && chartBlock}

        {!(fullPage || sheet) && bankroll > 0 && flip && (
          <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">
              {isHot ? "Hot" : "Safe"} model · {formatGp(bankroll)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="GP / hour" value={formatGp(flip.profitPerHour)} tone="gain" />
              <Stat label="Qty" value={formatQty(flip.qty)} />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={watched ? "secondary" : "default"}
            className="flex-1"
            onClick={() => watchlist.toggle(item.id)}
          >
            <Star className={cn("h-4 w-4", watched && "fill-current text-warn")} />
            {watched ? "Watching" : "Watch"}
          </Button>
          <Button variant="secondary" asChild>
            <a
              href={`https://prices.runescape.wiki/osrs/item/${item.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Wiki
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "gain" | "loss" | "warn";
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface-2/50 px-2 py-1.5">
      <div className="truncate text-[10px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </div>
      <div
        className={cn(
          "truncate text-sm font-semibold tabular",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
          tone === "warn" && "text-warn",
          !tone && "text-fg",
        )}
      >
        {value}
      </div>
      {sub && <div className="line-clamp-2 text-[10px] leading-tight text-muted">{sub}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="bg-surface/40">
      <th className="w-[40%] px-2.5 py-1.5 font-medium text-muted">{k}</th>
      <td className="px-2.5 py-1.5 tabular text-fg">{v}</td>
    </tr>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-base font-semibold tabular",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
          !tone && "text-fg",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}
