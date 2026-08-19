/**
 * High-alch profit calculator for GE items.
 * Standard formula: high alch value − item buy cost − nature rune.
 * GP/h assumes one cast every 3s → 1,200 alchs/hour (no tick lag).
 */
import type { CatalogItem } from "./api";
import { parseGpInput } from "./flip";

/** Nature rune item id (wiki mapping). */
export const NATURE_RUNE_ID = 561;

/** High Alchemy cast interval used for GP/h (seconds). */
export const ALCH_INTERVAL_SEC = 3;
export const ALCHS_PER_HOUR = Math.floor(3600 / ALCH_INTERVAL_SEC); // 1200
export const ALCH_BATCH = 1000;

export type HighAlchOpportunity = {
  item: CatalogItem;
  /** High alch GP from mapping */
  highAlch: number;
  /** Nature rune GE buy (instant high when available) */
  natureCost: number;
  /**
   * Cost to acquire one item for alching.
   * Uses instant-buy print (wiki high) so profits aren't optimistic.
   */
  buyPrice: number;
  /** Total cost per alch: buy + nature */
  costPerAlch: number;
  /** highAlch − costPerAlch (can be negative; filtered out by default) */
  profit: number;
  /** profit / costPerAlch × 100 */
  roiPct: number;
  /** profit × 1200 */
  profitPerHour: number;
  /** cost of 1000 items + 1000 natures */
  costFor1000: number;
  /** Profit if you alch 1000 */
  profitFor1000: number;
  volume1h: number;
  limit: number | null;
};

export type AlchFilterState = {
  f2pOnly: boolean;
  /** Hide zero/negative profit */
  profitOnly: boolean;
  volumeMin: string;
  volumeMax: string;
  roiMin: string;
  roiMax: string;
  priceMin: string;
  priceMax: string;
  gpHourMin: string;
  gpHourMax: string;
  cost1000Min: string;
  cost1000Max: string;
  profitMin: string;
  profitMax: string;
  alchMin: string;
  alchMax: string;
  limitMin: string;
  limitMax: string;
};

export const EMPTY_ALCH_FILTERS: AlchFilterState = {
  f2pOnly: false,
  profitOnly: true,
  volumeMin: "",
  volumeMax: "",
  roiMin: "",
  roiMax: "",
  priceMin: "",
  priceMax: "",
  gpHourMin: "",
  gpHourMax: "",
  cost1000Min: "",
  cost1000Max: "",
  profitMin: "",
  profitMax: "",
  alchMin: "",
  alchMax: "",
  limitMin: "",
  limitMax: "",
};

export type AlchSortKey =
  | "name"
  | "buy"
  | "highAlch"
  | "nature"
  | "profit"
  | "roi"
  | "gpHour"
  | "cost1000"
  | "volume"
  | "limit";

export type SortDir = "asc" | "desc";

function parseFilterNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseGpInput(t);
  if (n > 0 || t === "0" || /^0(\.0+)?$/.test(t)) return n;
  const plain = Number(t.replace(/,/g, ""));
  return Number.isFinite(plain) ? plain : n || null;
}

