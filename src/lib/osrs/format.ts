/** Format GP values with K / M / B suffixes. */
export function formatGp(value: number | null | undefined, compact = true): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const n = Math.abs(value);
  if (!compact || n < 10_000) {
    return `${sign}${Math.round(n).toLocaleString("en-US")} gp`;
  }
  if (n < 1_000_000) {
    const k = n / 1_000;
    return `${sign}${k >= 100 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  if (n < 1_000_000_000) {
    const m = n / 1_000_000;
    return `${sign}${m >= 100 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, "")}m`;
  }
  const b = n / 1_000_000_000;
  return `${sign}${b.toFixed(2).replace(/\.?0+$/, "")}b`;
}

export function formatGpExact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value).toLocaleString("en-US")} gp`;
}

export function formatVolume(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value < 1_000) return value.toLocaleString("en-US");
  if (value < 1_000_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m`;
}

export function formatRelativeTime(unixSec: number | null | undefined): string {
  if (unixSec == null) return "—";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSec);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** GE sales tax: 2%, capped at 5,000,000 gp per item. */
export function geTax(salePrice: number): number {
  return Math.min(Math.floor(salePrice * 0.02), 5_000_000);
}

/**
 * Classic GE flip margin: buy at the lower print, sell at the higher print.
 * Tax applied on the sell side.
 */
export function flipMargin(high: number | null, low: number | null): number | null {
  if (high == null || low == null) return null;
  const buy = Math.min(high, low);
  const sell = Math.max(high, low);
  return sell - geTax(sell) - buy;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
