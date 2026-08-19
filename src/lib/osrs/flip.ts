import type { CatalogItem } from "./api";
import { geTax } from "./format";

export type FlipMode = "safe" | "hot";

export type FlipOpportunity = {
  item: CatalogItem;
  mode: FlipMode;
  buyPrice: number;
  sellPrice: number;
  marginPerItem: number;
  qty: number;
  capitalUsed: number;
  profitOnce: number;
  profitPerHour: number;
  profitPerDay: number;
  roiPct: number;
  score: number;
  confidence: number;
  confidenceLabel: "High" | "Solid" | "OK" | "Thin" | "Hot";
  bottleneck: "none" | "capital" | "buy_limit" | "volume";
  priceSource: "blended" | "1h_avg" | "5m_avg" | "last_trade";
  soldTotal1h: number;
  soldTotal5m: number;
  soldBuySide1h: number;
  soldSellSide1h: number;
  volumeCapped: boolean;
  limitCapped: boolean;
  gpCapped: boolean;
  spikeRisk: boolean;
  spikeMargin: number | null;
};

const MAX_SPREAD_PCT = 18;
const SUSPICIOUS_ROI_PCT = 12;

function marginAfterTax(buy: number, sell: number): number {
  return sell - geTax(sell) - buy;
}

function stableFlipPrices(item: CatalogItem): {
  buy: number;
  sell: number;
  source: Exclude<FlipOpportunity["priceSource"], "last_trade">;
} | null {
  const low1 = item.avgLow1h;
  const high1 = item.avgHigh1h;
  const low5 = item.avgLow5m;
  const high5 = item.avgHigh5m;
  const has1h = low1 != null && high1 != null && low1 > 0 && high1 > 0;
  const has5m = low5 != null && high5 != null && low5 > 0 && high5 > 0;

  if (!has1h && !has5m) return null;

  if (has1h && has5m) {
    // Always use low as buy and high as sell from averages
    const buy = Math.min(low1!, high1!) * 0.6 + Math.min(low5!, high5!) * 0.4;
    const sell = Math.max(low1!, high1!) * 0.6 + Math.max(low5!, high5!) * 0.4;
    return {
      buy: Math.round(buy),
      sell: Math.round(sell),
      source: "blended",
    };
  }
  if (has1h) {
    return {
      buy: Math.round(Math.min(low1!, high1!)),
      sell: Math.round(Math.max(low1!, high1!)),
      source: "1h_avg",
    };
  }
  return {
    buy: Math.round(Math.min(low5!, high5!)),
    sell: Math.round(Math.max(low5!, high5!)),
    source: "5m_avg",
  };
}

function detectSpike(
  item: CatalogItem,
  avgBuy: number,
  avgSell: number,
  avgMargin: number,
) {
  let spikeRisk = false;
  let spikeMargin: number | null = null;
  const lastHigh = item.high;
  const lastLow = item.low;

  if (lastHigh != null && lastLow != null && lastHigh > 0 && lastLow > 0) {
    const lastBuy = Math.min(lastHigh, lastLow);
    const lastSell = Math.max(lastHigh, lastLow);
    spikeMargin = marginAfterTax(lastBuy, lastSell);
    if (avgMargin > 0 && spikeMargin > avgMargin * 2.5 && spikeMargin > 500) {
      spikeRisk = true;
    }
  }

  if (lastHigh != null && lastHigh > avgSell * 1.3) spikeRisk = true;
  if (lastLow != null && lastLow < avgBuy * 0.7) spikeRisk = true;

  return { spikeRisk, spikeMargin };
}

function sizeFlip(
  buy: number,
  margin: number,
  bankroll: number,
  item: CatalogItem,
  volumeQty: number,
): {
  qty: number;
  capitalUsed: number;
  profitOnce: number;
  profitPerHour: number;
  profitPerDay: number;
  roiPct: number;
  volumeCapped: boolean;
  limitCapped: boolean;
  gpCapped: boolean;
  bottleneck: FlipOpportunity["bottleneck"];
} | null {
  if (buy <= 0 || margin <= 0 || bankroll <= 0) return null;

  // Missing mapping limit → do not invent 10k (would oversize rares).
  const hasLimit = item.limit != null && item.limit > 0;
  const limitQty = hasLimit ? item.limit! : Number.POSITIVE_INFINITY;
  const affordableQty = Math.floor(bankroll / buy);
  if (affordableQty < 1) return null;

  const volCap = Math.max(1, volumeQty);
  const qty = Math.max(1, Math.min(affordableQty, limitQty, volCap));

  const capitalUsed = qty * buy;
  const profitOnce = qty * margin;
  const profitPerHour = qty * margin;

  const limitCycles = 6;
  const dailyLimitQty = hasLimit ? limitQty * limitCycles : Number.POSITIVE_INFINITY;
  const dailyVolumeQty = volCap * 24;
  const profitPerDay =
    Math.min(dailyLimitQty, dailyVolumeQty, affordableQty * limitCycles) * margin;

  const roiPct = (margin / buy) * 100;
  const volumeCapped = qty >= volCap && volCap <= limitQty && volCap <= affordableQty;
  const limitCapped = hasLimit && qty >= limitQty && limitQty <= affordableQty;
  const gpCapped = qty >= affordableQty;

  let bottleneck: FlipOpportunity["bottleneck"] = "none";
  if (gpCapped) bottleneck = "capital";
  else if (limitCapped) bottleneck = "buy_limit";
  else if (volumeCapped) bottleneck = "volume";

  return {
    qty,
    capitalUsed,
    profitOnce,
    profitPerHour,
    profitPerDay,
    roiPct,
    volumeCapped,
    limitCapped,
    gpCapped,
    bottleneck,
  };
}

