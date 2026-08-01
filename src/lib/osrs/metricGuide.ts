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
    title: "Will it fill?",
    short: "0–100: will both your buy and sell actually complete?",
    why: "A big price gap is useless if your offer sits forever. This mixes recent trades on both sides, how fresh prices are, and spike risk.",
    howToRead: "70+ usually fine · 45–69 size carefully · under 45 high risk of stuck items.",
  },
  {
    id: "netSpread",
    title: "Flip profit / item",
    short:
      "Same-day flip edge after tax. The big number uses hour averages (like the main table). Last GE prints can look worse — that’s “instant edge,” not the table model.",
    why: "Tax is 2% on the sell (capped at 5m GP). Instant last trades can be red while average-based flips (the list) stay green — sit offers instead of forcing instants.",
    howToRead:
      "Green flip profit + OK fill = classic same-day play. Red instant edge alone ≠ skip if model is green — sit offers, don’t force instants.",
  },
  {
    id: "regime",
    title: "How busy",
    short: "Busy vs quiet trading right now (from hourly trade counts).",
    why: "Quiet items show fake-looking profits. Busy items fill faster but more people compete.",
    howToRead: "Busy/OK = flip-friendly. Quiet = long wait. Trade rush = temporary. Drying up = risk of stalling.",
  },
  {
    id: "fresh",
    title: "Price freshness",
    short: "How recent the last buy-now and sell-now trades were.",
    why: "Old prices invent profits nobody is trading. Always re-check stale items in the GE.",
    howToRead: "Both sides under ~1h = more trustworthy. Stale = don’t full-limit until you verify in-game.",
  },
  {
    id: "imbalance",
    title: "Buy vs sell flow",
    short: "Are people dumping more, or snatching buys more, in the last hour?",
    why: "You need both a buy fill and a sell fill. Heavy dumps = easy entry, hard exit.",
    howToRead: "More dumps → plan the sell. More snipes → buying may wait; selling is easier.",
  },
  {
    id: "trend",
    title: "Price direction",
    short: "Sideways, climbing, or falling over a fixed ~24h window (not the chart lookback you click).",
    why: "“Buy the dip” fails when the whole market is sliding. Signals stay on the item; the chart is only for zooming detail.",
    howToRead: "Sideways + profit = classic flip. Falling = be careful. Climbing = don’t fight it blindly.",
  },
  {
    id: "edge",
    title: "Margin vs wobble",
    short: "Is your profit bigger than typical ~24h price bounce? Independent of which chart range you open.",
    why: "If prices usually bounce more than your profit, one bad move can erase the flip. Chart 6h/7d is for inspection only.",
    howToRead: "Strong = margin bigger than wobble. Weak = noise can wipe you out.",
  },
  {
    id: "gpHour",
    title: "GP per hour",
    short: "Modelled money rate using your cash, buy limit, and trade activity.",
    why: "Biggest profit per item isn’t always best. How fast you recycle GP matters.",
    howToRead: "Compare items at the same bankroll. Check what stops you: limit, trades, or cash.",
  },
  {
    id: "bottleneck",
    title: "What's stopping you",
    short: "Buy limit, market trades, or your cash — which one caps the flip?",
    why: "Tells you whether to wait on the 4h limit, pick a busier item, or bring more GP.",
    howToRead: "Buy limit → 4h clock. Market trades → don’t assume full-limit hours. Cash → raise bank or pick cheaper.",
  },
  {
    id: "spike",
    title: "Vs hour average",
    short:
      "Where the last mid price sits vs the last hour’s typical middle — under = dip zone, way over = hype.",
    why: "One panic dump or FOMO print can fake a fat gap. The hour average is a calmer “fair” level for short holds.",
    howToRead:
      "Under ~2%+ → possible dip-buy / turnaround. Near 0 → fair. Way above → don’t chase; size small or wait.",
  },
  {
    id: "recoverToAvg",
    title: "Context edge",
    short:
      "Dip size, reclaim GP, premium vs hour mid, or model edge magnitude — context beside the main flip profit card.",
    why: "Shows if last prices are cheap/rich vs the hour without inventing a second investment plan.",
    howToRead:
      "Green reclaim GP = possible bounce to hour mid. −% dip with tax warning = careful. +% premium = don’t chase. Model edge = same-day after-tax sit profit.",
  },
  {
    id: "quickPlan",
    title: "Reliable sits (avg fills)",
    short:
      "Where the GE has been clearing lately (1h/5m averages) — not the lowest spike on the 24h chart.",
    why: "Chart lows are often thin dumps that you cannot sit and fill. Same-day GP/h assumes both legs complete near average clear prices. Sitting at the chart floor can mean stuck GP.",
    howToRead:
      "Type sit-buy / sit-sell and leave them. If chart low ≪ sit-buy, that’s normal — patient undercuts are optional and slower, and are not what the green GP/h assumes.",
  },
  {
    id: "pace",
    title: "Trades last 5m",
    short:
      "How many real GE trades just happened — not “5 million GP.” Just a trade count in the last five minutes.",
    why: "The last hour can look fine while the last five minutes went dead (or the reverse).",
    howToRead: "Busy = market moving now. Quiet = fills may stall. Steady = normal pace.",
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
    title: "Is there real profit after tax?",
    body: "Profit per item must stay green after the 2% sell tax — a big raw gap doesn’t count.",
  },
  {
    step: "2",
    title: "Will both sides actually fill?",
    body: "Check “Will it fill?”, buy vs sell flow, and trades in the last 5 minutes. Quiet or one-sided = your GP gets stuck.",
  },
  {
    step: "3",
    title: "Is the price calm enough?",
    body: "Sideways chart + profit bigger than the normal wobble is the classic flip. Falling hard = don’t force it.",
  },
  {
    step: "4",
    title: "What's actually stopping you?",
    body: "4h buy limit, not enough market trades, or not enough cash? Fix that — don’t just spam a bigger qty.",
  },
  {
    step: "5",
    title: "Size for real life, then verify in the GE",
    body: "Use stack size / GP per hour as a guide, not a promise. Open the item in-game, glance at live offers, then buy — start smaller if anything looks stale, quiet, or weird vs the hour.",
  },
];
