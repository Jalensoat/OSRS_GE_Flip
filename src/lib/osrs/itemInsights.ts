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
    thick: "Strong two-sided 1h flow — faster fills, tighter competition",
    mixed: "Usable liquidity — check both legs before full-limit commits",
    thin: "Sparse two-sided volume — paper margins often fail",
    spike: "5m volume hot vs 1h — fill window open, margin may compress",
    drying: "1h was active but 5m is cold — dry-up risk mid-hold",
    unknown: "Not enough volume signal to classify liquidity",
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
      ? "Both legs look workable for a standard cycle"
      : fillScore >= 45
        ? "Possible fills — size carefully; watch the weak leg"
        : "High risk of stuck inventory or phantom margin";

  const chips: InsightChip[] = [];
  chips.push({
    id: "regime",
    guideId: "regime",
    label: `Liquidity: ${regime}`,
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
        ? "Trend: range"
        : trend === "up"
          ? "Trend: up"
          : trend === "down"
            ? "Trend: down"
            : "Trend: ?",
    detail:
      midChangePct != null
        ? `Mid path over chart lookback: ${midChangePct >= 0 ? "+" : ""}${midChangePct.toFixed(1)}%`
        : "Need more history points for slope",
    tone: trend === "down" ? "warn" : trend === "up" ? "accent" : "muted",
    standout: trend === "down" || trend === "range",
  });
  if (!printFresh) {
    chips.push({
      id: "stale",
      guideId: "fresh",
      label: "Stale prints",
      detail: `High age ${highAgeSec != null ? Math.round(highAgeSec / 60) + "m" : "?"} · low age ${lowAgeSec != null ? Math.round(lowAgeSec / 60) + "m" : "?"}`,
      tone: "warn",
      standout: true,
    });
  } else {
    chips.push({
      id: "fresh",
      guideId: "fresh",
      label: "Prints fresh",
      detail: "Recent high and low trades — spread more trustworthy",
      tone: "gain",
      standout: false,
    });
  }
  if (volImbalance != null && Math.abs(volImbalance) > 0.35) {
    chips.push({
      id: "imbalance",
      guideId: "imbalance",
      label: volImbalance > 0 ? "More insta-buys" : "More insta-sells",
      detail:
        volImbalance > 0
          ? "Sell leg easier; buy leg may wait or need aggression"
          : "Buy leg easier; sell leg is the inventory risk",
      tone: "warn",
      standout: Math.abs(volImbalance) > 0.45,
    });
  }
  if (spikeVsAvg && spikeDetail) {
    chips.push({
      id: "spike",
      guideId: "spike",
      label: "Vs 1h avg",
      detail: spikeDetail,
      tone: "warn",
      standout: true,
    });
  }
  chips.push({
    id: "edge",
    guideId: "edge",
    label: `Edge vs vol: ${edgeVsVol}`,
    detail:
      netSpreadPct != null
        ? `Net spread ~${netSpreadPct.toFixed(1)}%` +
          (volatilityPct != null ? ` · local mid σ ~${volatilityPct.toFixed(1)}%` : "")
        : "No net spread",
    tone:
      edgeVsVol === "strong" ? "gain" : edgeVsVol === "weak" ? "warn" : "muted",
    standout: edgeVsVol === "strong" || edgeVsVol === "weak",
  });
  chips.push({
    id: "pace",
    guideId: "pace",
    label: `5m pace: ${volumePace}`,
    detail: `${item.volume5m} trades/5m vs ~${Math.round(item.volume1h / 12)} expected from 1h`,
    tone: volumePace === "cooling" ? "warn" : volumePace === "hot" ? "accent" : "muted",
    standout: volumePace === "cooling" || volumePace === "hot",
  });

  const checks: string[] = [];
  if (regime === "thin" || regime === "unknown") {
    checks.push("Confirm real two-sided volume — wide spreads on thin items are often unfillable.");
  }
  if (!printFresh) {
    checks.push("Re-check in-game margin: wiki high/low may be stale ghosts.");
  }
  if (volImbalance != null && volImbalance < -0.4) {
    checks.push("Sell leg looks weak (more dumps than buys) — plan exit before full buy limit.");
  }
  if (volImbalance != null && volImbalance > 0.4) {
    checks.push("Buy leg competition high — undercutting on sell may be easier than resting buys.");
  }
  if (trend === "down") {
    checks.push("Mid trending down — avoid pure mean-reversion buys unless you accept inventory risk.");
  }
  if (trend === "range" && edgeVsVol === "strong") {
    checks.push("Range + margin > local noise — classic harvest setup if fills hold.");
  }
  if (flip?.bottleneck === "buy_limit") {
    checks.push("Buy limit is the ceiling — GP/hour is limit-gated, not bankroll-gated.");
  }
  if (flip?.bottleneck === "volume") {
    checks.push("Market volume caps qty — don't assume full buy-limit cycles every hour.");
  }
  if (flip?.bottleneck === "capital") {
    checks.push("Bankroll is the ceiling — more GP would size larger if volume allows.");
  }
  if (spikeVsAvg) {
    checks.push("Last prints diverge from 1h average — size small or wait for mid to settle.");
  }
  if (checks.length === 0) {
    checks.push("No major red flags from public data — still verify in-game before full limit.");
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
