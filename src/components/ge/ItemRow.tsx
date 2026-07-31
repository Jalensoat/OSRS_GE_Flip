import { Star } from "lucide-react";
import type { CatalogItem } from "@/lib/osrs/api";
import { formatGp, formatPercent, formatVolume } from "@/lib/osrs/format";
import { useWatchlist } from "@/lib/osrs/watchlist";
import { ItemIcon } from "./ItemIcon";
import { cn } from "@/lib/utils";

/** Shared grid for header + rows so columns stay aligned. */
export const ITEM_GRID =
  "grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[2rem_minmax(8rem,1.5fr)_5.5rem_5.5rem_5.5rem_4.5rem_2.25rem] sm:gap-3";

/** Flip entry = lower last print (wiki low). Flip exit = higher last print (wiki high). */
function flipBuy(item: CatalogItem): number | null {
  if (item.low != null && item.high != null) return Math.min(item.low, item.high);
  return item.low ?? item.high;
}
function flipSell(item: CatalogItem): number | null {
  if (item.low != null && item.high != null) return Math.max(item.low, item.high);
  return item.high ?? item.low;
}

export function ItemRow({
  item,
  selected,
  onSelect,
}: {
  item: CatalogItem;
  selected?: boolean;
  onSelect: (item: CatalogItem) => void;
}) {
  const watchlist = useWatchlist();
  const watched = watchlist.ids.includes(item.id);
  const buy = flipBuy(item);
  const sell = flipSell(item);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={cn(
        ITEM_GRID,
        "items-center rounded-lg border px-2.5 py-2 transition-colors duration-150 sm:px-3",
        selected
          ? "border-border-strong bg-surface-2"
          : "border-transparent hover:border-border hover:bg-surface",
      )}
    >
      <ItemIcon icon={item.icon} name={item.name} size="sm" />

      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-fg">{item.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-subtle sm:hidden">
          <span className="tabular">
            {formatGp(buy)}→{formatGp(sell)}
          </span>
          <span
            className={cn(
              "tabular",
              item.margin != null && item.margin > 0
                ? "text-gain"
                : item.margin != null && item.margin < 0
                  ? "text-loss"
                  : "",
            )}
          >
            {formatGp(item.margin)}
          </span>
        </div>
      </div>

      <div className="sm:hidden">
        <button
          type="button"
          aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
          onClick={(e) => {
            e.stopPropagation();
            watchlist.toggle(item.id);
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-3 hover:text-fg",
            watched && "text-warn",
          )}
        >
          <Star className={cn("h-4 w-4", watched && "fill-current")} />
        </button>
      </div>

      <Cell className="hidden sm:block" value={formatGp(buy)} />
      <Cell className="hidden sm:block" value={formatGp(sell)} />
      <Cell
        className="hidden sm:block"
        value={formatGp(item.margin)}
        sub={formatPercent(item.marginPct)}
        tone={
          item.margin == null
            ? undefined
            : item.margin > 0
              ? "gain"
              : item.margin < 0
                ? "loss"
                : undefined
        }
      />
      <Cell className="hidden sm:block" value={formatVolume(item.volume1h)} />

      <button
        type="button"
        aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
        onClick={(e) => {
          e.stopPropagation();
          watchlist.toggle(item.id);
        }}
        className={cn(
          "hidden h-9 w-9 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-3 hover:text-fg sm:flex",
          watched && "text-warn",
        )}
      >
        <Star className={cn("h-4 w-4", watched && "fill-current")} />
      </button>
    </div>
  );
}

function Cell({
  value,
  sub,
  tone,
  className,
}: {
  value: string;
  sub?: string;
  tone?: "gain" | "loss";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 text-right", className)}>
      <div
        className={cn(
          "truncate text-sm tabular font-medium",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
          !tone && "text-fg",
        )}
      >
        {value}
      </div>
      {sub && <div className="truncate text-xs tabular text-subtle">{sub}</div>}
    </div>
  );
}
