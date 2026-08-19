import type { CatalogItem } from "./api";
import { parseGpInput } from "./flip";
import type { FlipOpportunity } from "./flip";
import { computeItemInsights } from "./itemInsights";

/** Numeric range filter fields shared by item lists and flip boards. */
export type ListFilterState = {
  f2pOnly: boolean;
  limitMin: string;
  limitMax: string;
  buyMin: string;
  buyMax: string;
  sellMin: string;
  sellMax: string;
  marginMin: string;
  marginMax: string;
  volumeMin: string;
  volumeMax: string;
  potentialMin: string;
  potentialMax: string;
  marginVolMin: string;
  marginVolMax: string;
};

export const EMPTY_FILTERS: ListFilterState = {
  f2pOnly: false,
  limitMin: "",
  limitMax: "",
  buyMin: "",
  buyMax: "",
  sellMin: "",
  sellMax: "",
  marginMin: "",
  marginMax: "",
  volumeMin: "",
  volumeMax: "",
  potentialMin: "",
  potentialMax: "",
  marginVolMin: "",
  marginVolMax: "",
};

export type SortDir = "asc" | "desc";

export type ItemSortKey =
  | "name"
  | "buy"
  | "sell"
  | "margin"
  | "volume"
  | "volume5m"
  | "fill"
  | "limit"
  | "potential"
  | "marginVol";

export type FlipSortKey =
  | "name"
  | "sold1h"
  | "buy"
  | "sell"
  | "qty"
  | "gpHour"
  | "roi"
  | "fill"
  | "trust"
  | "margin";

/** Parse filter text: plain numbers, k/m/b suffixes, commas. */
export function parseFilterNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseGpInput(t);
  return n > 0 || t === "0" || /^0(\.0+)?$/.test(t) ? n : Number.isFinite(Number(t.replace(/,/g, ""))) ? Number(t.replace(/,/g, "")) : n || null;
}

