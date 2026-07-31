import { useEffect, useRef } from "react";
import type { CatalogItem } from "@/lib/osrs/api";
import { formatGp, formatVolume } from "@/lib/osrs/format";
import { flipBuyPrice, flipSellPrice } from "@/lib/osrs/listFilters";
import { ItemIcon } from "./ItemIcon";
import { cn } from "@/lib/utils";

export function SearchDropdown({
  open,
  query,
  results,
  onSelect,
  onClose,
  className,
}: {
  open: boolean;
  query: string;
  results: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !query.trim()) return null;

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="Search results"
      className={cn(
        "absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[min(22rem,55vh)] overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl",
        className,
      )}
    >
      {results.length === 0 ? (
        <div className="px-3 py-4 text-center text-sm text-muted">
          No items match “{query.trim()}”
        </div>
      ) : (
        <ul className="py-1">
          {results.map((item) => {
            const buy = flipBuyPrice(item);
            const sell = flipSellPrice(item);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-2"
                  onClick={() => onSelect(item)}
                >
                  <ItemIcon icon={item.icon} name={item.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{item.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-subtle">
                      <span className="tabular">
                        {formatGp(buy)}→{formatGp(sell)}
                      </span>
                      <span
                        className={cn(
                          "tabular",
                          item.margin != null && item.margin > 0 && "text-gain",
                          item.margin != null && item.margin < 0 && "text-loss",
                        )}
                      >
                        {formatGp(item.margin)}
                      </span>
                      <span className="tabular">{formatVolume(item.volume1h)}/h</span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
