/**
 * Item intelligence metrics for Flip Lab full-page / sheet.
 * Grounded in Phase 0 research (microstructure, liquidity regimes,
 * volatility, mean-reversion, asymmetry). Pure functions only.
 */
import type { CatalogItem, TimeseriesPoint } from "./api";
import { formatGp, formatPercent, geTax, flipMargin } from "./format";
import {
  computeFlip,
  modelFlipEdge,
  type FlipMode,
  type FlipOpportunity,
} from "./flip";

export type RegimeLabel = "thick" | "mixed" | "thin" | "spike" | "drying" | "unknown";
export type TrendLabel = "range" | "up" | "down" | "unknown";
export type ChipTone = "gain" | "loss" | "warn" | "muted" | "accent";
/** Suggested play style at a glance */
export type HoldStyle = "quick_flip" | "dip_buy" | "momentum" | "mixed" | "avoid";

/** Sit / target prices for a plan (type these in the GE). */
export type PricePlan = {
  buy: number;
  sell: number;
  /** Short label e.g. "Reliable sits (avg fills)" */
  label: string;
  /** One-line how to use */
  hint: string;
  /**
   * Why buy isn’t the chart floor (critical for GE).
   * Chart lows are often thin dumps — sits use where volume actually cleared.
   */
  whyNotChartLow?: string;
  /** Lowest mid/low seen on the fixed signal window (context only) */
  chartLow?: number | null;
  chartHigh?: number | null;
  source?: string;
  /** When true, UI can collapse “same as quick flip” instead of duplicating */
  mirrorsQuickPlan?: boolean;
};

/**
 * Always-filled hold signal — replaces sparse “if back to hour avg”.
 * Big-picture: dip, premium, flip-instead, or chart context.
 */
export type HoldEdge = {
  /** Card title */
  label: string;
  /** Main number as display string (already formatted for variety of units) */
  value: string;
  hint: string;
  tone: ChipTone;
  standout: boolean;
  /** metricGuide id */
  guideId: string;
};

export type InsightChip = {
  id: string;
  label: string;
  detail: string;
  tone: ChipTone;
  /** Emphasize in UI (risk or opportunity stand-out) */
  standout?: boolean;
  /** Guide id for "why it matters" */
  guideId?: string;
};

export type ItemInsights = {
  /** Instant-print proxy spread after tax (last GE trades — can disagree with table) */
  netSpread: number | null;
  netSpreadPct: number | null;
  /**
   * Average-based flip edge (same idea as Safe main table).
   * Prefer this for “quick flip” heroes so green list ≠ red drawer.
   */
  modelMargin: number | null;
  modelMarginPct: number | null;
  modelBuy: number | null;
  modelSell: number | null;
  /** Last mid vs 1h avg mid (%). Negative = trading under the hour. */
  vsHourAvgPct: number | null;
  /**
   * Rough per-item GP if mid climbs back to the 1h average
   * (buy near last low, sell near avg mid after tax). Speculative.
   */
  recoverToAvgGp: number | null;
  /** Same-day sit plan (table-aligned when possible) */
  quickPlan: PricePlan | null;
  /** Longer-horizon entry / target plan */
  holdPlan: PricePlan | null;
  /** Contextual hold card (never just “—” when we have any market data) */
  holdEdge: HoldEdge;
  holdStyle: HoldStyle;
  holdThesis: string;
  /** Seconds since last high / low print */
  highAgeSec: number | null;
  lowAgeSec: number | null;
  printFresh: boolean;
  /** Two-sided liquidity */
  volHigh1h: number;
  volLow1h: number;
  volMin1h: number;
  volImbalance: number | null;
  regime: RegimeLabel;
  regimeDetail: string;
  /** 5m vs 1h volume pace */
  volumePace: "hot" | "cooling" | "stable" | "unknown";
  /** Mid path from timeseries */
  trend: TrendLabel;
  midChangePct: number | null;
  volatilityPct: number | null;
  /** Edge quality: after-tax margin vs local vol */
  edgeVsVol: "strong" | "ok" | "weak" | "unknown";
  /** Spike: last print vs 1h avg */
  spikeVsAvg: boolean;
  spikeDetail: string | null;
  /** 0–100 fill realism — catalog-only (regime, freshness, min-side vol, imbalance, spike vs 1h) */
  fillScore: number;
  fillDetail: string;
  /** Flip model (if bankroll) */
  flip: FlipOpportunity | null;
  chips: InsightChip[];
  checks: string[];
  /** Which decision minis should ring/highlight */
  standouts: {
    fillScore: boolean;
    netSpread: boolean;
    modelMargin: boolean;
    hold: boolean;
    gpHour: boolean;
    volume: boolean;
    bottleneck: boolean;
  };
};

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function midOf(high: number | null | undefined, low: number | null | undefined): number | null {
  if (high != null && low != null) return (high + low) / 2;
  return high ?? low ?? null;
}

