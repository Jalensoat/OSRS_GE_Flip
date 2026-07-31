import { useState } from "react";
import { BookOpen, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KEY_DECISION_METRICS, QUICK_PLAYBOOK } from "@/lib/osrs/metricGuide";
import { cn } from "@/lib/utils";

/** Compact header control + full explainer modal. */
export function FlipGuideButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">How to read</span>
        <span className="sm:hidden">Guide</span>
      </Button>
      {open && <FlipGuideModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** Collapsible strip inside item detail (defaults open on full page once per session idea — here open by default on first render when expanded prop). */
export function FlipGuidePanel({
  defaultOpen = false,
  className,
}: {
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-md border border-border bg-surface-2/30", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
        aria-expanded={open}
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1 text-[11px] font-semibold text-fg">
          How to read these metrics
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-subtle transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-2.5 py-2.5 text-[11px] leading-snug text-muted">
          <PlaybookList compact />
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
              Key decision factors
            </div>
            <div className="space-y-2">
              {KEY_DECISION_METRICS.map((m) => (
                <div key={m.id} className="rounded border border-border/80 bg-bg/40 px-2 py-1.5">
                  <div className="font-medium text-fg">{m.title}</div>
                  <div className="mt-0.5 text-muted">{m.why}</div>
                  <div className="mt-0.5 text-subtle">{m.howToRead}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaybookList({ compact }: { compact?: boolean }) {
  return (
    <ol className={cn("space-y-1.5", compact && "space-y-1")}>
      {QUICK_PLAYBOOK.map((p) => (
        <li key={p.step} className="flex gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
            {p.step}
          </span>
          <div className="min-w-0">
            <span className="font-medium text-fg">{p.title}</span>
            <span className="text-muted"> — {p.body}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function FlipGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-bg/75"
        aria-label="Close guide"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flip-guide-title"
        className="relative z-10 flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-2xl sm:rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="flip-guide-title" className="text-sm font-semibold text-fg">
            How to read Flip Lab metrics
          </h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3 text-xs leading-relaxed text-muted">
          <p>
            Rank items by <span className="text-fg">real profit you can actually complete</span>: after
            tax, both buy and sell fills, and how fast your GP recycles — not by a big raw price gap.
            Ringed cards and highlighted chips are stand-outs (good or risky). Hover anything for more.
          </p>
          <p className="rounded-md border border-border bg-bg/50 px-2.5 py-2 text-[11px]">
            <span className="font-medium text-fg">“Trades last 5m” is not 5 million GP.</span> It’s
            how many times this item actually traded in the last five minutes — a trade count, not a
            GE setting. The hour can look busy while the last five minutes went quiet — that means
            fills feel slow <em>right now</em>.
          </p>
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-subtle">
              Decision checklist
            </div>
            <PlaybookList />
          </div>
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-subtle">
              Why each factor matters
            </div>
            <div className="space-y-2">
              {KEY_DECISION_METRICS.map((m) => (
                <div key={m.id} className="rounded-md border border-border bg-bg/50 px-3 py-2">
                  <div className="text-sm font-medium text-fg">{m.title}</div>
                  <p className="mt-1 text-muted">{m.why}</p>
                  <p className="mt-1 text-subtle">
                    <span className="font-medium text-fg">How to read: </span>
                    {m.howToRead}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-subtle">
            Research notes for agents live in <code className="text-muted">docs/ITEM_INTELLIGENCE.md</code>{" "}
            and <code className="text-muted">docs/research/</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
