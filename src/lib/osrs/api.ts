import { createServerFn } from "@tanstack/react-start";
import { flipMargin } from "./format";

export type ItemMeta = {
  id: number;
  name: string;
  examine: string;
  members: boolean;
  lowalch?: number;
  highalch?: number;
  limit?: number;
  value?: number;
  icon: string;
};

export type PricePoint = {
  high: number | null;
  highTime: number | null;
  low: number | null;
  lowTime: number | null;
};

export type VolumePoint = {
  avgHighPrice?: number | null;
  avgLowPrice?: number | null;
  highPriceVolume: number;
  lowPriceVolume: number;
  timestamp?: number;
};

export type TimeseriesPoint = {
  timestamp: number;
  avgHighPrice?: number | null;
  avgLowPrice?: number | null;
  highPriceVolume?: number;
  lowPriceVolume?: number;
};

export type CatalogItem = ItemMeta & {
  high: number | null;
  low: number | null;
  highTime: number | null;
  lowTime: number | null;
  avgHigh1h: number | null;
  avgLow1h: number | null;
  volHigh1h: number;
  volLow1h: number;
  volume1h: number;
  avgHigh5m: number | null;
  avgLow5m: number | null;
  volHigh5m: number;
  volLow5m: number;
  volume5m: number;
  margin: number | null;
  marginPct: number | null;
  mid: number | null;
  /** % change of mid vs 1h avg high (momentum signal) */
  change1hPct: number | null;
};

export type CatalogPayload = {
  items: CatalogItem[];
  priceTimestamp: number | null;
  fetchedAt: number;
  /** True when this payload is last-good after a wiki failure. */
  stale: boolean;
  /** True when 1h and/or 5m volume endpoints failed (prints still live). */
  volumeDegraded: boolean;
};

export type Lookback = "6h" | "24h" | "7d" | "30d";

const UA =
  "OSRS Flip Lab (https://osrs-ge-flip.vercel.app; GE price tool)";
const BASE = "https://prices.runescape.wiki/api/v1/osrs";
const WIKI_TIMEOUT_MS = 8_000;
const WIKI_RETRIES = 2;
const CATALOG_TTL_MS = 25_000;
const MAPPING_TTL_MS = 6 * 60 * 60 * 1000;
const HISTORY_TTL_MS = 45_000;

type CacheEntry<T> = { at: number; data: T };

let mappingMem: CacheEntry<ItemMeta[]> | null = null;
let catalogMem: CacheEntry<CatalogPayload> | null = null;
const historyMem = new Map<string, CacheEntry<{
  id: number;
  lookback: Lookback;
  points: TimeseriesPoint[];
}>>();

/** Wiki item icon URL from mapping `icon` filename (e.g. "Shark.png"). */
export function getItemIconUrl({ icon }: { icon?: string | null }): string | null {
  if (!icon) return null;
  const file = icon.replace(/ /g, "_");
  // Special:FilePath follows MediaWiki's hashed storage; raw /images/Filename 404s.
  return `https://oldschool.runescape.wiki/w/Special:FilePath/${encodeURIComponent(file)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function wikiGet<T>(path: string): Promise<T> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= WIKI_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), WIKI_TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: ctrl.signal,
      });
      if (res.status === 429 && attempt < WIKI_RETRIES) {
        const ra = Number(res.headers.get("retry-after"));
        const wait =
          Number.isFinite(ra) && ra > 0
            ? Math.min(ra * 1000, 5_000)
            : 500 * 2 ** attempt;
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`Wiki API ${path}: ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const status = lastErr.message.match(/Wiki API .*: (\d+)/)?.[1];
      const retryable =
        lastErr.name === "AbortError" ||
        status === "429" ||
        status === "502" ||
        status === "503" ||
        status === "504" ||
        status == null;
      if (!retryable || attempt >= WIKI_RETRIES) throw lastErr;
      await sleep(500 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error(`Wiki API ${path}: failed`);
}

function mergeCatalog(
  mapping: ItemMeta[],
  latest: Record<string, PricePoint>,
  vol1h: Record<string, VolumePoint>,
  vol5m: Record<string, VolumePoint>,
): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const meta of mapping) {
    const price = latest[String(meta.id)];
    const vol = vol1h[String(meta.id)];
    const v5 = vol5m[String(meta.id)];
    const high = price?.high ?? null;
    const low = price?.low ?? null;
    const margin = flipMargin(high, low);
    // Flip buy side = lower of the two last prints
    const buy =
      high != null && low != null ? Math.min(high, low) : (low ?? high);
    const mid =
      high != null && low != null
        ? (high + low) / 2
        : (high ?? low ?? null);
    const volHigh = vol?.highPriceVolume ?? 0;
    const volLow = vol?.lowPriceVolume ?? 0;
    const volHigh5 = v5?.highPriceVolume ?? 0;
    const volLow5 = v5?.lowPriceVolume ?? 0;
    const avg1h = vol?.avgHighPrice ?? vol?.avgLowPrice ?? null;
    let change1hPct: number | null = null;
    if (mid != null && avg1h != null && avg1h > 0) {
      change1hPct = ((mid - avg1h) / avg1h) * 100;
    }
    items.push({
      ...meta,
      high,
      low,
      highTime: price?.highTime ?? null,
      lowTime: price?.lowTime ?? null,
      avgHigh1h: vol?.avgHighPrice ?? null,
      avgLow1h: vol?.avgLowPrice ?? null,
      volHigh1h: volHigh,
      volLow1h: volLow,
      volume1h: volHigh + volLow,
      avgHigh5m: v5?.avgHighPrice ?? null,
      avgLow5m: v5?.avgLowPrice ?? null,
      volHigh5m: volHigh5,
      volLow5m: volLow5,
      volume5m: volHigh5 + volLow5,
      margin,
      marginPct:
        margin != null && buy != null && buy > 0 ? (margin / buy) * 100 : null,
      mid,
      change1hPct,
    });
  }
  return items;
}

