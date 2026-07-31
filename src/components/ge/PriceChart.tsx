import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeseriesPoint } from "@/lib/osrs/api";
import { formatGp } from "@/lib/osrs/format";
import { cn } from "@/lib/utils";

function formatAxis(ts: number, lookback: string) {
  const d = new Date(ts * 1000);
  if (lookback === "6h" || lookback === "24h") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PriceChart({
  points,
  lookback,
  tall,
  size = "normal",
}: {
  points: TimeseriesPoint[];
  lookback: string;
  /** Desktop detail pane — larger chart for recent prints */
  tall?: boolean;
  /** full = majority of viewport (search item page) */
  size?: "normal" | "tall" | "full";
}) {
  const resolved: "normal" | "tall" | "full" = size !== "normal" ? size : tall ? "tall" : "normal";
  const heightClass =
    resolved === "full"
      ? "h-[min(62vh,36rem)] min-h-[18rem] lg:h-[min(68vh,40rem)]"
      : resolved === "tall"
        ? "h-80 min-h-[20rem] lg:h-[22rem]"
        : "h-56 min-h-[14rem]";

  const data = points
    .filter((p) => p.avgHighPrice != null || p.avgLowPrice != null)
    .map((p) => ({
      t: p.timestamp,
      high: p.avgHighPrice,
      low: p.avgLowPrice,
      mid:
        p.avgHighPrice != null && p.avgLowPrice != null
          ? (p.avgHighPrice + p.avgLowPrice) / 2
          : (p.avgHighPrice ?? p.avgLowPrice ?? null),
      volume: (p.highPriceVolume ?? 0) + (p.lowPriceVolume ?? 0),
    }));

  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted",
          heightClass,
        )}
      >
        Not enough trade history for this range.
      </div>
    );
  }

  return (
    <div className={cn("w-full", heightClass)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="highFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b8cae" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6b8cae" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b90a0" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8b90a0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2e3a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(v) => formatAxis(v as number, lookback)}
            tick={{ fill: "#8b90a0", fontSize: 11 }}
            axisLine={{ stroke: "#2a2e3a" }}
            tickLine={false}
            minTickGap={tall ? 28 : 40}
          />
          <YAxis
            tickFormatter={(v) => formatGp(v as number).replace(" gp", "")}
            tick={{ fill: "#8b90a0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={tall ? 64 : 56}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#12141a",
              border: "1px solid #2a2e3a",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8b90a0" }}
            labelFormatter={(v) =>
              new Date((v as number) * 1000).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            }
            formatter={(value: number, name: string) => [
              formatGp(value),
              name === "high" ? "Avg high" : name === "low" ? "Avg low" : name,
            ]}
          />
          <Area
            type="monotone"
            dataKey="high"
            name="high"
            stroke="#6b8cae"
            fill="url(#highFill)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="low"
            name="low"
            stroke="#8b90a0"
            fill="url(#lowFill)"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
