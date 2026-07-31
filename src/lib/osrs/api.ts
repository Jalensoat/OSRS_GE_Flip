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

export type Lookback = "6h" | "24h" | "7d" | "30d";

const UA = "OSRS Flip Lab - price tool (contact: flip-lab)";
const BASE = "https://prices.runescape.wiki/api/v1/osrs";

/** Wiki item icon URL from mapping `icon` filename (e.g. "Shark.png"). */
export function getItemIconUrl({ icon }: { icon?: string | null }): string | null {
  if (!icon) return null;
  const file = icon.replace(/ /g, "_");
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(file)}`;
}

async function wikiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Wiki API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
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

export const fetchCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const [mapping, latest, vol1h, vol5m] = await Promise.all([
    wikiGet<ItemMeta[]>("/mapping"),
    wikiGet<{ data: Record<string, PricePoint>; timestamp?: number }>("/latest"),
    wikiGet<{ data: Record<string, VolumePoint> }>("/1h"),
    wikiGet<{ data: Record<string, VolumePoint> }>("/5m"),
  ]);

  const items = mergeCatalog(
    mapping,
    latest.data ?? {},
    vol1h.data ?? {},
    vol5m.data ?? {},
  );

  return {
    items,
    priceTimestamp: latest.timestamp ?? null,
    fetchedAt: Date.now(),
  };
});

const LOOKBACK_TIMESTEP: Record<Lookback, string> = {
  "6h": "5m",
  "24h": "5m",
  "7d": "1h",
  "30d": "6h",
};

export const fetchItemHistory = createServerFn({ method: "GET" })
  .validator((data: { id: number; lookback: Lookback }) => data)
  .handler(async ({ data }) => {
    const timestep = LOOKBACK_TIMESTEP[data.lookback] ?? "5m";
    const raw = await wikiGet<{
      data: TimeseriesPoint[];
    }>(`/timeseries?timestep=${timestep}&id=${data.id}`);

    const now = Math.floor(Date.now() / 1000);
    const windowSec =
      data.lookback === "6h"
        ? 6 * 3600
        : data.lookback === "24h"
          ? 24 * 3600
          : data.lookback === "7d"
            ? 7 * 86400
            : 30 * 86400;

    const points = (raw.data ?? []).filter(
      (p) => p.timestamp != null && p.timestamp >= now - windowSec,
    );

    return { id: data.id, lookback: data.lookback, points };
  });