async function getMapping(): Promise<ItemMeta[]> {
  const now = Date.now();
  if (mappingMem && now - mappingMem.at < MAPPING_TTL_MS) return mappingMem.data;
  const data = await wikiGet<ItemMeta[]>("/mapping");
  if (!Array.isArray(data) || data.length === 0) {
    if (mappingMem) return mappingMem.data;
    throw new Error("Wiki API /mapping: empty");
  }
  mappingMem = { at: now, data };
  return data;
}

export const fetchCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogPayload> => {
    const now = Date.now();
    if (catalogMem && now - catalogMem.at < CATALOG_TTL_MS) {
      return catalogMem.data;
    }

    try {
      const mapping = await getMapping();
      const [latest, vol1h, vol5m] = await Promise.all([
        wikiGet<{ data?: Record<string, PricePoint>; timestamp?: number }>(
          "/latest",
        ),
        wikiGet<{ data?: Record<string, VolumePoint> }>("/1h").then(
          (r) => r.data ?? {},
          (): null => null,
        ),
        wikiGet<{ data?: Record<string, VolumePoint> }>("/5m").then(
          (r) => r.data ?? {},
          (): null => null,
        ),
      ]);

      const payload: CatalogPayload = {
        items: mergeCatalog(
          mapping,
          latest.data ?? {},
          vol1h ?? {},
          vol5m ?? {},
        ),
        priceTimestamp: latest.timestamp ?? null,
        fetchedAt: Date.now(),
        stale: false,
        volumeDegraded: vol1h == null || vol5m == null,
      };
      catalogMem = { at: Date.now(), data: payload };
      return payload;
    } catch (err) {
      if (catalogMem) {
        return { ...catalogMem.data, stale: true };
      }
      throw err;
    }
  },
);

const LOOKBACK_TIMESTEP: Record<Lookback, string> = {
  "6h": "5m",
  "24h": "5m",
  "7d": "1h",
  "30d": "6h",
};

const LOOKBACK_WINDOW_SEC: Record<Lookback, number> = {
  "6h": 6 * 3600,
  "24h": 24 * 3600,
  "7d": 7 * 86400,
  "30d": 30 * 86400,
};

export const fetchItemHistory = createServerFn({ method: "GET" })
  .validator((data: { id: number; lookback: Lookback }) => data)
  .handler(async ({ data }) => {
    const id = Number(data.id);
    if (!Number.isInteger(id) || id < 1) {
      throw new Error("Invalid item id");
    }
    const lookback: Lookback =
      data.lookback in LOOKBACK_TIMESTEP ? data.lookback : "24h";
    const cacheKey = `${id}:${lookback}`;
    const cached = historyMem.get(cacheKey);
    if (cached && Date.now() - cached.at < HISTORY_TTL_MS) {
      return cached.data;
    }

    const timestep = LOOKBACK_TIMESTEP[lookback];
    const raw = await wikiGet<{
      data: TimeseriesPoint[];
    }>(`/timeseries?timestep=${timestep}&id=${id}`);

    const now = Math.floor(Date.now() / 1000);
    const windowSec = LOOKBACK_WINDOW_SEC[lookback];
    const points = (raw.data ?? []).filter(
      (p) => p.timestamp != null && p.timestamp >= now - windowSec,
    );

    const payload = { id, lookback, points };
    historyMem.set(cacheKey, { at: Date.now(), data: payload });
    if (historyMem.size > 80) {
      const oldest = historyMem.keys().next().value;
      if (oldest != null) historyMem.delete(oldest);
    }
    return payload;
  });
