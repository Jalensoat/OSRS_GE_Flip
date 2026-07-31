import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CatalogItem } from "@/lib/osrs/api";
import { formatGp, formatVolume } from "@/lib/osrs/format";
import { flipBuyPrice, flipSellPrice } from "@/lib/osrs/listFilters";
import { ItemIcon } from "./ItemIcon";
import { cn } from "@/lib/utils";

/**
 * Typeahead results for PC and mobile. Portaled + fixed so header overflow /
 * stacking never clips it on desktop.
 */
export function SearchDropdown({
  open,
  query,
  results,
  onSelect,
  onClose,
  anchorRef,
}: {
  open: boolean;
  query: string;
  results: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
  /** Search field wrapper or input — used to position the panel */
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const updateBox = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBox({
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    updateBox();
    window.addEventListener("resize", updateBox);
    window.addEventListener("scroll", updateBox, true);
    return () => {
      window.removeEventListener("resize", updateBox);
      window.removeEventListener("scroll", updateBox, true);
    };
  }, [open, query, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // pointerdown so we don't race input focus handlers
    document.addEventListener("pointerdown", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !query.trim() || !box || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      role="listbox"
      aria-label="Search results"
      style={{
        position: "fixed",
        top: box.top,
        left: box.left,
        width: box.width,
        zIndex: 200,
      }}
      className={cn(
        "max-h-[min(22rem,50vh)] overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl",
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
                  onPointerDown={(e) => {
                    // Prevent input blur-before-click losing the selection
                    e.preventDefault();
                  }}
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
    </div>,
    document.body,
  );
}
