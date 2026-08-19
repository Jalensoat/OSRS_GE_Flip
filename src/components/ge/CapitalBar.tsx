import { Wallet, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBankroll } from "@/lib/osrs/bankroll";
import { parseGpInput } from "@/lib/osrs/flip";
import { formatGp } from "@/lib/osrs/format";
import { STARTING_GP_GUIDE } from "@/lib/osrs/metricGuide";
import { cn } from "@/lib/utils";

const PRESETS = ["1m", "5m", "10m", "25m", "50m", "100m", "500m", "1b"];

export function CapitalBar({ className }: { className?: string }) {
  const { input, setInput } = useBankroll();
  const gp = parseGpInput(input);

  return (
    <div
      className={cn(
        "min-w-0 w-full max-w-full rounded-lg border border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:items-start sm:gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 sm:mt-0.5 sm:h-8 sm:w-8">
            <Wallet className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-fg">{STARTING_GP_GUIDE.title}</div>
            <p className="lg:hidden text-[11px] text-muted leading-snug">
              {STARTING_GP_GUIDE.mobile}
            </p>
            <p className="hidden text-xs text-muted leading-snug lg:block">
              {STARTING_GP_GUIDE.subtitle}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2 sm:items-end">
          <div className="flex min-w-0 items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="50m"
              aria-label="Starting GP"
              className="h-9 w-32 min-w-0 tabular font-medium sm:h-10 sm:w-40"
            />
            <div className="shrink-0 text-sm tabular text-muted whitespace-nowrap">
              = {formatGp(gp || null)}
            </div>
          </div>
          <div className="flex min-w-0 max-w-full flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setInput(p)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors sm:px-2.5 sm:py-1 sm:text-xs",
                  input.toLowerCase() === p
                    ? "border-border-strong bg-surface-3 text-fg"
                    : "border-border bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 hidden items-start gap-1.5 text-[11px] text-subtle lg:flex">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{STARTING_GP_GUIDE.footer}</span>
      </div>
    </div>
  );
}