function labelFromScore(score: number): FlipOpportunity["confidenceLabel"] {
  if (score >= 80) return "High";
  if (score >= 60) return "Solid";
  if (score >= 40) return "OK";
  return "Thin";
}

/** Safe: 1h/5m averages + volume gates — resists single-trade manipulation. */
function computeSafeFlip(item: CatalogItem, bankroll: number): FlipOpportunity | null {
  const prices = stableFlipPrices(item);
  if (!prices) return null;

  let { buy, sell } = prices;
  if (buy <= 0 || sell <= buy) return null;

  const spreadPct = ((sell - buy) / buy) * 100;
  if (spreadPct > MAX_SPREAD_PCT) {
    sell = Math.round(buy * (1 + MAX_SPREAD_PCT / 100));
  }

  const margin = marginAfterTax(buy, sell);
  if (margin <= 0) return null;

  const buySide1h = item.volHigh1h ?? 0;
  const sellSide1h = item.volLow1h ?? 0;
  const { spikeRisk, spikeMargin } = detectSpike(item, buy, sell, margin);

  const roiProbe = (margin / buy) * 100;
  if (roiProbe > SUSPICIOUS_ROI_PCT && (item.volume1h ?? 0) < 40) return null;

  if (buySide1h < 12 || sellSide1h < 12) return null;

  const balancedFlow = Math.min(buySide1h, sellSide1h);
  const volumeQty = Math.max(1, Math.floor(balancedFlow * 0.35));
  if (volumeQty < 3 && balancedFlow < 30) return null;
  if (margin < 20 && balancedFlow < 500) return null;
  if (margin < 5) return null;

  const sized = sizeFlip(buy, margin, bankroll, item, volumeQty);
  if (!sized) return null;

  let confidence = 45;
  confidence += Math.min(30, Math.log10(balancedFlow + 1) * 12);
  if (prices.source === "blended") confidence += 12;
  else if (prices.source === "1h_avg") confidence += 8;
  else confidence += 4;
  if (!spikeRisk) confidence += 10;
  if (buySide1h > 0 && sellSide1h > 0) {
    const bal =
      Math.min(buySide1h, sellSide1h) / Math.max(buySide1h, sellSide1h);
    confidence += bal * 10;
  }
  confidence = Math.min(100, Math.round(confidence));

  const score =
    sized.profitPerHour * (1 + confidence / 100) * (spikeRisk ? 0.55 : 1) +
    Math.log10(balancedFlow + 1) * 80;

  return {
    item,
    mode: "safe",
    buyPrice: buy,
    sellPrice: sell,
    marginPerItem: margin,
    soldBuySide1h: buySide1h,
    soldSellSide1h: sellSide1h,
    soldTotal1h: item.volume1h ?? 0,
    soldTotal5m: item.volume5m ?? 0,
    priceSource: prices.source,
    confidence,
    confidenceLabel: labelFromScore(confidence),
    score,
    spikeMargin,
    spikeRisk,
    ...sized,
  };
}

