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
            title="How much prices typically wobble — compare to your profit %"
          >
            Wobble ±{formatPercent(insights.volatilityPct).replace(/^\+/, "")}
          </span>
        )}
      </div>
    </div>
  );

  /* ── Price rail (PC full page) ── */
  const priceRail = (
    <aside className="flex flex-col justify-center gap-4 rounded-xl border border-border bg-surface-2/40 p-4">
      <PriceBlock
        label="Buy now (low)"
        value={formatGpExact(flipBuy)}
        tip="Last price someone paid to sell instantly — often your entry if you buy sitting"
        tone="gain"
      />
      <PriceBlock
        label="Sell now (high)"
        value={formatGpExact(flipSell)}
        tip="Last price someone paid to buy instantly — often your exit if you sell sitting"
      />
      <div className="space-y-1.5 border-t border-border pt-3">
        <MiniLine
          label="Profit / item"
          value={formatGpExact(lastMargin)}
          tip="Sell now − tax − buy now"
        />
        <MiniLine
          label="Tax if you sell"
          value={`−${formatGpExact(taxOnSell)}`}
          tip="2% of sell price, max 5m per item"
        />
      </div>
    </aside>
  );

  /* ── Hero decision cards (big numbers) ── */
  const heroCards = (
    <div
      className={cn(
        "grid gap-3",
        fullPage ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
      )}
    >
      <HeroCard
        label="Profit / item"
        value={formatGp(insights.netSpread)}
        hint={
          insights.netSpreadPct != null
            ? `${formatPercent(insights.netSpreadPct).replace(/^\+/, "")} after tax`
            : "After GE tax"
        }
        tone={insights.netSpread != null && insights.netSpread > 0 ? "gain" : "loss"}
        standout={s.netSpread}
        why={g("netSpread")}
      />
      <HeroCard
        label="How easy fills"
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
          insights.fillScore >= 70 ? "gain" : insights.fillScore < 45 ? "warn" : "sky"
        }
        standout={s.fillScore}
        why={g("fillScore")}
      />
      <HeroCard
        label="GP per hour"
        value={flip ? formatGp(flip.profitPerHour) : "—"}
        hint={flip ? `${formatPercent(flip.roiPct)} per cycle` : "Set starting GP"}
        tone={flip && flip.profitPerHour > 0 ? "gain" : undefined}
        standout={s.gpHour}
        why={g("gpHour")}
      />
      <HeroCard
        label="What limits you"
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
      />
    </div>
  );

  /* ── Chips ── */
  const chipRow = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        Signals
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

  /* ── Secondary details (2-col cards, not full-width rows) ── */
  const details = (
    <div className="rounded-xl border border-border bg-surface-2/30 p-4">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-subtle">
        More numbers
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Detail
          label="Hourly trades"
          value={formatVolume(item.volume1h)}
          tip="Trades in the last hour (both sides)"
        />
        <Detail
          label="Last 5 min trades"
          value={formatVolume(item.volume5m)}
          tip="How many trades just happened — not a full hour total. Quiet last 5 min means slow fills right now even if the hour looked fine."
          standout={insights.volumePace === "cooling" || insights.volumePace === "hot"}
        />
        <Detail
          label="Buy / sell trades"
          value={`↑${formatVolume(insights.volHigh1h)} ↓${formatVolume(insights.volLow1h)}`}
          tip="↑ people paying top (insta-buy) · ↓ people dumping (insta-sell)"
        />
        <Detail
          label="Weak side (min)"
          value={formatVolume(insights.volMin1h)}
          tip="The slower of the two sides — this is your real flip capacity"
        />
        <Detail
          label="1h avg buy / sell"
          value={`${formatGp(item.avgLow1h)} / ${formatGp(item.avgHigh1h)}`}
          tip="Smoothed prices over the hour — less noisy than last print"
        />
        <Detail
          label="Data age"
          value={`Buy ${formatAgeSec(insights.highAgeSec)} · Sell ${formatAgeSec(insights.lowAgeSec)}`}
          tip="How old the last instant-buy and instant-sell trades are"
        />
        {flip && (
          <>
            <Detail
              label="Suggested prices"
              value={`${formatGp(flip.buyPrice)} → ${formatGp(flip.sellPrice)}`}
              tip="What the bankroll model uses (may use averages, not last print)"
            />
            <Detail
              label="One cycle · day est."
              value={`${formatGp(flip.profitOnce)} · ${formatGp(flip.profitPerDay)}/d`}
              tip="One full buy+sell profit, and rough daily if you keep cycling"
            />
            <Detail
              label="Stack size"
              value={formatQty(flip.qty)}
              tip="How many the model sizes for your bankroll and limits"
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

  /* ── Sheet / compact (mobile) uses same heroes, stacked ── */
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
        />
        <div
          className={cn(
            "space-y-3 p-3",
            sheet ? "" : "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          )}
        >
          {dense && (
            <>
              <FlipGuidePanel defaultOpen={false} />
              {heroCards}
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
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {/* 1) Big decision numbers first */}
        {heroCards}

        {/* 2) Signals */}
        {chipRow}

        {/* 3) Chart + live prices side by side */}
        <section className="grid gap-3 lg:grid-cols-[1fr_200px]">
          {chartBlock}
          {priceRail}
        </section>

        {/* 4) Checklist + more numbers */}
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

      {/* Sticky plan footer */}
      <footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur sm:px-5">
        <p className="text-sm text-muted">
          <span className="text-subtle">Plan · </span>
          buy{" "}
          <span className="font-semibold tabular text-fg">
            {formatGp(flip?.buyPrice ?? flipBuy)}
          </span>
          {" · "}sell{" "}
          <span className="font-semibold tabular text-fg">
            {formatGp(flip?.sellPrice ?? flipSell)}
          </span>
          {flip && (
            <>
              {" · "}qty{" "}
              <span className="font-semibold tabular text-fg">≤{formatQty(flip.qty)}</span>
              {" · "}
              <span className="font-semibold tabular text-gain">
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
}: {
  item: CatalogItem;
  watched: boolean;
  isHot: boolean;
  flip: ReturnType<typeof computeItemInsights>["flip"];
  fillScore: number;
  onClose: () => void;
  onToggleWatch: () => void;
  fullPage: boolean;
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
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.examine}</p>
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
          <Badge
            variant={
              fillScore >= 70 ? "gain" : fillScore < 45 ? "warn" : "default"
            }
            title={METRIC_BY_ID.fillScore?.short}
          >
            Fill {fillScore}
          </Badge>
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
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "gain" | "loss" | "warn" | "sky";
  standout?: boolean;
  why?: { title: string; short: string; why: string; howToRead: string };
}) {
  const title = why
    ? `${why.title}\n\n${why.short}\n\nWhy: ${why.why}\n\nHow to read: ${why.howToRead}`
    : undefined;
  return (
    <div
      title={title}
      className={cn(
        "cursor-help rounded-xl border px-4 py-3 transition-colors",
        standout
          ? tone === "warn" || tone === "loss"
            ? "border-warn/40 bg-warn/5 ring-2 ring-warn/30"
            : "border-accent/40 bg-accent/5 ring-2 ring-accent/30"
          : "border-border bg-surface-2/40 hover:border-border-strong",
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-2xl font-semibold tabular tracking-tight xl:text-3xl",
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
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{hint}</div>
      )}
    </div>
  );
}

function PriceBlock({
  label,
  value,
  tip,
  tone,
}: {
  label: string;
  value: string;
  tip?: string;
  tone?: "gain";
}) {
  return (
    <div title={tip} className="cursor-help">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-2xl font-semibold tabular tracking-tight",
          tone === "gain" ? "text-gain" : "text-fg",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniLine({
  label,
  value,
  tip,
}: {
  label: string;
  value: string;
  tip?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2" title={tip}>
      <span className="text-[10px] uppercase tracking-wide text-subtle">{label}</span>
      <span className="text-sm font-medium tabular text-fg">{value}</span>
    </div>
  );
}

function Detail({
  label,
  value,
  tip,
  standout,
}: {
  label: string;
  value: string;
  tip?: string;
  standout?: boolean;
}) {
  return (
    <div
      className={cn("min-w-0", standout && "rounded-md ring-1 ring-accent/40 px-1.5 py-0.5")}
      title={tip}
    >
      <dt className="truncate text-[10px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </dt>
      <dd className="text-sm font-semibold tabular tracking-tight text-fg">{value}</dd>
    </div>
  );
}
