/**
 * Item intelligence metrics for Flip Lab full-page / sheet.
 * Grounded in Phase 0 research (microstructure, liquidity regimes,
 * volatility, mean-reversion, asymmetry). Pure functions only.
 */
import type { CatalogItem, TimeseriesPoint } from "./api";
import { geTax, flipMargin } from "./format";
import { computeFlip, type FlipMode, type FlipOpportunity } from "./flip";

export type RegimeLabel = "thick" | "mixed" | "thin" | "spike" | "drying" | "unknown";
export type TrendLabel = "range" | "up" | "down" | "unknown";
export type ChipTone = "gain" | "loss" | "warn" | "muted" | "accent";

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
  /** Instant-print proxy spread after tax on sell side */
  netSpread: number | null;
  netSpreadPct: number | null;
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
  /** 0–100 fill realism (both legs + limit + bankroll) */
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
 * Build decision metrics for an item. History optional (improves trend/vol).
 */
export function computeItemInsights(
  item: CatalogItem,
  opts: {
    bankroll?: number;
    flipMode?: FlipMode;
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

  // Spike: last-trade mid vs 1h avg mid
  const avgMid = midOf(item.avgHigh1h, item.avgLow1h);
  const lastMid = mid;
  let spikeVsAvg = false;
  let spikeDetail: string | null = null;
  if (lastMid != null && avgMid != null && avgMid > 0) {
    const pct = ((lastMid - avgMid) / avgMid) * 100;
    if (Math.abs(pct) >= 4) {
      spikeVsAvg = true;
      spikeDetail =
        pct > 0
          ? `Last prints ~${pct.toFixed(1)}% above 1h avg mid — FOMO/spike risk`
          : `Last prints ~${Math.abs(pct).toFixed(1)}% below 1h avg mid — dump/panic risk`;
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

  // Fill score 0–100
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
  if (flip?.spikeRisk) fillScore -= 10;
  if (trend === "down" && flipMode === "safe") fillScore -= 5;
  fillScore = Math.max(0, Math.min(100, fillScore));

  const fillDetail =
    fillScore >= 70
      ? "Both sides look workable for a normal flip"
      : fillScore >= 45
        ? "Possible fills — size carefully; watch the slower side"
        : "High risk of stuck items or fake-looking profit";

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
        ? `Price mid moved ${midChangePct >= 0 ? "+" : ""}${midChangePct.toFixed(1)}% over the chart window`
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

  const standouts = {
    fillScore: fillScore >= 70 || fillScore < 45,
    netSpread:
      (netSpread != null && netSpread <= 0) ||
      (netSpreadPct != null && netSpreadPct >= 3) ||
      edgeVsVol === "weak",
    gpHour: flip != null && flip.profitPerHour > 0 && fillScore >= 60,
    volume: regime === "thin" || regime === "thick" || regime === "drying",
    bottleneck: flip != null && flip.bottleneck !== "none",
  };

  return {
    netSpread,
    netSpreadPct,
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
