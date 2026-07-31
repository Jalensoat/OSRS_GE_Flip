import { useState } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EMPTY_FILTERS,
  countActiveFilters,
  type ListFilterState,
} from "@/lib/osrs/listFilters";

function RangeField({
  label,
  min,
  max,
  onMin,
  onMax,
  placeholder = "e.g. 1m",
}: {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <Input
          value={min}
          onChange={(e) => onMin(e.target.value)}
          placeholder="Min"
          inputMode="decimal"
          aria-label={`${label} minimum`}
          className="h-9 min-w-0 px-2 text-sm lg:h-8 lg:text-xs"
        />
        <span className="text-xs text-subtle">–</span>
        <Input
          value={max}
          onChange={(e) => onMax(e.target.value)}
          placeholder="Max"
          inputMode="decimal"
          aria-label={`${label} maximum`}
          className="h-9 min-w-0 px-2 text-sm lg:h-8 lg:text-xs"
        />
      </div>
      <p className="text-[10px] text-subtle">{placeholder}</p>
    </div>
  );
}

export function ListFilters({
  value,
  onChange,
  className,
}: {
  value: ListFilterState;
  onChange: (next: ListFilterState) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(value);

  const set = <K extends keyof ListFilterState>(key: K, v: ListFilterState[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className={cn("border-b border-border bg-bg", className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            open || active > 0
              ? "border-border-strong bg-surface-2 text-fg"
              : "border-border bg-surface text-muted hover:text-fg",
          )}
          aria-expanded={open}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {active > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-primary-fg tabular">
              {active}
            </span>
          )}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
        {active > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <span className="ml-auto hidden text-[11px] text-subtle sm:inline">
          Min / max support k, m, b (e.g. 500k, 1.5m)
        </span>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={value.f2pOnly}
              onChange={(e) => set("f2pOnly", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[var(--color-accent)]"
            />
            Show only free-to-play items
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <RangeField
              label="Buy limit"
              min={value.limitMin}
              max={value.limitMax}
              onMin={(v) => set("limitMin", v)}
              onMax={(v) => set("limitMax", v)}
              placeholder="e.g. 8 – 10000"
            />
            <RangeField
              label="Buy price"
              min={value.buyMin}
              max={value.buyMax}
              onMin={(v) => set("buyMin", v)}
              onMax={(v) => set("buyMax", v)}
            />
            <RangeField
              label="Sell price"
              min={value.sellMin}
              max={value.sellMax}
              onMin={(v) => set("sellMin", v)}
              onMax={(v) => set("sellMax", v)}
            />
            <RangeField
              label="Margin"
              min={value.marginMin}
              max={value.marginMax}
              onMin={(v) => set("marginMin", v)}
              onMax={(v) => set("marginMax", v)}
              placeholder="Net margin after tax"
            />
            <RangeField
              label="Volume (1h)"
              min={value.volumeMin}
              max={value.volumeMax}
              onMin={(v) => set("volumeMin", v)}
              onMax={(v) => set("volumeMax", v)}
              placeholder="Trades in last hour"
            />
            <RangeField
              label="Potential profit"
              min={value.potentialMin}
              max={value.potentialMax}
              onMin={(v) => set("potentialMin", v)}
              onMax={(v) => set("potentialMax", v)}
              placeholder="Margin × min(limit, 1h vol)"
            />
            <RangeField
              label="Margin × volume"
              min={value.marginVolMin}
              max={value.marginVolMax}
              onMin={(v) => set("marginVolMin", v)}
              onMax={(v) => set("marginVolMax", v)}
              placeholder="Margin × 1h volume"
            />
          </div>
        </div>
      )}
    </div>
  );
}
