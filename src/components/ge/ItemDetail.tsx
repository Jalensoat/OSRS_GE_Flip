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
import { computeFlip, formatQty, type FlipMode } from "@/lib/osrs/flip";
import { useWatchlist } from "@/lib/osrs/watchlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemIcon } from "./ItemIcon";
import { PriceChart } from "./PriceChart";
import { cn } from "@/lib/utils";
import { useState } from "react";

const LOOKBACKS: Lookback[] = ["6h", "24h", "7d", "30d"];

export function ItemDetail({
  item,
  onClose,
  bankroll = 0,
  flipMode = "safe",
  chartTall = false,
}: {
  item: CatalogItem;
  onClose: () => void;
  bankroll?: number;
  flipMode?: FlipMode;
  /** Wider desktop pane — taller price graph */
  chartTall?: boolean;
}) {
  const [lookback, setLookback] = useState<Lookback>("24h");
  const watchlist = useWatchlist();
  const watched = watchlist.ids.includes(item.id);
  const flip = bankroll > 0 ? computeFlip(item, bankroll, flipMode) : null;
  const isHot = flipMode === "hot";

  const history = useQuery({
    queryKey: ["history", item.id, lookback],
    queryFn: () => fetchItemHistory({ data: { id: item.id, lookback } }),
    staleTime: 60_000,
  });

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-border p-4 sm:p-5">
        <ItemIcon icon={item.icon} name={item.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-fg">
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Chart first on tall desktop so recent sales are easy to read */}
        {chartTall && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
              <Skeleton className="h-80 w-full rounded-lg" />
            ) : history.isError ? (
              <p className="text-sm text-loss">Could not load history.</p>
            ) : (
              <PriceChart
                points={history.data?.points ?? []}
                lookback={lookback}
                tall
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Flip buy (low)"
            value={formatGp(flipBuy)}
            sub="Your entry bid side"
            tone="gain"
          />
          <Stat
            label="Flip sell (high)"
            value={formatGp(flipSell)}
            sub="Your exit offer side"
          />
          <Stat
            label="1h avg low / high"
            value={
              item.avgHigh1h != null || item.avgLow1h != null
                ? `${formatGp(item.avgLow1h)} / ${formatGp(item.avgHigh1h)}`
                : "—"
            }
            sub="Buy avg · sell avg"
          />
          <Stat
            label="Sold last hour"
            value={formatVolume(item.volume1h)}
            sub={`${formatVolume(item.volHigh1h)} high · ${formatVolume(item.volLow1h)} low`}
          />
        </div>

        <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Trade flow
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[11px] text-subtle">1h total</div>
              <div className="text-sm tabular font-semibold text-fg">
                {formatVolume(item.volume1h)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-subtle">5m total</div>
              <div className="text-sm tabular font-semibold text-fg">
                {formatVolume(item.volume5m)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-subtle">Buy limit</div>
              <div className="text-sm tabular font-semibold text-fg">
                {item.limit != null ? formatQty(item.limit) : "—"}
              </div>
            </div>
          </div>
        </div>

        {bankroll > 0 && (
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">
              {isHot ? "Hot flip model" : "Safe flip model"} · {formatGp(bankroll)} bankroll
            </div>
            {flip ? (
              <>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Stat
                    label="Buy → sell"
                    value={`${formatGp(flip.buyPrice)} → ${formatGp(flip.sellPrice)}`}
                    sub={
                      flip.priceSource === "last_trade"
                        ? "Last trade prints"
                        : flip.priceSource === "blended"
                          ? "1h + 5m averages"
                          : flip.priceSource === "1h_avg"
                            ? "1h trade averages"
                            : "5m averages"
                    }
                  />
                  <Stat
                    label="Margin / item"
                    value={formatGp(flip.marginPerItem)}
                    sub="After 2% tax"
                    tone="gain"
                  />
                  <Stat
                    label="Flip qty"
                    value={formatQty(flip.qty)}
                    sub={`${formatVolume(flip.soldTotal1h)} sold/h market`}
                  />
                  <Stat
                    label="Est. GP / hour"
                    value={formatGp(flip.profitPerHour)}
                    sub={`${formatPercent(flip.roiPct)} ROI / fill`}
                    tone="gain"
                  />
                </div>
                {flip.spikeRisk && (
                  <p className="text-[11px] text-warn leading-relaxed">
                    {isHot
                      ? "Last trade looks spiky vs 1h averages — fills may not hold. Check sold volume before committing."
                      : "Last single trade looks spiky vs averages — safe model ignored it."}
                  </p>
                )}
                <p className="text-[11px] text-subtle leading-relaxed">
                  Est. once:{" "}
                  <span className="tabular text-gain font-medium">
                    {formatGp(flip.profitOnce)}
                  </span>
                  {" · "}
                  day:{" "}
                  <span className="tabular text-gain font-medium">
                    {formatGp(flip.profitPerDay)}
                  </span>
                  .
                </p>
              </>
            ) : (
              <p className="text-xs text-muted py-2">
                {isHot
                  ? "No positive last-trade margin for this bankroll right now."
                  : "Not recommended on the safe model — needs stable average margin and solid two-sided volume."}
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 space-y-2 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted mb-1">
            Last-trade snapshot
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Wiki last low (flip buy)</span>
            <span className="tabular text-fg">{formatGpExact(item.low)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Wiki last high (flip sell)</span>
            <span className="tabular text-fg">{formatGpExact(item.high)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Tax on flip sell</span>
            <span className="tabular text-loss">−{formatGpExact(taxOnSell)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Net margin / item</span>
            <span
              className={cn(
                "tabular font-medium",
                lastMargin != null && lastMargin > 0
                  ? "text-gain"
                  : lastMargin != null && lastMargin < 0
                    ? "text-loss"
                    : "text-fg",
              )}
            >
              {formatGpExact(lastMargin)}
            </span>
          </div>
          <p className="pt-1 text-[11px] text-subtle leading-relaxed">
            Buy column = lower price (your entry). Sell column = higher price (your exit).
            Tax is 2% on the sell, capped at 5m.
          </p>
        </div>

        {/* Chart below on mobile / compact panes */}
        {!chartTall && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : history.isError ? (
              <p className="text-sm text-loss">Could not load history.</p>
            ) : (
              <PriceChart points={history.data?.points ?? []} lookback={lookback} />
            )}
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
