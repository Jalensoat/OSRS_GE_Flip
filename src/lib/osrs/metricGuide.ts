/**
 * Layman-facing metric copy for Flip Lab.
 * Labels stay short; tooltips carry the “why.”
 */

export type MetricGuide = {
  id: string;
  title: string;
  short: string;
  why: string;
  howToRead: string;
};

export const KEY_DECISION_METRICS: MetricGuide[] = [
  {
    id: "fillScore",
    title: "How easy fills",
    short: "0–100: will both your buy and sell actually complete?",
    why: "A big wiki gap is useless if offers sit forever. This blends recent trades on both sides, how fresh the last prices are, and spike risk.",
    howToRead: "70+ usually fine · 45–69 size carefully · under 45 high risk of getting stuck.",
  },
  {
    id: "netSpread",
    title: "Profit per item",
    short: "GP left after GE tax if you buy low and sell high at last prices.",
    why: "Tax is 2% on the sell (capped at 5m). Many “green” pre-tax margins are zero after tax.",
    howToRead: "Must stay clearly positive after tax. Tiny % vs noisy charts = easy to lose the edge.",
  },
  {
    id: "regime",
    title: "Market depth",
    short: "Busy vs quiet trading right now (from hourly trade counts).",
    why: "Quiet items show fake-looking profits. Busy items fill faster but competition is higher.",
    howToRead: "Busy/OK = flip-friendly. Quiet = treat as long hold. Spike = temporary rush. Slowing = risk of dry-up.",
  },
  {
    id: "fresh",
    title: "Data age",
    short: "How recent the last “buy now” and “sell now” trades were.",
    why: "Old prices invent margins nobody is trading. Always re-check stale items in-game.",
    howToRead: "Fresh (under ~1h both sides) = trustworthy. Stale = don’t full-limit until you verify.",
  },
  {
    id: "imbalance",
    title: "Buy vs sell pressure",
    short: "Are people dumping more, or snatching buys more, in the last hour?",
    why: "You need both a buy fill and a sell fill. Heavy dumps make entry easy and exit hard.",
    howToRead: "More dumps → plan the sell carefully. More snipes → buying may wait; selling is easier.",
  },
  {
    id: "trend",
    title: "Price direction",
    short: "Sideways, climbing, or falling over the chart window.",
    why: "“Buy the dip” fails when the whole market is sliding. Don’t catch knives.",
    howToRead: "Sideways + profit = classic flip. Falling = avoid dip-buys. Climbing = don’t fade blindly.",
  },
  {
    id: "edge",
    title: "Edge vs noise",
    short: "Is your profit buffer bigger than normal price wobble?",
    why: "If the chart jumps more than your profit, one bad move can erase the flip.",
    howToRead: "Strong = margin bigger than wobble. Weak = noise can wipe the edge.",
  },
  {
    id: "gpHour",
    title: "GP per hour",
    short: "Modelled money rate using your bankroll, limit, and trade activity.",
    why: "Biggest per-item profit isn’t always best. Speed of recycling GP matters.",
    howToRead: "Compare items at the same bankroll. Check what limits you (limit, trades, or cash).",
  },
  {
    id: "bottleneck",
    title: "What limits you",
    short: "Buy limit, market trades, or bankroll — which one caps the flip?",
    why: "Tells you whether to wait on the 4h limit, pick a busier item, or add capital.",
    howToRead: "Buy limit → 4h clock. Market trades → don’t assume full-limit hours. Cash → raise bank or pick cheaper.",
  },
  {
    id: "spike",
    title: "Vs hourly average",
    short: "Last prices vs the last hour’s typical mid — hype or dump check.",
    why: "One panic or FOMO trade can fake a fat gap. Smoothed hour prices keep you honest.",
    howToRead: "Big gap from the hour average → size small or wait for prices to settle.",
  },
  {
    id: "pace",
    title: "Last 5 min trades",
    short: "How many trades just happened vs a normal slice of the hour.",
    why: "The last hour can look fine while the last five minutes went dead (or the reverse).",
    howToRead: "Hot = market moving now. Cooling = fills may stall. Steady = normal pace.",
  },
];

export const METRIC_BY_ID: Record<string, MetricGuide> = Object.fromEntries(
  KEY_DECISION_METRICS.map((m) => [m.id, m]),
);

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
    title: "Is there real profit?",
    body: "Profit per item after tax must be clearly positive — not just a big gap before tax.",
  },
  {
    step: "2",
    title: "Will it fill?",
    body: "How easy fills + buy vs sell pressure + last 5 min trades. Thin or one-sided = stuck GP.",
  },
  {
    step: "3",
    title: "Is the market calm enough?",
    body: "Price direction sideways and edge bigger than noise favors classic flips. Falling = be careful.",
  },
  {
    step: "4",
    title: "What limits you?",
    body: "Buy limit, market trades, or bankroll — fix the real bottleneck, not a random setting.",
  },
  {
    step: "5",
    title: "Size for reality",
    body: "GP per hour and safe stack size already bake limit and activity. Don’t force full limits on quiet items.",
  },
];
