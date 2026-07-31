/**
 * User-facing explanations for intelligence metrics.
 * Grounded in docs/research + ITEM_INTELLIGENCE.md.
 */

export type MetricGuide = {
  id: string;
  title: string;
  /** One line for tooltips */
  short: string;
  /** Why it matters for flipping */
  why: string;
  /** What good / bad looks like */
  howToRead: string;
};

/** Decision-critical metrics (emphasized in UI). */
export const KEY_DECISION_METRICS: MetricGuide[] = [
  {
    id: "fillScore",
    title: "Fill score",
    short: "How realistic both buy and sell fills look (0–100).",
    why: "A fat wiki margin is useless if you cannot complete both legs. Fill score combines two-sided volume, print freshness, imbalance, and spike risk into one action number.",
    howToRead: "70+ workable · 45–69 size carefully · under 45 high stuck-inventory risk.",
  },
  {
    id: "netSpread",
    title: "Net spread",
    short: "High − low − GE tax on the sell (real edge, not raw gap).",
    why: "2% tax (capped at 5m) kills thin spreads. Pre-tax “green” margins are often zero after tax.",
    howToRead: "Must stay positive after tax with buffer for undercuts. Compare % to local volatility.",
  },
  {
    id: "regime",
    title: "Liquidity regime",
    short: "Thick / mixed / thin / spike / drying — from 1h and 5m two-sided volume.",
    why: "Thin books create phantom margins. Thick books fill faster but compress edge. Spikes open a window; drying mid-hold traps capital.",
    howToRead: "Prefer thick/mixed for flips. Thin = merch/hold, not day-flip. Spike = opportunity + compression risk.",
  },
  {
    id: "fresh",
    title: "Print freshness",
    short: "How recent the last high and low trades are.",
    why: "Stale high/low inflate spreads that nobody is actually trading. Classic margin-bait trap.",
    howToRead: "Both sides under ~1h: trustworthy. Multi-hour stale: re-check in-game before committing.",
  },
  {
    id: "imbalance",
    title: "Volume imbalance",
    short: "Insta-buy volume vs insta-sell volume in the last hour.",
    why: "A flip needs both legs. Heavy dumps with weak buys = easy entry, hard exit (inventory risk).",
    howToRead: "Skewed toward sells → plan the sell leg first. Skewed toward buys → buy leg competes harder.",
  },
  {
    id: "trend",
    title: "Trend",
    short: "Range vs up vs down from mid price over the chart lookback.",
    why: "Mean-reversion (“buy the dip”) fails on trend days. Catching knives destroys bankroll.",
    howToRead: "Range + good spread = classic harvest. Downtrend = avoid pure dip-buys. Uptrend = don’t fade blindly.",
  },
  {
    id: "edge",
    title: "Edge vs volatility",
    short: "Is after-tax % margin larger than local mid noise?",
    why: "If price wiggles more than your edge, mean-reversion EV collapses even when the spread looks fat.",
    howToRead: "Strong = margin outruns noise. Weak = noise can erase the flip before you exit.",
  },
  {
    id: "gpHour",
    title: "Est. GP / hour",
    short: "Bankroll-sized profit after tax, limited by volume and buy limit.",
    why: "Biggest raw margin is not best use of capital. Throughput (limit × fills × time) drives real GP/hour.",
    howToRead: "Compare across items with the same bankroll. Check bottleneck: limit, volume, or capital.",
  },
  {
    id: "bottleneck",
    title: "Bottleneck",
    short: "What caps your cycle: buy limit, market volume, or bankroll.",
    why: "Tells you whether more GP, more patience, or a different item fixes the constraint.",
    howToRead: "Buy limit → cycle on the 4h clock. Volume → don’t assume full-limit hours. Capital → raise bank or pick cheaper items.",
  },
  {
    id: "spike",
    title: "Vs 1h average",
    short: "Last prints vs smoothed 1h mid — FOMO or dump detector.",
    why: "Instant high/low can be one panic or hype print. Averaged prices show if you’re chasing noise.",
    howToRead: "Large gap from 1h mid = size small or wait for mid to settle before full limit.",
  },
  {
    id: "pace",
    title: "5m pace",
    short: "Is volume heating up or cooling vs the 1h baseline?",
    why: "Dry-ups mid-hold trap capital. Spikes open temporary fill windows but margins compress.",
    howToRead: "Hot = window open. Cooling = exit risk rising. Stable = normal regime.",
  },
];

export const METRIC_BY_ID: Record<string, MetricGuide> = Object.fromEntries(
  KEY_DECISION_METRICS.map((m) => [m.id, m]),
);

/** Map chip ids from itemInsights to guide ids */
export const CHIP_GUIDE_ID: Record<string, string> = {
  regime: "regime",
  trend: "trend",
  stale: "fresh",
  fresh: "fresh",
  imbalance: "imbalance",
  spike: "spike",
  edge: "edge",
  pace: "pace",
};

export const QUICK_PLAYBOOK = [
  {
    step: "1",
    title: "Is the spread real?",
    body: "Need fresh high and low prints and two-sided volume (watch min of ↑ and ↓). Wide + stale + thin = bait.",
  },
  {
    step: "2",
    title: "Can both legs fill?",
    body: "Use fill score and imbalance. A great buy into dead sells = stuck inventory.",
  },
  {
    step: "3",
    title: "Is the mid stable?",
    body: "Range + edge stronger than local volatility favors classic flips. Downtrend = don’t catch knives.",
  },
  {
    step: "4",
    title: "What binds you?",
    body: "Bottleneck says if buy limit, market volume, or bankroll caps GP/hour — fix the right constraint.",
  },
  {
    step: "5",
    title: "Size with the model",
    body: "Est. GP/hour already folds tax, limit, and volume. Don’t assume full-limit cycles on thin books.",
  },
];
