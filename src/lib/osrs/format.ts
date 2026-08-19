/** Trim trailing zeros after decimal (keep at least one digit if decimal present). */
function trimZeros(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "");
}

/**
 * Format a magnitude with ~3 significant figures for compact display.
 * Avoids 23.920000m-style noise while keeping 1.25m / 12.5k readable.
 */
function formatSigMagnitude(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 100) return Math.round(n).toString();
  if (abs >= 10) return trimZeros(n.toFixed(1));
  if (abs >= 1) return trimZeros(n.toFixed(2));
  return trimZeros(n.toFixed(2));
}

/** Format GP values with K / M / B suffixes (~3 sig figs when compact). */
export function formatGp(value: number | null | undefined, compact = true): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const n = Math.abs(value);
  // Whole GP under 10k — GE prices are integers; no false decimals
  if (!compact || n < 10_000) {
    return `${sign}${Math.round(n).toLocaleString("en-US")} gp`;
  }
  if (n < 1_000_000) {
    return `${sign}${formatSigMagnitude(n / 1_000)}k`;
  }
  if (n < 1_000_000_000) {
    return `${sign}${formatSigMagnitude(n / 1_000_000)}m`;
  }
  return `${sign}${formatSigMagnitude(n / 1_000_000_000)}b`;
}

/** Exact integer GP (item drawer table / tax). */
export function formatGpExact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value).toLocaleString("en-US")} gp`;
}

/** Trade counts / volumes with compact sig figs. */
export function formatVolume(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const n = Math.abs(value);
  if (n < 1_000) return Math.round(value).toLocaleString("en-US");
  if (n < 1_000_000) return `${formatSigMagnitude(value / 1_000)}k`;
  return `${formatSigMagnitude(value / 1_000_000)}m`;
}

/** Age helper for print times (seconds → compact). */
export function formatAgeSec(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${formatSigMagnitude(sec / 3600)}h`;
  return `${formatSigMagnitude(sec / 86400)}d`;
}

export function formatRelativeTime(unixSec: number | null | undefined): string {
  if (unixSec == null) return "—";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSec);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** GE sales tax: 2%, capped at 5,000,000 gp. Sales under 100 gp are exempt. */
export function geTax(salePrice: number): number {
  if (!Number.isFinite(salePrice) || salePrice < 100) return 0;
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

/** Percent with adaptive decimals (2 under 10%, 1 otherwise). */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  const abs = Math.abs(value);
  const body = abs >= 10 ? value.toFixed(1) : abs >= 1 ? value.toFixed(2) : value.toFixed(2);
  return `${sign}${trimZeros(body)}%`;
}