/** Hot: last-trade prints — always buy lower print, sell higher print. */
function computeHotFlip(item: CatalogItem, bankroll: number): FlipOpportunity | null {
  const high = item.high;
  const low = item.low;
  if (high == null || low == null || high <= 0 || low <= 0) return null;

  const buyPrice = Math.min(high, low);
  const sellPrice = Math.max(high, low);
  const marginPerItem = marginAfterTax(buyPrice, sellPrice);
  if (marginPerItem <= 0) return null;

  if (
    (item.marginPct ?? (marginPerItem / buyPrice) * 100) < 0.15 &&
    marginPerItem < 50
  ) {
    return null;
  }

  const buySide1h = item.volHigh1h ?? 0;
  const sellSide1h = item.volLow1h ?? 0;
  const total1h = item.volume1h ?? 0;
  const total5m = item.volume5m ?? 0;

  if (total1h < 1 && total5m < 1) return null;

  // Two-sided cap only — never size off the fat side or raw 5m count.
  // Hot may take more of the thin book than Best (0.70 vs 0.35).
  const hourlyFlow = Math.min(buySide1h, sellSide1h);
  const volumeQty =
    hourlyFlow > 0
      ? Math.max(1, Math.floor(hourlyFlow * 0.7))
      : total1h > 0
        ? Math.max(1, Math.floor(total1h * 0.15))
        : Math.max(1, total5m);

  const sized = sizeFlip(buyPrice, marginPerItem, bankroll, item, volumeQty);
  if (!sized) return null;

  const roiPct = sized.roiPct;
  let spikeRisk = false;
  if (item.avgHigh1h != null && item.avgHigh1h > 0 && high > item.avgHigh1h * 1.4) {
    spikeRisk = true;
  }
  if (item.avgLow1h != null && item.avgLow1h > 0 && low < item.avgLow1h * 0.6) {
    spikeRisk = true;
  }
  if (roiPct > 15 && total1h < 20) spikeRisk = true;

  const score =
    sized.profitPerHour * (1 + Math.min(roiPct, 20) / 40) +
    Math.log10(volumeQty + 1) * 120 +
    Math.min(marginPerItem, 100_000) * 0.05 +
    Math.min(total5m, 500) * 2 +
    (total1h >= 10 ? 50 : 0);

  const confidence = Math.max(
    25,
    Math.min(
      85,
      35 +
        Math.min(25, Math.log10(total1h + 1) * 10) +
        (spikeRisk ? -15 : 10) +
        (hourlyFlow >= 12 ? 10 : 0),
    ),
  );

  return {
    item,
    mode: "hot",
    buyPrice,
    sellPrice,
    marginPerItem,
    soldBuySide1h: buySide1h,
    soldSellSide1h: sellSide1h,
    soldTotal1h: total1h,
    soldTotal5m: total5m,
    priceSource: "last_trade",
    confidence: Math.round(confidence),
    confidenceLabel: "Hot",
    score,
    spikeMargin: spikeRisk ? marginPerItem : null,
    spikeRisk,
    ...sized,
  };
}

export function computeFlip(
  item: CatalogItem,
  bankroll: number,
  mode: FlipMode = "safe",
): FlipOpportunity | null {
  if (bankroll <= 0) return null;
  return mode === "hot" ? computeHotFlip(item, bankroll) : computeSafeFlip(item, bankroll);
}

/**
 * Same average-based buy/sell the Safe table uses — works without bankroll.
 * Prefer this over last-print margin when explaining “why is the list green?”
 */
export function modelFlipEdge(item: CatalogItem): {
  buy: number;
  sell: number;
  margin: number;
  marginPct: number;
  source: Exclude<FlipOpportunity["priceSource"], "last_trade">;
} | null {
  const prices = stableFlipPrices(item);
  if (!prices || prices.buy <= 0 || prices.sell <= prices.buy) return null;
  let { buy, sell, source } = prices;
  const spreadPct = ((sell - buy) / buy) * 100;
  if (spreadPct > MAX_SPREAD_PCT) {
    sell = Math.round(buy * (1 + MAX_SPREAD_PCT / 100));
  }
  const margin = marginAfterTax(buy, sell);
  if (margin <= 0) return null;
  return {
    buy,
    sell,
    margin,
    marginPct: (margin / buy) * 100,
    source,
  };
}

export function rankFlips(
  items: CatalogItem[],
  bankroll: number,
  limit = 40,
  mode: FlipMode = "safe",
): FlipOpportunity[] {
  if (bankroll <= 0) return [];
  const out: FlipOpportunity[] = [];
  for (const item of items) {
    const flip = computeFlip(item, bankroll, mode);
    if (flip) out.push(flip);
  }
  out.sort(
    (a, b) =>
      b.score - a.score ||
      b.profitPerHour - a.profitPerHour ||
      b.marginPerItem - a.marginPerItem,
  );
  return out.slice(0, limit);
}

export function parseGpInput(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, "");
  if (!s) return 0;
  const m = s.match(/^([0-9]*\.?[0-9]+)([kmb])?$/);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  const base = Number(m[1]);
  if (!Number.isFinite(base) || base < 0) return 0;
  const mult =
    m[2] === "k" ? 1_000 : m[2] === "m" ? 1_000_000 : m[2] === "b" ? 1_000_000_000 : 1;
  return Math.floor(base * mult);
}

export function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-US");
}