function inRange(value: number | null | undefined, minRaw: string, maxRaw: string): boolean {
  if (value == null || Number.isNaN(value)) {
    // No value: only fail if a min/max is set (can't satisfy range)
    return !minRaw.trim() && !maxRaw.trim();
  }
  const min = parseFilterNumber(minRaw);
  const max = parseFilterNumber(maxRaw);
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function flipBuyPrice(item: CatalogItem): number | null {
  if (item.low != null && item.high != null) return Math.min(item.low, item.high);
  return item.low ?? item.high;
}

export function flipSellPrice(item: CatalogItem): number | null {
  if (item.low != null && item.high != null) return Math.max(item.low, item.high);
  return item.high ?? item.low;
}

/** Potential ≈ post-tax margin × min(limit, thinner 1h side). Not raw high−low. */
export function potentialProfit(item: CatalogItem): number | null {
  if (item.margin == null || item.margin <= 0) return item.margin === 0 ? 0 : null;
  const twoSided = Math.min(item.volHigh1h ?? 0, item.volLow1h ?? 0);
  const flow = twoSided > 0 ? twoSided : Math.max(item.volume1h, 1);
  const cap =
    item.limit != null && item.limit > 0
      ? Math.min(item.limit, Math.max(flow, 1))
      : Math.max(flow, 1);
  return item.margin * cap;
}

export function marginTimesVolume(item: CatalogItem): number | null {
  if (item.margin == null) return null;
  return item.margin * item.volume1h;
}

/** Wiki-style “daily volume” estimate from 1h trade count. */
export function dailyVolumeEst(item: CatalogItem): number {
  return item.volume1h * 24;
}

export function filtersActive(f: ListFilterState): boolean {
  if (f.f2pOnly) return true;
  return Object.entries(f).some(
    ([k, v]) => k !== "f2pOnly" && typeof v === "string" && v.trim() !== "",
  );
}

export function countActiveFilters(f: ListFilterState): number {
  let n = f.f2pOnly ? 1 : 0;
  for (const [k, v] of Object.entries(f)) {
    if (k === "f2pOnly") continue;
    if (typeof v === "string" && v.trim()) n += 1;
  }
  return n;
}

export function itemMatchesFilters(item: CatalogItem, f: ListFilterState): boolean {
  if (f.f2pOnly && item.members) return false;
  const buy = flipBuyPrice(item);
  const sell = flipSellPrice(item);
  if (!inRange(item.limit ?? null, f.limitMin, f.limitMax)) return false;
  if (!inRange(buy, f.buyMin, f.buyMax)) return false;
  if (!inRange(sell, f.sellMin, f.sellMax)) return false;
  if (!inRange(item.margin, f.marginMin, f.marginMax)) return false;
  // volumeMin/Max are labeled “Daily volume” in UI → filter on 1h×24 estimate
  if (!inRange(dailyVolumeEst(item), f.volumeMin, f.volumeMax)) return false;
  if (!inRange(potentialProfit(item), f.potentialMin, f.potentialMax)) return false;
  if (!inRange(marginTimesVolume(item), f.marginVolMin, f.marginVolMax)) return false;
  return true;
}

export function filterCatalogItems(items: CatalogItem[], f: ListFilterState): CatalogItem[] {
  if (!filtersActive(f)) return items;
  return items.filter((it) => itemMatchesFilters(it, f));
}

export function filterFlips(flips: FlipOpportunity[], f: ListFilterState): FlipOpportunity[] {
  if (!filtersActive(f)) return flips;
  return flips.filter((flip) => {
    if (f.f2pOnly && flip.item.members) return false;
    if (!inRange(flip.item.limit ?? null, f.limitMin, f.limitMax)) return false;
    if (!inRange(flip.buyPrice, f.buyMin, f.buyMax)) return false;
    if (!inRange(flip.sellPrice, f.sellMin, f.sellMax)) return false;
    if (!inRange(flip.marginPerItem, f.marginMin, f.marginMax)) return false;
    if (!inRange(dailyVolumeEst(flip.item), f.volumeMin, f.volumeMax)) return false;
    // Flip boards show modelled GP/h — filter potential against that, not last-print × limit
    if (!inRange(flip.profitPerHour, f.potentialMin, f.potentialMax)) return false;
    if (!inRange(marginTimesVolume(flip.item), f.marginVolMin, f.marginVolMax)) return false;
    return true;
  });
}

function cmpNum(a: number | null | undefined, b: number | null | undefined, dir: SortDir): number {
  const av = a == null || Number.isNaN(a) ? null : a;
  const bv = b == null || Number.isNaN(b) ? null : b;
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return dir === "asc" ? av - bv : bv - av;
}

export function sortCatalogItems(
  items: CatalogItem[],
  key: ItemSortKey,
  dir: SortDir,
): CatalogItem[] {
  const list = items.slice();
  list.sort((a, b) => {
    let r = 0;
    switch (key) {
      case "name":
        r = a.name.localeCompare(b.name);
        return dir === "asc" ? r : -r;
      case "buy":
        r = cmpNum(flipBuyPrice(a), flipBuyPrice(b), dir);
        break;
      case "sell":
        r = cmpNum(flipSellPrice(a), flipSellPrice(b), dir);
        break;
      case "margin":
        r = cmpNum(a.margin, b.margin, dir);
        break;
      case "volume":
        r = cmpNum(a.volume1h, b.volume1h, dir);
        break;
      case "volume5m":
        r = cmpNum(a.volume5m, b.volume5m, dir);
        break;
      case "fill":
        r = cmpNum(
          computeItemInsights(a).fillScore,
          computeItemInsights(b).fillScore,
          dir,
        );
        break;
      case "limit":
        r = cmpNum(a.limit ?? null, b.limit ?? null, dir);
        break;
      case "potential":
        r = cmpNum(potentialProfit(a), potentialProfit(b), dir);
        break;
      case "marginVol":
        r = cmpNum(marginTimesVolume(a), marginTimesVolume(b), dir);
        break;
    }
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  });
  return list;
}

export function sortFlips(
  flips: FlipOpportunity[],
  key: FlipSortKey,
  dir: SortDir,
): FlipOpportunity[] {
  const list = flips.slice();
  list.sort((a, b) => {
    let r = 0;
    switch (key) {
      case "name":
        r = a.item.name.localeCompare(b.item.name);
        return dir === "asc" ? r : -r;
      case "sold1h":
        r = cmpNum(a.soldTotal1h, b.soldTotal1h, dir);
        break;
      case "buy":
        r = cmpNum(a.buyPrice, b.buyPrice, dir);
        break;
      case "sell":
        r = cmpNum(a.sellPrice, b.sellPrice, dir);
        break;
      case "qty":
        r = cmpNum(a.qty, b.qty, dir);
        break;
      case "gpHour":
        r = cmpNum(a.profitPerHour, b.profitPerHour, dir);
        break;
      case "roi":
        r = cmpNum(a.roiPct, b.roiPct, dir);
        break;
      case "fill":
        // Same catalog-only fill score as list rows / drawer (no mode/history).
        r = cmpNum(
          computeItemInsights(a.item).fillScore,
          computeItemInsights(b.item).fillScore,
          dir,
        );
        break;
      case "trust":
        r = cmpNum(a.confidence, b.confidence, dir);
        break;
      case "margin":
        r = cmpNum(a.marginPerItem, b.marginPerItem, dir);
        break;
    }
    if (r !== 0) return r;
    return a.item.name.localeCompare(b.item.name);
  });
  return list;
}

/** Cycle sort: first click desc (high→low for numbers), second asc, third clears to default. */
export function nextSortState<K extends string>(
  currentKey: K | null,
  currentDir: SortDir,
  clicked: K,
): { key: K | null; dir: SortDir } {
  if (currentKey !== clicked) return { key: clicked, dir: "desc" };
  if (currentDir === "desc") return { key: clicked, dir: "asc" };
  return { key: null, dir: "desc" };
}