function ageSec(ts: number | null | undefined): number | null {
  if (ts == null || ts <= 0) return null;
  return Math.max(0, nowSec() - ts);
}

function regimeFromVolumes(volMin: number, volTotal: number, vol5m: number): RegimeLabel {
  if (volTotal <= 0 && vol5m <= 0) return "unknown";
  if (volMin >= 40 && volTotal >= 100) return "thick";
  if (volMin >= 12 && volTotal >= 30) return "mixed";
  if (vol5m >= 20 && volTotal > 0 && vol5m * 12 > volTotal * 1.8) return "spike";
  if (vol5m < 3 && volTotal >= 20) return "drying";
  if (volMin < 8) return "thin";
  return "mixed";
}

/**
 * Mid path / volatility over a point series.
 * For Quick signals + hold thesis, always pass a **fixed** lookback (24h).
 * Chart UI may call this with the user-selected window for footer stats only.
 */
export function chartWindowStats(points: TimeseriesPoint[]): {
  trend: TrendLabel;
  midChangePct: number | null;
  volatilityPct: number | null;
} {
  return trendFromHistory(points);
}

function trendFromHistory(points: TimeseriesPoint[]): {
  trend: TrendLabel;
  midChangePct: number | null;
  volatilityPct: number | null;
} {
  const mids: number[] = [];
  for (const p of points) {
    const m = midOf(p.avgHighPrice ?? null, p.avgLowPrice ?? null);
    if (m != null && m > 0) mids.push(m);
  }
  if (mids.length < 4) {
    return { trend: "unknown", midChangePct: null, volatilityPct: null };
  }
  const first = mids[0]!;
  const last = mids[mids.length - 1]!;
  const midChangePct = ((last - first) / first) * 100;

  // Simple relative stdev of mids
  const mean = mids.reduce((a, b) => a + b, 0) / mids.length;
  const variance =
    mids.reduce((a, b) => a + (b - mean) ** 2, 0) / mids.length;
  const volatilityPct = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : null;

  const abs = Math.abs(midChangePct);
  const vol = volatilityPct ?? 0;
  // If move is small vs local noise → range; else directional
  if (abs < Math.max(1.2, vol * 0.35)) {
    return { trend: "range", midChangePct, volatilityPct };
  }
  return {
    trend: midChangePct > 0 ? "up" : "down",
    midChangePct,
    volatilityPct,
  };
}

/**
 * Build decision metrics for an item.
 * `history` should be a **stable** window (app uses 24h) so Quick signals don’t
 * flip when the user only changes the chart lookback. Chart exploration is separate.
 */