function inRange(
  value: number | null | undefined,
  minRaw: string,
  maxRaw: string,
): boolean {
  if (value == null || Number.isNaN(value)) {
    return !minRaw.trim() && !maxRaw.trim();
  }
  const min = parseFilterNumber(minRaw);
  const max = parseFilterNumber(maxRaw);
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

/** Instant-buy price for stocking (wiki high). */
export function alchBuyPrice(item: CatalogItem): number | null {
  if (item.high != null && item.high > 0) return item.high;
  if (item.low != null && item.low > 0) return item.low;
  return null;
}

export function natureRuneCost(items: CatalogItem[]): number {
  const nat = items.find((i) => i.id === NATURE_RUNE_ID);
  if (!nat) return 0;
  // Buying natures: pay high when possible. 0 = unknown — callers must not treat as free.
  return alchBuyPrice(nat) ?? 0;
}

export function computeHighAlch(
  item: CatalogItem,
  natureCost: number,
): HighAlchOpportunity | null {
  const highAlch = item.highalch;
  if (highAlch == null || highAlch <= 0) return null;
  const buyPrice = alchBuyPrice(item);
  if (buyPrice == null || buyPrice <= 0) return null;
  // Don't alch the nature rune itself as an "item" opportunity in a weird way
  if (item.id === NATURE_RUNE_ID) return null;
  // Unknown/zero nature price would inflate every profit — refuse rather than invent.
  if (natureCost <= 0) return null;

  const costPerAlch = buyPrice + natureCost;
  if (costPerAlch <= 0) return null;
  const profit = highAlch - costPerAlch;
  const roiPct = (profit / costPerAlch) * 100;
  const profitPerHour = profit * ALCHS_PER_HOUR;
  const costFor1000 = costPerAlch * ALCH_BATCH;
  const profitFor1000 = profit * ALCH_BATCH;

  return {
    item,
    highAlch,
    natureCost,
    buyPrice,
    costPerAlch,
    profit,
    roiPct,
    profitPerHour,
    costFor1000,
    profitFor1000,
    volume1h: item.volume1h,
    limit: item.limit ?? null,
  };
}

export function rankHighAlchs(
  items: CatalogItem[],
  limit = 200,
): HighAlchOpportunity[] {
  const natureCost = natureRuneCost(items);
  if (natureCost <= 0) return [];
  const out: HighAlchOpportunity[] = [];
  for (const item of items) {
    const row = computeHighAlch(item, natureCost);
    if (row) out.push(row);
  }
  out.sort(
    (a, b) =>
      b.profit - a.profit ||
      b.profitPerHour - a.profitPerHour ||
      a.item.name.localeCompare(b.item.name),
  );
  return out.slice(0, limit);
}

export function alchFiltersActive(f: AlchFilterState): boolean {
  if (f.f2pOnly || f.profitOnly) return true;
  return Object.entries(f).some(
    ([k, v]) =>
      k !== "f2pOnly" &&
      k !== "profitOnly" &&
      typeof v === "string" &&
      v.trim() !== "",
  );
}

export function countAlchFilters(f: AlchFilterState): number {
  let n = 0;
  if (f.f2pOnly) n += 1;
  if (f.profitOnly) n += 1;
  for (const [k, v] of Object.entries(f)) {
    if (k === "f2pOnly" || k === "profitOnly") continue;
    if (typeof v === "string" && v.trim()) n += 1;
  }
  return n;
}

export function filterHighAlchs(
  rows: HighAlchOpportunity[],
  f: AlchFilterState,
): HighAlchOpportunity[] {
  return rows.filter((row) => {
    if (f.f2pOnly && row.item.members) return false;
    if (f.profitOnly && row.profit <= 0) return false;
    if (!inRange(row.volume1h, f.volumeMin, f.volumeMax)) return false;
    if (!inRange(row.roiPct, f.roiMin, f.roiMax)) return false;
    if (!inRange(row.buyPrice, f.priceMin, f.priceMax)) return false;
    if (!inRange(row.profitPerHour, f.gpHourMin, f.gpHourMax)) return false;
    if (!inRange(row.costFor1000, f.cost1000Min, f.cost1000Max)) return false;
    if (!inRange(row.profit, f.profitMin, f.profitMax)) return false;
    if (!inRange(row.highAlch, f.alchMin, f.alchMax)) return false;
    if (!inRange(row.limit, f.limitMin, f.limitMax)) return false;
    return true;
  });
}

function cmpNum(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: SortDir,
): number {
  const av = a == null || Number.isNaN(a) ? null : a;
  const bv = b == null || Number.isNaN(b) ? null : b;
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return dir === "asc" ? av - bv : bv - av;
}

export function sortHighAlchs(
  rows: HighAlchOpportunity[],
  key: AlchSortKey,
  dir: SortDir,
): HighAlchOpportunity[] {
  const list = rows.slice();
  list.sort((a, b) => {
    let r = 0;
    switch (key) {
      case "name":
        r = a.item.name.localeCompare(b.item.name);
        return dir === "asc" ? r : -r;
      case "buy":
        r = cmpNum(a.buyPrice, b.buyPrice, dir);
        break;
      case "highAlch":
        r = cmpNum(a.highAlch, b.highAlch, dir);
        break;
      case "nature":
        r = cmpNum(a.natureCost, b.natureCost, dir);
        break;
      case "profit":
        r = cmpNum(a.profit, b.profit, dir);
        break;
      case "roi":
        r = cmpNum(a.roiPct, b.roiPct, dir);
        break;
      case "gpHour":
        r = cmpNum(a.profitPerHour, b.profitPerHour, dir);
        break;
      case "cost1000":
        r = cmpNum(a.costFor1000, b.costFor1000, dir);
        break;
      case "volume":
        r = cmpNum(a.volume1h, b.volume1h, dir);
        break;
      case "limit":
        r = cmpNum(a.limit, b.limit, dir);
        break;
    }
    if (r !== 0) return r;
    return a.item.name.localeCompare(b.item.name);
  });
  return list;
}

export function nextAlchSortState(
  currentKey: AlchSortKey | null,
  currentDir: SortDir,
  clicked: AlchSortKey,
): { key: AlchSortKey | null; dir: SortDir } {
  if (currentKey !== clicked) return { key: clicked, dir: "desc" };
  if (currentDir === "desc") return { key: clicked, dir: "asc" };
  return { key: null, dir: "desc" };
}
