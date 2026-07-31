import { useQuery } from "@tanstack/react-query";
import {
  fetchIntel,
  buildTrendPicks,
  buildPollImpacts,
  type TrendPick,
  type NewsItem,
  type MarketFactor,
  type PollImpact,
} from "@/lib/osrs/intel";
import type { CatalogItem } from "@/lib/osrs/api";
import { formatGp, formatPercent, formatVolume } from "@/lib/osrs/format";
import { ItemIcon } from "./ItemIcon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Waves,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function InvestBoard({
  items,
  bankroll,
  onSelectItem,
}: {
  items: CatalogItem[];
  bankroll: number;
  onSelectItem: (id: number) => void;
}) {
  const intel = useQuery({
    queryKey: ["intel"],
    queryFn: () => fetchIntel(),
    staleTime: 10 * 60_000,
  });

  const trends = buildTrendPicks(items, bankroll > 0 ? bankroll : 50_000_000);
  const pollImpacts = useMemo(
    () => buildPollImpacts(intel.data?.polls ?? [], items),
    [intel.data?.polls, items],
  );

  return (
    <div className="space-y-6 p-3 sm:p-4">
      <div className="rounded-lg border border-warn/25 bg-warn/5 px-3 py-2.5 text-xs text-muted leading-relaxed">
        <div className="mb-1 flex items-center gap-1.5 font-medium text-warn">
          <AlertTriangle className="h-3.5 w-3.5" />
          Not financial advice
        </div>
        Investment ideas combine live price momentum with polls, official news, and known GE
        drivers. Polls (e.g. CoX changes) can reprice uniques days before the patch — size so you
        can exit.
      </div>

      {/* Polls + related GE movers */}
      <section>
        <SectionTitle
          icon={<Vote className="h-4 w-4" />}
          title="Wiki polls & related prices"
          sub="Recent polls with live GE items that historically move when these pass or fail"
        />
        {intel.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : intel.isError ? (
          <p className="text-sm text-loss">Could not load polls right now.</p>
        ) : pollImpacts.length === 0 ? (
          <p className="text-xs text-muted">No recent polls returned from the wiki.</p>
        ) : (
          <div className="space-y-3">
            {pollImpacts.map((p) => (
              <PollCard key={p.link} poll={p} onSelectItem={onSelectItem} />
            ))}
          </div>
        )}
      </section>

      {/* News & updates */}
      <section>
        <SectionTitle
          icon={<Newspaper className="h-4 w-4" />}
          title="Updates & market news"
          sub="Pulled live from Old School news + wiki game updates"
        />
        {intel.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : intel.isError ? (
          <p className="text-sm text-loss">Could not load news right now.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wide text-subtle">
                Official news
              </h4>
              {(intel.data?.news ?? []).slice(0, 6).map((n) => (
                <NewsCard key={n.link + n.title} item={n} />
              ))}
              {!intel.data?.news?.length && (
                <p className="text-xs text-muted">No news items returned.</p>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wide text-subtle">
                Wiki game updates
              </h4>
              <div className="rounded-lg border border-border bg-surface divide-y divide-border">
                {(intel.data?.updates ?? []).map((u) => (
                  <a
                    key={u.link}
                    href={u.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-fg hover:bg-surface-2 transition-colors"
                  >
                    <span className="min-w-0 truncate">{u.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-subtle" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Trends */}
      <section className="grid gap-4 lg:grid-cols-3">
        <TrendColumn
          icon={<TrendingUp className="h-4 w-4 text-gain" />}
          title="Rising now"
          sub="Above 1h average"
          picks={trends.rising}
          tone="gain"
          onSelect={onSelectItem}
        />
        <TrendColumn
          icon={<TrendingDown className="h-4 w-4 text-loss" />}
          title="Dipping"
          sub="Below 1h average"
          picks={trends.dipping}
          tone="loss"
          onSelect={onSelectItem}
        />
        <TrendColumn
          icon={<Waves className="h-4 w-4 text-accent" />}
          title="Deep liquidity"
          sub="Easy to enter/exit"
          picks={trends.volumeSurges}
          tone="neutral"
          onSelect={onSelectItem}
        />
      </section>

      {/* Historical factors */}
      <section>
        <SectionTitle
          icon={<BookOpen className="h-4 w-4" />}
          title="What usually moves the GE"
          sub="Historical drivers — use with polls & news above"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {(intel.data?.factors ?? []).map((f) => (
            <FactorCard key={f.id} factor={f} />
          ))}
          {intel.isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
        </div>
      </section>
    </div>
  );
}

function PollCard({
  poll,
  onSelectItem,
}: {
  poll: PollImpact;
  onSelectItem: (id: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <a
            href={poll.link}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-1.5"
          >
            <h4 className="text-sm font-medium text-fg leading-snug group-hover:text-accent">
              {poll.title}
            </h4>
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
          </a>
          <p className="mt-1 text-xs text-muted leading-relaxed">{poll.marketHint}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {poll.tags.map((t) => (
              <Badge key={t} variant={t === "CoX" || t === "ToB" || t === "ToA" ? "warn" : "default"}>
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {poll.related.length > 0 ? (
        <div className="divide-y divide-border">
          <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
            Related GE prices (vs 1h avg)
          </div>
          {poll.related.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectItem(r.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-2"
            >
              <ItemIcon icon={r.icon} name={r.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-fg">{r.name}</div>
                <div className="text-[11px] tabular text-subtle">
                  {formatGp(r.mid)} · {formatVolume(r.volume1h)}/h
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs tabular font-semibold",
                  r.changePct != null && r.changePct > 0.5
                    ? "text-gain"
                    : r.changePct != null && r.changePct < -0.5
                      ? "text-loss"
                      : "text-muted",
                )}
              >
                {formatPercent(r.changePct)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="px-3 py-2.5 text-xs text-muted">
          No direct item matches — open the poll for the full question list.
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <div className="mt-0.5 text-muted">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        <p className="text-xs text-muted">{sub}</p>
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-fg leading-snug">{item.title}</h4>
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
      </div>
      {item.date && (
        <div className="mt-1 text-[11px] text-subtle">
          {new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}
      {item.summary && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted leading-relaxed">{item.summary}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {item.tags.map((t) => (
          <Badge key={t} variant="default">
            {t}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-xs text-accent leading-snug">{item.marketHint}</p>
    </a>
  );
}

function TrendColumn({
  icon,
  title,
  sub,
  picks,
  tone,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  picks: TrendPick[];
  tone: "gain" | "loss" | "neutral";
  onSelect: (id: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
          {icon}
          {title}
        </div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {picks.length === 0 ? (
          <p className="p-3 text-xs text-muted">No matches for current filters.</p>
        ) : (
          picks.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <ItemIcon icon={p.icon} name={p.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">{p.name}</span>
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular font-medium",
                      tone === "gain" && "text-gain",
                      tone === "loss" && "text-loss",
                      tone === "neutral" && "text-accent",
                    )}
                  >
                    {formatPercent(p.changePct)}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] tabular text-subtle">
                  {formatGp(p.mid)} · {formatVolume(p.volume1h)}/h
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted leading-snug">{p.thesis}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function FactorCard({ factor }: { factor: MarketFactor }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <h4 className="text-sm font-medium text-fg">{factor.title}</h4>
      <p className="mt-1 text-xs text-muted leading-relaxed">{factor.effect}</p>
      <p className="mt-2 text-[11px] text-subtle">
        <span className="font-medium text-muted">Often hits: </span>
        {factor.examples}
      </p>
    </div>
  );
}
