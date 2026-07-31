import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, X, ExternalLink, Users, Package } from "lucide-react";
import {
  fetchItemHistory,
  type CatalogItem,
  type Lookback,
} from "@/lib/osrs/api";
import {
  formatAgeSec,
  formatGp,
  formatGpExact,
  formatPercent,
  formatVolume,
  geTax,
  flipMargin,
} from "@/lib/osrs/format";
import { formatQty, type FlipMode } from "@/lib/osrs/flip";
import { computeItemInsights } from "@/lib/osrs/itemInsights";
import { METRIC_BY_ID } from "@/lib/osrs/metricGuide";
import { useWatchlist } from "@/lib/osrs/watchlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemIcon } from "./ItemIcon";
import { PriceChart } from "./PriceChart";
import { FlipGuidePanel } from "./FlipGuide";
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
  const g = (id: string) => METRIC_BY_ID[id];
  const s = insights.standouts;

  const bottleneckLabel = flip
    ? flip.bottleneck === "none"
      ? "None"
      : flip.bottleneck === "buy_limit"
        ? "Buy limit"
        : flip.bottleneck === "volume"
          ? "Market trades"
          : "Your cash"
    : "—";

  /* ── Chart ── */
  const chartBlock = (
    <div className="min-w-0 rounded-xl border border-border bg-surface-2/30 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-fg">Price history</h3>
        <div className="flex gap-1 rounded-md border border-border bg-surface p-0.5">
          {LOOKBACKS.map((lb) => (
            <button
              key={lb}
              type="button"
              onClick={() => setLookback(lb)}
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors",
                lookback === lb ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
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
            fullPage ? "h-[min(36vh,280px)]" : chartTall ? "h-72" : "h-48",
          )}
        />
      ) : history.isError ? (
        <p className="text-sm text-loss">Could not load history.</p>
      ) : (
        <PriceChart
          points={history.data?.points ?? []}
          lookback={lookback}
          size={fullPage ? "tall" : chartTall ? "tall" : "normal"}
        />
      )}
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-subtle">
        {insights.midChangePct != null && (
          <span className="tabular" title="How much the middle price moved over this chart">
            Mid moved {formatPercent(insights.midChangePct)}
          </span>
        )}
        {insights.volatilityPct != null && (
          <span
            className="tabular"
            title="How much prices typically bounce — compare to your profit %"
          >
            Wobble ±{formatPercent(insights.volatilityPct).replace(/^\+/, "")}
          </span>
        )}
      </div>
    </div>
  );

  /** Quick-flip profit that matches the main table (model), not last panic print */
  const flipProfitGp = flip?.marginPerItem ?? insights.modelMargin ?? insights.netSpread;
  const flipProfitPct = flip?.roiPct ?? insights.modelMarginPct ?? insights.netSpreadPct;
  const modelDisagreesInstant =
    insights.modelMargin != null &&
    insights.modelMargin > 0 &&
    insights.netSpread != null &&
    insights.netSpread <= 0;

  const holdStyleLabel: Record<typeof insights.holdStyle, string> = {
    quick_flip: "Same-day flip",
    dip_buy: "Dip / turnaround",
    momentum: "Momentum hold",
    mixed: "Mixed signal",
    avoid: "Skip / tiny size",
  };

  /* ── Dual horizon: short-term flip vs longer hold (primary highlights) ── */
  const heroCards = (
    <div className={cn("grid gap-3", fullPage ? "lg:grid-cols-2" : "")}>
      {/* SHORT TERM */}
      <section className="rounded-xl border border-border bg-surface-2/40 p-3 sm:p-3.5">
        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg">
            Quick flip · same day
          </h3>
          <span className="text-[10px] text-subtle">Matches main table</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <HeroCard
            label="Flip profit / item"
            value={formatGp(flipProfitGp)}
            hint={
              flipProfitGp != null && flipProfitGp <= 0
                ? "No model edge after tax"
                : flipProfitPct != null
                  ? `${formatPercent(flipProfitPct).replace(/^\+/, "")} · avg prices`
                  : "After tax · model"
            }
            tone={flipProfitGp != null && flipProfitGp > 0 ? "gain" : "loss"}
            standout={s.modelMargin}
            why={g("netSpread")}
            size={fullPage ? "primary" : "sheet"}
          />
          <HeroCard
            label="Will it fill?"
            value={String(insights.fillScore)}
            unit="/100"
            hint={
              insights.fillScore >= 70
                ? "Both sides look workable"
                : insights.fillScore < 45
                  ? "Stuck-inventory risk"
                  : "Size carefully"
            }
            tone={
              insights.fillScore >= 70
                ? "gain"
                : insights.fillScore < 45
                  ? "warn"
                  : "sky"
            }
            standout={s.fillScore}
            why={g("fillScore")}
            size={fullPage ? "primary" : "sheet"}
          />
          <HeroCard
            label="GP per hour"
            value={flip ? formatGp(flip.profitPerHour) : "—"}
            hint={
              flip
                ? `${formatPercent(flip.roiPct)} per cycle`
                : "Set starting GP"
            }
            tone={flip && flip.profitPerHour > 0 ? "gain" : undefined}
            standout={s.gpHour}
            why={g("gpHour")}
            size="secondary"
          />
          <HeroCard
            label="What's stopping you"
            value={bottleneckLabel}
            hint={
              flip
                ? `Stack ${formatQty(flip.qty)} · ${formatGp(flip.capitalUsed)} in`
                : item.limit != null
                  ? `Buy limit ${formatQty(item.limit)}`
                  : "—"
            }
            standout={s.bottleneck}
            why={g("bottleneck")}
            size="secondary"
          />
        </div>
        {modelDisagreesInstant && (
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Last GE prints look worse than the table model —{" "}
            <span className="text-fg">sit both sides</span>, don’t force instant
            buy/sell. Instant edge:{" "}
            <span className="tabular text-loss">{formatGp(insights.netSpread)}</span>
          </p>
        )}
      </section>

      {/* LONGER TERM */}
      <section
        className={cn(
          "rounded-xl border p-3 sm:p-3.5",
          s.hold
            ? insights.holdStyle === "avoid"
              ? "border-warn/40 bg-warn/5"
              : "border-accent/40 bg-accent/5"
            : "border-border bg-surface-2/40",
        )}
      >
        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg">
            Hold / turnaround · longer
          </h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
              insights.holdStyle === "avoid" && "bg-warn/10 text-warn ring-warn/25",
              insights.holdStyle === "dip_buy" && "bg-accent/10 text-accent ring-accent/25",
              insights.holdStyle === "momentum" && "bg-gain/10 text-gain ring-gain/25",
              (insights.holdStyle === "quick_flip" || insights.holdStyle === "mixed") &&
                "bg-surface-2 text-muted ring-border",
            )}
          >
            {holdStyleLabel[insights.holdStyle]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <HeroCard
            label="Vs hour average"
            value={
              insights.vsHourAvgPct != null
                ? formatPercent(insights.vsHourAvgPct)
                : "—"
            }
            hint={
              insights.vsHourAvgPct == null
                ? "Need 1h averages"
                : insights.vsHourAvgPct <= -2
                  ? "Under hour mid · dip zone"
                  : insights.vsHourAvgPct >= 1.5
                    ? "Above hour mid · hot"
                    : "Near hour average"
            }
            tone={
              insights.vsHourAvgPct != null && insights.vsHourAvgPct <= -2
                ? "sky"
                : insights.vsHourAvgPct != null && insights.vsHourAvgPct >= 4
                  ? "warn"
                  : undefined
            }
            standout={insights.spikeVsAvg}
            size={fullPage ? "primary" : "sheet"}
          />
          <HeroCard
            label="Chart mid move"
            value={
              insights.midChangePct != null
                ? formatPercent(insights.midChangePct)
                : history.isLoading
                  ? "…"
                  : "—"
            }
            hint={
              insights.trend === "up"
                ? "Climbing on chart"
                : insights.trend === "down"
                  ? "Falling on chart"
                  : insights.trend === "range"
                    ? "Sideways · flip-friendly"
                    : "Pick a lookback below"
            }
            tone={
              insights.trend === "up"
                ? "gain"
                : insights.trend === "down"
                  ? "loss"
                  : undefined
            }
            size={fullPage ? "primary" : "sheet"}
          />
          <HeroCard
            label="If back to hour avg"
            value={
              insights.recoverToAvgGp != null
                ? formatGp(insights.recoverToAvgGp)
                : "—"
            }
            hint={
              insights.recoverToAvgGp != null
                ? "Rough / item after tax · not guaranteed"
                : "Only when trading under hour avg"
            }
            tone={
              insights.recoverToAvgGp != null && insights.recoverToAvgGp > 0
                ? "gain"
                : undefined
            }
            standout={insights.holdStyle === "dip_buy"}
            size="secondary"
          />
          <HeroCard
            label="Hold wobble"
            value={
              insights.volatilityPct != null
                ? `±${formatPercent(insights.volatilityPct).replace(/^\+/, "")}`
                : "—"
            }
            hint={
              insights.volatilityPct != null &&
              insights.recoverToAvgGp != null &&
              insights.modelMarginPct != null
                ? "Compare to your edge"
                : "Typical bounce on chart"
            }
            size="secondary"
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted">{insights.holdThesis}</p>
      </section>
    </div>
  );

  /* ── Last GE prints (secondary — typing aids, not the main P&L story) ── */
  const tradeTicket = (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-surface/30 p-2.5 sm:p-3",
        !insights.printFresh && "ring-1 ring-warn/25",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
          Last GE prints · for typing offers
        </h3>
        <span className="text-[10px] text-subtle">
          Not the same as table model when they disagree
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border/60 bg-surface-2/30">
        <TicketCell
          label="Buy now"
          sub="last low print"
          value={formatGpExact(flipBuy)}
          tip="Last price for an instant sell — often what you pay if you sit a buy"
          size="sm"
        />
        <TicketCell
          label="Sell now"
          sub="last high print"
          value={formatGpExact(flipSell)}
          tip="Last price for an instant buy — often what you aim for if you sit a sell"
          size="sm"
        />
        <TicketCell
          label="Instant edge"
          sub={`Tax −${formatGpExact(taxOnSell)}`}
          value={formatGpExact(lastMargin)}
          tip="Last-print sell − tax − buy. Can be red while the table is green — table uses hour averages."
          tone={
            lastMargin != null && lastMargin > 0
              ? "gain"
              : modelDisagreesInstant
                ? undefined
                : lastMargin != null && lastMargin <= 0
                  ? "loss"
                  : undefined
          }
          size="sm"
        />
      </div>
    </div>
  );

  /* ── Chips ── */
  const chipRow = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        Quick signals
      </span>
      {insights.chips.map((c) => {
        const guide = c.guideId ? METRIC_BY_ID[c.guideId] : undefined;
        const tip = [c.detail, guide ? `Why: ${guide.why}` : "", guide ? `Read: ${guide.howToRead}` : ""]
          .filter(Boolean)
          .join("\n\n");
        return (
          <span
            key={c.id}
            title={tip}
            className={cn(
              "inline-flex cursor-help items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
              c.tone === "gain" && "bg-gain/10 text-gain ring-gain/25",
              c.tone === "loss" && "bg-loss/10 text-loss ring-loss/25",
              c.tone === "warn" && "bg-warn/10 text-warn ring-warn/25",
              c.tone === "accent" && "bg-accent/10 text-accent ring-accent/25",
              c.tone === "muted" && "bg-surface-2 text-muted ring-border",
              c.standout && "ring-2",
            )}
          >
            {c.label}
          </span>
        );
      })}
    </div>
  );

  /* ── What to check ── */
  const checks = (
    <div className="rounded-xl border border-border bg-surface-2/30 p-4">
      <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-subtle">
        What to check in-game
      </h3>
      <ul className="space-y-2">
        {insights.checks.map((c, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug text-fg/90">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  /* ── Secondary details as mini tiles ── */
  const details = (
    <div className="rounded-xl border border-border bg-surface-2/30 p-4">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-subtle">
        More detail
      </h3>
      <dl className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        <Detail
          label="Trades last hour"
          value={formatVolume(item.volume1h)}
          tip="How many trades in the past hour (both sides)"
          standout={s.volume}
        />
        <Detail
          label="Trades last 5m"
          value={formatVolume(item.volume5m)}
          tip="How many times this item traded in the last 5 minutes — not “5 million GP,” just a trade count. Quiet last 5m means slow fills right now even if the hour looked fine."
          standout={insights.volumePace === "cooling" || insights.volumePace === "hot"}
          warn={insights.volumePace === "cooling"}
        />
        <Detail
          label="Buy / sell flow"
          value={`↑${formatVolume(insights.volHigh1h)} ↓${formatVolume(insights.volLow1h)}`}
          tip="↑ people paying top (insta-buy) · ↓ people dumping (insta-sell)"
        />
        <Detail
          label="Slower side"
          value={formatVolume(insights.volMin1h)}
          tip="The quieter of the two sides — this is your real flip capacity"
          standout={s.volume}
        />
        <Detail
          label="1h avg buy / sell"
          value={`${formatGp(item.avgLow1h)} / ${formatGp(item.avgHigh1h)}`}
          tip="Smoothed prices over the hour — less noisy than last print"
        />
        <Detail
          label="Model flip prices"
          value={
            insights.modelBuy != null && insights.modelSell != null
              ? `${formatGp(insights.modelBuy)} → ${formatGp(insights.modelSell)}`
              : "—"
          }
          tip="Average-based buy→sell the Safe table uses (after tax on the margin)"
          standout={s.modelMargin}
        />
        <Detail
          label="Instant edge"
          value={formatGp(insights.netSpread)}
          tip="Last-print profit after tax — can disagree with the table"
          standout={s.netSpread}
          warn={insights.netSpread != null && insights.netSpread <= 0}
        />
        <Detail
          label="Price freshness"
          value={`${formatAgeSec(insights.highAgeSec)} · ${formatAgeSec(insights.lowAgeSec)}`}
          tip="How old the last instant-buy and instant-sell trades are"
          standout={!insights.printFresh}
          warn={!insights.printFresh}
        />
        {flip && (
          <>
            <Detail
              label="Suggested prices"
              value={`${formatGp(flip.buyPrice)} → ${formatGp(flip.sellPrice)}`}
              tip="What the bankroll model uses (may use averages, not last print)"
            />
            <Detail
              label="One cycle · day"
              value={`${formatGp(flip.profitOnce)} · ${formatGp(flip.profitPerDay)}/d`}
              tip="One full buy+sell profit, and rough daily if you keep cycling"
            />
            <Detail
              label="Stack size"
              value={formatQty(flip.qty)}
              tip="How many the model sizes for your cash and limits — not a command to buy that many"
            />
          </>
        )}
        {item.limit != null && (
          <Detail
            label="Buy limit / 4h"
            value={formatQty(item.limit)}
            tip="GE buy limit window — starts on your first buy of this item"
          />
        )}
      </dl>
    </div>
  );

  /* ── Sheet / compact (mobile) ── */
  if (!fullPage) {
    return (
      <div className={cn(sheet ? "flex flex-col bg-surface" : "flex h-full min-h-0 flex-col")}>
        <Header
          item={item}
          watched={watched}
          isHot={isHot}
          flip={flip}
          fillScore={insights.fillScore}
          onClose={onClose}
          onToggleWatch={() => watchlist.toggle(item.id)}
          fullPage={false}
          showFillBadge
        />
        <div
          className={cn(
            "space-y-2.5 p-3",
            sheet ? "" : "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          )}
        >
          {dense && (
            <>
              <FlipGuidePanel defaultOpen={false} />
              {heroCards}
              {tradeTicket}
              {chipRow}
            </>
          )}
          {(chartTall || sheet) && chartBlock}
          {dense && (
            <>
              {checks}
              {details}
            </>
          )}
          {!dense && chartBlock}
          <Actions
            watched={watched}
            itemId={item.id}
            onToggle={() => watchlist.toggle(item.id)}
          />
        </div>
      </div>
    );
  }

  /* ── PC full-page: scannable hierarchy ── */
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <Header
        item={item}
        watched={watched}
        isHot={isHot}
        flip={flip}
        fillScore={insights.fillScore}
        onClose={onClose}
        onToggleWatch={() => watchlist.toggle(item.id)}
        fullPage
        showFillBadge={false}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
        <div className="mx-auto w-full max-w-[1200px] space-y-3">
          {/* 1) Big decision numbers */}
          {heroCards}

          {/* 2) Trade ticket — prices to type */}
          {tradeTicket}

          {/* 3) Signals */}
          {chipRow}

          {/* 4) Full-width chart */}
          {chartBlock}

          {/* 5) Checklist + more numbers */}
          <section className="grid gap-3 lg:grid-cols-2">
            {checks}
            {details}
          </section>

          <FlipGuidePanel defaultOpen={false} />

          <Actions
            watched={watched}
            itemId={item.id}
            onToggle={() => watchlist.toggle(item.id)}
          />
        </div>
      </div>

      {/* Sticky plan footer */}
      <footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur sm:px-5">
        <p className="mx-auto max-w-[1200px] text-sm text-muted">
          <span className="text-subtle">Plan · </span>
          buy{" "}
          <span className="text-base font-semibold tabular text-fg">
            {formatGp(flip?.buyPrice ?? insights.modelBuy ?? flipBuy)}
          </span>
          {" · "}sell{" "}
          <span className="text-base font-semibold tabular text-fg">
            {formatGp(flip?.sellPrice ?? insights.modelSell ?? flipSell)}
          </span>
          {flip && (
            <>
              {" · "}qty{" "}
              <span className="text-base font-semibold tabular text-fg">
                ≤{formatQty(flip.qty)}
              </span>
              {" · "}
              <span className="text-base font-semibold tabular text-gain">
                {formatGp(flip.profitPerHour)}/h
              </span>
            </>
          )}
        </p>
      </footer>
    </div>
  );
}

function Header({
  item,
  watched,
  isHot,
  flip,
  fillScore,
  onClose,
  onToggleWatch,
  fullPage,
  showFillBadge,
}: {
  item: CatalogItem;
  watched: boolean;
  isHot: boolean;
  flip: ReturnType<typeof computeItemInsights>["flip"];
  fillScore: number;
  onClose: () => void;
  onToggleWatch: () => void;
  fullPage: boolean;
  showFillBadge: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-start gap-3 border-b border-border p-3 sm:p-4",
        fullPage && "pad-top-safe",
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
            <p
              className={cn(
                "mt-0.5 text-xs text-muted",
                fullPage ? "line-clamp-1" : "line-clamp-2",
              )}
            >
              {item.examine}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
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
              Limit {item.limit.toLocaleString()} / 4h
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
          {showFillBadge && (
            <Badge
              variant={
                fillScore >= 70 ? "gain" : fillScore < 45 ? "warn" : "default"
              }
              title={METRIC_BY_ID.fillScore?.short}
            >
              Fill {fillScore}
            </Badge>
          )}
          <button
            type="button"
            onClick={onToggleWatch}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted hover:text-fg"
          >
            <Star className={cn("h-3 w-3", watched && "fill-current text-warn")} />
            {watched ? "Watching" : "Watch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Actions({
  watched,
  itemId,
  onToggle,
}: {
  watched: boolean;
  itemId: number;
  onToggle: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button variant={watched ? "secondary" : "default"} className="flex-1" onClick={onToggle}>
        <Star className={cn("h-4 w-4", watched && "fill-current text-warn")} />
        {watched ? "Watching" : "Watch"}
      </Button>
      <Button variant="secondary" asChild>
        <a
          href={`https://prices.runescape.wiki/osrs/item/${itemId}`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          Wiki
        </a>
      </Button>
    </div>
  );
}

function HeroCard({
  label,
  value,
  unit,
  hint,
  tone,
  standout,
  why,
  size = "primary",
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "gain" | "loss" | "warn" | "sky";
  standout?: boolean;
  why?: { title: string; short: string; why: string; howToRead: string };
  size?: "primary" | "secondary" | "sheet";
  className?: string;
}) {
  const title = why
    ? `${why.title}\n\n${why.short}\n\nWhy: ${why.why}\n\nHow to read: ${why.howToRead}`
    : undefined;
  return (
    <div
      title={title}
      className={cn(
        "min-w-0 cursor-help rounded-xl border transition-colors",
        size === "primary" && "min-h-[88px] px-4 py-3.5",
        size === "secondary" && "min-h-[88px] px-3 py-3",
        size === "sheet" && "px-3 py-2.5",
        standout
          ? tone === "warn" || tone === "loss"
            ? "border-warn/40 bg-warn/5 ring-2 ring-warn/30"
            : "border-accent/40 bg-accent/5 ring-2 ring-accent/30"
          : "border-border bg-surface-2/40 hover:border-border-strong",
        className,
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-semibold tabular tracking-tight",
            size === "primary" && "text-3xl xl:text-4xl",
            size === "secondary" && "text-2xl xl:text-3xl",
            size === "sheet" && "text-2xl",
            tone === "gain" && "text-gain",
            tone === "loss" && "text-loss",
            tone === "warn" && "text-warn",
            tone === "sky" && "text-accent",
            !tone && "text-fg",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-subtle">{unit}</span>}
      </div>
      {hint && (
        <div
          className={cn(
            "mt-0.5 line-clamp-2 leading-snug text-muted",
            size === "secondary" ? "text-[10px]" : "text-[11px]",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function TicketCell({
  label,
  sub,
  value,
  tip,
  tone,
  size = "lg",
}: {
  label: string;
  sub?: string;
  value: string;
  tip?: string;
  tone?: "gain" | "loss";
  size?: "lg" | "sm";
}) {
  return (
    <div title={tip} className={cn("cursor-help", size === "lg" ? "px-4 py-3" : "px-2 py-2")}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-semibold tabular tracking-tight",
          size === "lg" ? "text-2xl xl:text-3xl" : "text-lg",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
          !tone && "text-fg",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-subtle">{sub}</div>}
    </div>
  );
}

function Detail({
  label,
  value,
  tip,
  standout,
  warn,
}: {
  label: string;
  value: string;
  tip?: string;
  standout?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border px-2.5 py-2",
        standout
          ? warn
            ? "border-warn/40 bg-warn/5 ring-1 ring-warn/30"
            : "border-accent/40 bg-accent/5 ring-1 ring-accent/30"
          : "border-border/80 bg-surface/40",
      )}
      title={tip}
    >
      <dt className="truncate text-[10px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </dt>
      <dd className="text-base font-semibold tabular tracking-tight text-fg">{value}</dd>
    </div>
  );
}