export function computeItemInsights(
  item: CatalogItem,
  opts: {
    bankroll?: number;
    flipMode?: FlipMode;
    /** Prefer fixed 24h timeseries — not the interactive chart lookback */
    history?: TimeseriesPoint[];
  } = {},
): ItemInsights {
  const bankroll = opts.bankroll ?? 0;
  const flipMode = opts.flipMode ?? "safe";
  const history = opts.history ?? [];

  const buy =
    item.low != null && item.high != null
      ? Math.min(item.low, item.high)
      : (item.low ?? item.high);
  const sell =
    item.low != null && item.high != null
      ? Math.max(item.low, item.high)
      : (item.high ?? item.low);

  const netSpread =
    sell != null && buy != null ? sell - geTax(sell) - buy : flipMargin(item.high, item.low);
  const mid = midOf(item.high, item.low);
  const netSpreadPct =
    netSpread != null && mid != null && mid > 0 ? (netSpread / mid) * 100 : null;

  // Model edge (table-aligned) vs last-print edge
  const model = modelFlipEdge(item);
  const modelMargin = model?.margin ?? null;
  const modelMarginPct = model?.marginPct ?? null;
  const modelBuy = model?.buy ?? null;
  const modelSell = model?.sell ?? null;

  const highAgeSec = ageSec(item.highTime);
  const lowAgeSec = ageSec(item.lowTime);
  const printFresh =
    (highAgeSec == null || highAgeSec < 3600) &&
    (lowAgeSec == null || lowAgeSec < 3600);

  const volHigh1h = item.volHigh1h;
  const volLow1h = item.volLow1h;
  const volMin1h = Math.min(volHigh1h, volLow1h);
  const volSum = volHigh1h + volLow1h;
  const volImbalance =
    volSum > 0 ? (volHigh1h - volLow1h) / volSum : null;

  const regime = regimeFromVolumes(volMin1h, item.volume1h, item.volume5m);
  const regimeDetail = {
    thick: "Lots of trades both ways last hour — fills faster, more competition",
    mixed: "Enough trades to try — still check both buy and sell before full limit",
    thin: "Very few trades both ways — “profit” often won’t fill",
    spike: "Last 5 minutes way busier than the hour — window open, margin may shrink",
    drying: "Hour was active but last 5 minutes went cold — may stall while you hold",
    unknown: "Not enough trade data to say how busy this is",
  }[regime];

  let volumePace: ItemInsights["volumePace"] = "unknown";
  if (item.volume1h > 0) {
    const expected5m = item.volume1h / 12;
    if (item.volume5m > expected5m * 1.8) volumePace = "hot";
    else if (item.volume5m < expected5m * 0.35) volumePace = "cooling";
    else volumePace = "stable";
  }

  const { trend, midChangePct, volatilityPct } = trendFromHistory(history);

  // Spike / turnaround: last-trade mid vs 1h avg mid
  const avgMid = midOf(item.avgHigh1h, item.avgLow1h);
  const lastMid = mid;
  let vsHourAvgPct: number | null = null;
  let recoverToAvgGp: number | null = null;
  /** GP gap last mid → hour mid (before tax story) */
  let gapToHourGp: number | null = null;
  let spikeVsAvg = false;
  let spikeDetail: string | null = null;
  if (lastMid != null && avgMid != null && avgMid > 0) {
    vsHourAvgPct = ((lastMid - avgMid) / avgMid) * 100;
    gapToHourGp = Math.round(avgMid - lastMid);
    if (Math.abs(vsHourAvgPct) >= 4) {
      spikeVsAvg = true;
      spikeDetail =
        vsHourAvgPct > 0
          ? `Last prints ~${vsHourAvgPct.toFixed(1)}% above 1h avg mid — FOMO/spike risk`
          : `Last prints ~${Math.abs(vsHourAvgPct).toFixed(1)}% below 1h avg mid — dump/panic risk`;
    }
    // Speculative: buy near last low, exit if mid returns to hour average
    if (buy != null && lastMid < avgMid) {
      const exit = avgMid;
      const raw = exit - geTax(exit) - buy;
      // Keep signed value even if tax eats it (UI decides how to present)
      recoverToAvgGp = Math.round(raw);
    }
  }

  let edgeVsVol: ItemInsights["edgeVsVol"] = "unknown";
  if (netSpreadPct != null && volatilityPct != null) {
    if (netSpreadPct > volatilityPct * 1.4 && netSpreadPct > 1) edgeVsVol = "strong";
    else if (netSpreadPct > volatilityPct * 0.6) edgeVsVol = "ok";
    else edgeVsVol = "weak";
  } else if (netSpreadPct != null) {
    edgeVsVol = netSpreadPct > 2 ? "ok" : "weak";
  }

  const flip = bankroll > 0 ? computeFlip(item, bankroll, flipMode) : null;

  /**
   * Fill score 0–100 — catalog fields only.
   * Must NOT depend on history (async) or bankroll/flip model, or the main-list
   * score and the item drawer will disagree (e.g. 85 in table → 80 after chart loads).
   * Trend / model spike risk stay as chips and standouts, not fill-score modifiers.
   */
  let fillScore = 40;
  if (regime === "thick") fillScore += 25;
  else if (regime === "mixed") fillScore += 12;
  else if (regime === "thin") fillScore -= 20;
  else if (regime === "spike") fillScore += 8;
  else if (regime === "drying") fillScore -= 12;
  if (printFresh) fillScore += 10;
  else fillScore -= 15;
  if (volMin1h >= 20) fillScore += 10;
  if (volImbalance != null && Math.abs(volImbalance) > 0.55) fillScore -= 10;
  if (spikeVsAvg) fillScore -= 8;
  fillScore = Math.max(0, Math.min(100, fillScore));

  const fillDetail =
    fillScore >= 70
      ? "Both sides look workable for a normal flip"
      : fillScore >= 45
        ? "Possible fills — size carefully; watch the slower side"
        : "High risk of stuck items or fake-looking profit";

  // Longer-horizon play style (after fillScore so rules can use it)
  let holdStyle: HoldStyle = "mixed";
  let holdThesis = "No strong hold signal — treat as a same-day flip or skip.";
  const chartDown = trend === "down" || (midChangePct != null && midChangePct <= -2);
  const chartUp = trend === "up" || (midChangePct != null && midChangePct >= 2);
  if (
    netSpread != null &&
    netSpread <= 0 &&
    (modelMargin == null || modelMargin <= 0) &&
    fillScore < 45
  ) {
    holdStyle = "avoid";
    holdThesis = "Weak instant edge, weak model edge, and hard fills — pass or size tiny.";
  } else if (vsHourAvgPct != null && vsHourAvgPct <= -2 && !chartDown) {
    holdStyle = "dip_buy";
    holdThesis =
      recoverToAvgGp != null && recoverToAvgGp > 0
        ? `Trading under the hour average — possible turnaround if it climbs back (~${recoverToAvgGp.toLocaleString()} gp/item rough, after tax). Higher risk than a same-day flip.`
        : gapToHourGp != null && gapToHourGp > 0
          ? `Trading ~${Math.abs(vsHourAvgPct!).toFixed(1)}% under the hour mid (~${gapToHourGp.toLocaleString()} gp). Tax may eat a full reclaim — size small.`
          : "Trading under the hour average — possible dip-buy if you accept hold risk.";
  } else if (vsHourAvgPct != null && vsHourAvgPct >= 1.5 && chartUp) {
    holdStyle = "momentum";
    holdThesis =
      "Above the hour average and climbing on the chart — momentum hold, not a classic buy-low flip.";
  } else if (modelMargin != null && modelMargin > 0 && fillScore >= 45) {
    holdStyle = "quick_flip";
    holdThesis =
      "Same-day sit flip looks best on public data — use reliable avg sits, not a multi-day hold story.";
  } else if (chartDown && vsHourAvgPct != null && vsHourAvgPct < 0) {
    holdStyle = "avoid";
    holdThesis =
      "Price is sliding on the chart and under the hour average — don’t catch a falling knife unless you mean to hold.";
  }

  const chips: InsightChip[] = [];
  const regimeLabel: Record<RegimeLabel, string> = {
    thick: "Busy market",
    mixed: "OK activity",
    thin: "Quiet market",
    spike: "Trade rush",
    drying: "Trades drying up",
    unknown: "Activity unclear",
  };
  chips.push({
    id: "regime",
    guideId: "regime",
    label: regimeLabel[regime],
    detail: regimeDetail,
    tone:
      regime === "thick"
        ? "gain"
        : regime === "thin" || regime === "drying"
          ? "warn"
          : "muted",
    standout: regime === "thick" || regime === "thin" || regime === "drying" || regime === "spike",
  });
  chips.push({
    id: "trend",
    guideId: "trend",
    label:
      trend === "range"
        ? "Sideways"
        : trend === "up"
          ? "Climbing"
          : trend === "down"
            ? "Falling"
            : "Direction ?",
    detail:
      midChangePct != null
        ? `Price mid moved ${midChangePct >= 0 ? "+" : ""}${midChangePct.toFixed(1)}% over the last ~24h (fixed; not the chart lookback)`
        : "Need more history for direction",
    tone: trend === "down" ? "warn" : trend === "up" ? "accent" : "muted",
    standout: trend === "down" || trend === "range",
  });
  if (!printFresh) {
    chips.push({
      id: "stale",
      guideId: "fresh",
      label: "Prices outdated",
      detail: `Last buy-now trade ${highAgeSec != null ? Math.round(highAgeSec / 60) + "m" : "?"} ago · sell-now ${lowAgeSec != null ? Math.round(lowAgeSec / 60) + "m" : "?"} ago`,
      tone: "warn",
      standout: true,
    });
  } else {
    chips.push({
      id: "fresh",
      guideId: "fresh",
      label: "Prices recent",
      detail: "Last buy-now and sell-now under ~1 hour — numbers more trustworthy",
      tone: "gain",
      standout: false,
    });
  }
  if (volImbalance != null && Math.abs(volImbalance) > 0.35) {
    chips.push({
      id: "imbalance",
      guideId: "imbalance",
      label: volImbalance > 0 ? "Buy pressure" : "Sell pressure",
      detail:
        volImbalance > 0
          ? "More people paying top prices — selling easier; buying may wait"
          : "More people dumping — buying easier; selling is the hard part",
      tone: "warn",
      standout: Math.abs(volImbalance) > 0.45,
    });
  }
  if (spikeVsAvg && spikeDetail) {
    chips.push({
      id: "spike",
      guideId: "spike",
      label: "Off hour average",
      detail: spikeDetail,
      tone: "warn",
      standout: true,
    });
  }
  chips.push({
    id: "edge",
    guideId: "edge",
    label:
      edgeVsVol === "strong"
        ? "Margin beats noise"
        : edgeVsVol === "weak"
          ? "Noise > margin"
          : edgeVsVol === "ok"
            ? "Margin OK vs noise"
            : "Edge unclear",
    detail:
      netSpreadPct != null
        ? `Profit ~${netSpreadPct.toFixed(1)}% after tax` +
          (volatilityPct != null ? ` · typical wobble ~${volatilityPct.toFixed(1)}%` : "")
        : "No profit figure",
    tone:
      edgeVsVol === "strong" ? "gain" : edgeVsVol === "weak" ? "warn" : "muted",
    standout: edgeVsVol === "strong" || edgeVsVol === "weak",
  });
  chips.push({
    id: "pace",
    guideId: "pace",
    label:
      volumePace === "hot"
        ? "Last 5m: busy"
        : volumePace === "cooling"
          ? "Last 5m: quiet"
          : volumePace === "stable"
            ? "Last 5m: steady"
            : "Last 5m: ?",
    detail: `${item.volume5m} trades in the last 5 minutes (about ${Math.round(item.volume1h / 12)} would be a normal slice of the hour). Not millions of GP — just how many times it traded.`,
    tone: volumePace === "cooling" ? "warn" : volumePace === "hot" ? "accent" : "muted",
    standout: volumePace === "cooling" || volumePace === "hot",
  });

  const checks: string[] = [];
  if (regime === "thin" || regime === "unknown") {
    checks.push(
      "Make sure people are both buying and selling — wide gaps on quiet items often never fill.",
    );
  }
  if (!printFresh) {
    checks.push(
      "Open the GE and check real offers — the app’s prices may be outdated.",
    );
  }
  if (volImbalance != null && volImbalance < -0.4) {
    checks.push(
      "Selling looks hard (lots of dumps) — plan how you’ll get out before you buy your full limit.",
    );
  }
  if (volImbalance != null && volImbalance > 0.4) {
    checks.push(
      "Buying looks competitive — sitting a sell may be easier than sitting a buy.",
    );
  }
  if (trend === "down") {
    checks.push(
      "Price is falling — don’t buy hoping it bounces unless you’re OK holding risk.",
    );
  }
  if (trend === "range" && edgeVsVol === "strong") {
    checks.push(
      "Price is sideways and profit beats the normal bounce — good classic flip if fills still look OK.",
    );
  }
  if (flip?.bottleneck === "buy_limit") {
    checks.push(
      "Buy limit is the ceiling — more cash won’t help until the 4h limit refreshes.",
    );
  }
  if (flip?.bottleneck === "volume") {
    checks.push(
      "Not enough trades to support full buy-limit every hour — size down.",
    );
  }
  if (flip?.bottleneck === "capital") {
    checks.push(
      "Your cash is the ceiling — more GP (or a cheaper item) would let you size up if trades allow.",
    );
  }
  if (spikeVsAvg) {
    checks.push(
      "Last prices look weird vs the rest of the hour — start small or wait.",
    );
  }
  if (checks.length === 0) {
    checks.push(
      "No major red flags from public data — still verify in-game before full limit.",
    );
  }

  // Extremes from fixed signal history (24h) — context only, not sit targets
  let seriesLow: number | null = null;
  let seriesHigh: number | null = null;
  for (const p of history) {
    const lo = p.avgLowPrice ?? null;
    const hi = p.avgHighPrice ?? null;
    if (lo != null && lo > 0) {
      seriesLow = seriesLow == null ? lo : Math.min(seriesLow, lo);
    }
    if (hi != null && hi > 0) {
      seriesHigh = seriesHigh == null ? hi : Math.max(seriesHigh, hi);
    }
  }
  if (seriesLow != null) seriesLow = Math.round(seriesLow);
  if (seriesHigh != null) seriesHigh = Math.round(seriesHigh);

  // ── Price plans (what to type in the GE) ──────────────────────────
  const quickPlan: PricePlan | null = (() => {
    const qBuy = flip?.buyPrice ?? modelBuy ?? (buy != null ? buy : null);
    const qSell = flip?.sellPrice ?? modelSell ?? (sell != null ? sell : null);
    if (qBuy == null || qSell == null || qBuy <= 0 || qSell <= qBuy) return null;
    const src =
      flip != null
        ? flip.priceSource === "last_trade"
          ? "last prints (hot)"
          : "1h/5m average clears"
        : model != null
          ? "1h/5m average clears"
          : "last prints";

    const chartLower =
      seriesLow != null && seriesLow < qBuy
        ? `24h chart printed as low as ${seriesLow.toLocaleString()} gp — that is often a thin dump, not a level you can sit and fill. GP/h assumes fills near these average sits, not the chart floor.`
        : `These are where both sides have been clearing recently (${src}), not “best price on the chart.”`;

    return {
      buy: qBuy,
      sell: qSell,
      label: "Reliable sits (avg fills)",
      hint: `Leave offers at these levels · ${src}. Don’t force instants unless Hot mode.`,
      whyNotChartLow: chartLower,
      chartLow: seriesLow,
      chartHigh: seriesHigh,
      source: src,
    };
  })();

  const holdPlan: PricePlan | null = (() => {
    const avgHigh = item.avgHigh1h;
    const avgLow = item.avgLow1h;
    if (holdStyle === "dip_buy") {
      // Prefer actual recent series low when available for patient entry
      const hBuy = seriesLow ?? buy ?? modelBuy ?? avgLow;
      const hSell =
        avgMid != null
          ? Math.round(avgMid)
          : modelSell ?? sell ?? avgHigh;
      if (hBuy == null || hSell == null || hBuy <= 0) return null;
      const sellAdj = Math.max(hSell, hBuy + 1);
      return {
        buy: Math.round(hBuy),
        sell: sellAdj,
        label: "Patient dip → hour mid target",
        hint: "Different from Quick flip sits — lower entry, slower fill, hold risk if it never reclaims.",
        whyNotChartLow:
          quickPlan && hBuy < quickPlan.buy
            ? `Entry uses a deeper level (~${Math.round(hBuy).toLocaleString()}) than reliable sits (${quickPlan.buy.toLocaleString()}). Expect slower fills; size small.`
            : "Dip plans chase a better entry; they are not the same as same-day average sits.",
        chartLow: seriesLow,
        chartHigh: seriesHigh,
        source: "dip / hour mid",
      };
    }
    if (holdStyle === "momentum") {
      const hBuy = modelBuy ?? buy;
      const hSell =
        sell != null && avgMid != null
          ? Math.max(sell, Math.round(avgMid * 1.01))
          : modelSell ?? sell;
      if (hBuy == null || hSell == null || hBuy <= 0) return null;
      return {
        buy: Math.round(hBuy),
        sell: Math.round(Math.max(hSell, hBuy + 1)),
        label: "Momentum entry → higher exit",
        hint: "Not a value dip-buy — trail sells; size small.",
        chartLow: seriesLow,
        chartHigh: seriesHigh,
        source: "momentum",
      };
    }
    if (holdStyle === "avoid") {
      const hBuy = modelBuy ?? buy;
      const hSell = modelSell ?? sell;
      if (hBuy == null || hSell == null || hBuy <= 0) return null;
      return {
        buy: Math.round(hBuy),
        sell: Math.round(Math.max(hSell, hBuy + 1)),
        label: "Fair reference only",
        hint: "Signal says skip or tiny size — context prices, not a green light.",
        chartLow: seriesLow,
        chartHigh: seriesHigh,
        source: "reference",
      };
    }
    // Legacy holdPlan kept for API stability; UI no longer renders it
    if (quickPlan) {
      return {
        ...quickPlan,
        label: "Same-day sits",
        hint: "Use reliable avg fills on the main decision strip.",
        mirrorsQuickPlan: true,
      };
    }
    return null;
  })();

  const holdEdge: HoldEdge = (() => {
    // 1) Clear dip with positive after-tax reclaim
    if (
      vsHourAvgPct != null &&
      vsHourAvgPct <= -1.5 &&
      recoverToAvgGp != null &&
      recoverToAvgGp > 0
    ) {
      return {
        label: "Turnaround if reclaims hour",
        value: formatGp(recoverToAvgGp),
        hint: `${formatPercent(vsHourAvgPct)} vs hour mid · rough / item after tax`,
        tone: "gain",
        standout: true,
        guideId: "recoverToAvg",
      };
    }
    // 2) Under hour mid but tax eats full reclaim — still show the dip
    if (vsHourAvgPct != null && vsHourAvgPct <= -1.5 && gapToHourGp != null) {
      return {
        label: "Dip vs hour mid",
        value: formatPercent(vsHourAvgPct),
        hint:
          recoverToAvgGp != null && recoverToAvgGp <= 0
            ? `${formatGp(gapToHourGp)} below mid · tax may wipe reclaim — tiny size or skip`
            : `${formatGp(gapToHourGp)} below hour mid · hold risk`,
        tone: "accent",
        standout: true,
        guideId: "recoverToAvg",
      };
    }
    // 3) Trading rich vs hour
    if (vsHourAvgPct != null && vsHourAvgPct >= 1.5) {
      return {
        label: "Premium vs hour mid",
        value: formatPercent(vsHourAvgPct),
        hint:
          holdStyle === "momentum"
            ? "Above fair hour level · momentum ride, not a value buy"
            : "Paying up vs the hour · wait for a pullback or skip",
        tone: "warn",
        standout: true,
        guideId: "spike",
      };
    }
    // 4) Near fair — show model edge magnitude (UI no longer dual-panel)
    if (modelMargin != null && modelMargin > 0) {
      return {
        label: "Model edge",
        value: formatGp(modelMargin),
        hint: "After-tax sit edge from averages · matches main table",
        tone: "gain",
        standout: fillScore >= 50,
        guideId: "netSpread",
      };
    }
    // 5) Chart context when we have history
    if (midChangePct != null) {
      return {
        label: "24h mid move",
        value: formatPercent(midChangePct),
        hint:
          trend === "down"
            ? "Falling over ~24h · avoid dip-buys until it stabilizes"
            : trend === "up"
              ? "Climbing over ~24h · flip or careful momentum only"
              : "Sideways over ~24h · best for classic sit flips",
        tone: trend === "down" ? "warn" : trend === "up" ? "accent" : "muted",
        standout: trend === "down",
        guideId: "trend",
      };
    }
    // 6) Fill / liquidity fallback
    return {
      label: fillScore < 45 ? "Fill risk first" : "Watch fills",
      value: `${fillScore}/100`,
      hint:
        fillScore < 45
          ? "Long holds stuck worse — confirm both sides in GE before any plan"
          : "No strong dip/premium signal · decide with Quick flip + fills",
      tone: fillScore < 45 ? "warn" : "muted",
      standout: fillScore < 45,
      guideId: "fillScore",
    };
  })();

  const standouts = {
    fillScore: fillScore >= 70 || fillScore < 45,
    // Instant edge: only scream when model is also bad (avoids green table / red drawer)
    netSpread:
      (netSpread != null &&
        netSpread <= 0 &&
        (modelMargin == null || modelMargin <= 0)) ||
      (netSpreadPct != null && netSpreadPct >= 3 && (modelMargin == null || modelMargin <= 0)),
    modelMargin:
      (modelMargin != null && modelMargin > 0 && fillScore >= 50) ||
      (modelMargin != null && modelMargin <= 0),
    hold: holdStyle === "dip_buy" || holdStyle === "momentum" || holdStyle === "avoid",
    gpHour: flip != null && flip.profitPerHour > 0 && fillScore >= 60,
    volume: regime === "thin" || regime === "thick" || regime === "drying",
    bottleneck: flip != null && flip.bottleneck !== "none",
  };

  return {
    netSpread,
    netSpreadPct,
    modelMargin,
    modelMarginPct,
    modelBuy,
    modelSell,
    vsHourAvgPct,
    recoverToAvgGp,
    quickPlan,
    holdPlan,
    holdEdge,
    holdStyle,
    holdThesis,
    highAgeSec,
    lowAgeSec,
    printFresh,
    volHigh1h,
    volLow1h,
    volMin1h,
    volImbalance,
    regime,
    regimeDetail,
    volumePace,
    trend,
    midChangePct,
    volatilityPct,
    edgeVsVol,
    spikeVsAvg,
    spikeDetail,
    fillScore,
    fillDetail,
    flip,
    chips,
    checks,
    standouts,
  };
}
