/**
 * Layman-facing metric copy for Flip Lab.
 * Labels stay short; tooltips carry the “why.”
 *
 * Product law: teach the player job first (find / size / sit / alch / hold).
 * Decision-strip metrics first; chip density lives under “More signals.”
 * Best ≠ Hot. Alch ≠ flip. Invest ≠ second flip list.
 */

export type MetricGuide = {
  id: string;
  title: string;
  short: string;
  why: string;
  howToRead: string;
};

/** Act-now strip — keep ids stable (ItemDetail / chips / FlipBoard tooltips). */
export const KEY_DECISION_METRICS: MetricGuide[] = [
  {
    id: "fillScore",
    title: "Will it fill?",
    short: "0–100: will both your buy and sell actually complete?",
    why: "A fat after-tax gap is useless if an offer sits forever. This mixes recent trades on both sides, how fresh prices are, and spike risk. It is a wiki-trade estimate — not a timer, not the GE book, not a bot label.",
    howToRead:
      "70+ usually fine · 45–69 size carefully · under 45 high risk of stuck items. Always glance at live offers before a full limit.",
  },
  {
    id: "netSpread",
    title: "Flip profit / item",
    short:
      "Same-day edge after the 2% sell tax (5m GP cap). Sales under 100 gp have no GE tax. Best uses hour/5m averages. Hot uses last prints. The instant ticket can disagree — that is not a second rank.",
    why: "Tax is 2% on the sell (capped at 5m GP). Sales under 100 gp have no GE tax. Best can stay green while last prints look red — sit both sides, don’t force instants. Hot is the last-trade story on purpose; treat it as faster and faker.",
    howToRead:
      "Green flip profit + OK fill = classic same-day play. Red instant edge alone ≠ skip if Best is green — sit offers. Don’t merge Best and Hot into one list.",
  },
  {
    id: "gpHour",
    title: "GP per hour",
    short:
      "Modelled recycle rate using your Starting GP, the 4h buy limit, and recent trades — not a promise.",
    why: "Biggest profit per item isn’t always best. How fast you turn the stack back into cash matters. Empty Starting GP means Best/Hot cannot size this.",
    howToRead:
      "Compare items at the same bankroll. Then read What’s stopping you — limit, trades, or cash. Start smaller than the stack if fill is shaky.",
  },
  {
    id: "bottleneck",
    title: "What's stopping you",
    short: "Buy limit, market trades, or your cash — which one caps the flip?",
    why: "Tells you whether to wait on the 4h limit, pick a busier item, or bring more GP. Don’t just type a bigger qty.",
    howToRead:
      "Buy limit → 4h clock. Market trades → don’t assume full-limit hours. Cash → raise Starting GP or pick a cheaper item.",
  },
  {
    id: "quickPlan",
    title: "Reliable sits (avg fills)",
    short:
      "Where the GE has been clearing lately (1h/5m averages on Best; last prints on Hot) — not the lowest spike on the 24h chart.",
    why: "Chart lows are often thin dumps you cannot sit and fill. Same-day GP/h assumes both legs complete near these sit prices. Sitting the chart floor can mean stuck GP.",
    howToRead:
      "Type sit-buy / sit-sell and leave them. If chart low ≪ sit-buy, that’s normal — patient undercuts are optional and slower, and are not what the green GP/h assumes.",
  },
  {
    id: "regime",
    title: "How busy",
    short: "Busy vs quiet over the last hour (hourly trade counts) — not the last five minutes.",
    why: "Quiet hours show fake-looking profits. Busy hours fill faster but more people compete. Pair this with Trades last 5m to see if the hour is still alive right now.",
    howToRead:
      "Busy/OK = flip-friendly. Quiet = long wait. Trade rush = temporary. Drying up = risk of stalling.",
  },
  {
    id: "fresh",
    title: "Price freshness",
    short: "How recent the last buy-now and sell-now trades were.",
    why: "Old prices invent profits nobody is trading. Always re-check stale items in the GE.",
    howToRead:
      "Both sides under ~1h = more trustworthy. Stale = don’t full-limit until you verify in-game.",
  },
  {
    id: "imbalance",
    title: "Buy vs sell flow",
    short: "Are people dumping more, or snatching buys more, in the last hour?",
    why: "You need both a buy fill and a sell fill. Heavy dumps = easy entry, hard exit.",
    howToRead:
      "More dumps → plan the sell before you buy a full limit. More snipes → buying may wait; selling is easier.",
  },
  {
    id: "trend",
    title: "Price direction",
    short:
      "Sideways, climbing, or falling over a fixed ~24h window (not the chart lookback you click).",
    why: "“Buy the dip” fails when the whole market is sliding. Signals stay on the item; the chart is only for zooming detail.",
    howToRead:
      "Sideways + profit = classic flip. Falling = be careful. Climbing = don’t fight it blindly.",
  },
  {
    id: "edge",
    title: "Margin vs wobble",
    short:
      "Is your after-tax profit bigger than typical ~24h price bounce? Independent of which chart range you open.",
    why: "If prices usually bounce more than your profit, one bad move can erase the flip. Chart 6h/7d is for inspection only.",
    howToRead: "Strong = margin bigger than wobble. Weak = noise can wipe you out.",
  },
  {
    id: "spike",
    title: "Vs hour average",
    short:
      "Where the last mid sits vs the last hour’s typical middle — under = dip zone, way over = chase risk. Not the Hot tab.",
    why: "One panic dump or FOMO print can fake a fat gap. The hour average is a calmer “fair” level for short sits.",
    howToRead:
      "Under ~2%+ → possible dip-buy / turnaround. Near 0 → fair. Way above → don’t chase; size small or wait.",
  },
  {
    id: "recoverToAvg",
    title: "Hour context",
    short:
      "Dip size, reclaim GP, premium vs hour mid, or model-edge size — extra context beside Flip profit. Not a second invest plan.",
    why: "Shows if last prices are cheap or rich vs this hour without inventing a hold thesis. Invest lives on the Invest tab (polls / news / updates).",
    howToRead:
      "Green reclaim GP = possible bounce to hour mid. −% dip with tax warning = careful. +% premium = don’t chase. Model edge = same-day after-tax sit profit.",
  },
  {
    id: "pace",
    title: "Trades last 5m",
    short:
      "How many real GE trades just happened — not “5 million GP.” A trade count in the last five minutes, not the same as How busy (1h).",
    why: "The last hour can look fine while the last five minutes went dead (or the reverse). That’s when fills stall right now.",
    howToRead: "Busy = market moving now. Quiet = fills may stall. Steady = normal pace.",
  },
];

export const METRIC_BY_ID: Record<string, MetricGuide> = Object.fromEntries(
  KEY_DECISION_METRICS.map((m) => [m.id, m]),
);

/** Chip id → KEY_DECISION_METRICS id. Keep keys stable unless Quant adds a chip. */
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

/** First five: can I act in ~30s? Rest are chips / More detail. */
export const DECISION_STRIP_IDS = [
  "fillScore",
  "netSpread",
  "gpHour",
  "bottleneck",
  "quickPlan",
] as const;

export const DECISION_STRIP_METRICS: MetricGuide[] = DECISION_STRIP_IDS.map(
  (id) => METRIC_BY_ID[id]!,
);

export const MORE_SIGNAL_METRICS: MetricGuide[] = KEY_DECISION_METRICS.filter(
  (m) => !(DECISION_STRIP_IDS as readonly string[]).includes(m.id),
);

export type SurfaceJob = {
  id: string;
  tab: string;
  job: string;
  do: string;
  dont: string;
};

/** Which tab for which player job. Not new surfaces — teaching only. */
export const SURFACE_JOBS: SurfaceJob[] = [
  {
    id: "best",
    tab: "Best",
    job: "Find a reliable same-day flip",
    do: "Hour/5m averages, both-side volume, your Starting GP. Sit both legs.",
    dont: "Not last-print chasing. Not a second Invest list.",
  },
  {
    id: "hot",
    tab: "Hot",
    job: "Chase a last-trade gap",
    do: "Latest high/low prints. Check fill + last-5m pace before you click.",
    dont: "Don’t merge with Best. One print can reverse.",
  },
  {
    id: "alch",
    tab: "Alch",
    job: "Click-cast downtime GP",
    do: "High-alch − insta-buy − nature rune. GP/h is the 3s tick, not a GE fill.",
    dont: "Don’t rank alchs as flips. Starting GP does not sort this list.",
  },
  {
    id: "invest",
    tab: "Invest",
    job: "Hold a thesis through an update",
    do: "Polls, official news, wiki updates, then related items. Size so you can exit.",
    dont: "Not a second Best list. Momentum ≠ sit-flip rank.",
  },
  {
    id: "watch",
    tab: "Watch",
    job: "Keep a basket on this device",
    do: "Star items you already decided to track. Local only — no account.",
    dont: "Not ranked. Empty until you star something.",
  },
  {
    id: "volume",
    tab: "Volume",
    job: "See the busiest tape",
    do: "Highest 1h trade count. Use it to hunt liquidity, then open Best/Hot to size.",
    dont: "Not post-tax flip rank. Busy ≠ profitable.",
  },
];

/**
 * Canonical Starting GP teaching. CapitalBar.tsx is UI-owned —
 * paste these strings there; do not import chrome from Product.
 */
export const STARTING_GP_GUIDE = {
  title: "Starting GP",
  short:
    "Sizes Best/Hot stacks and GP/h to this cash, the 4h buy limit, and 1h trades. Empty = no flip list.",
  subtitle:
    "Best and Hot size qty and GP/h to this cash, the 4h buy limit, and 1h trades. Alch and Invest are different jobs.",
  footer:
    "Type k / m / b. 2% GE tax is on the sell. Best sits hour averages (spikes ignored). Hot uses last prints — do not mix the two. Empty Starting GP hides the flip lists. Saved on this device only.",
  mobile:
    "Sizes Best/Hot stacks to this cash. Empty = no flip list. Alch/Invest ignore this for rank.",
  why: "Wrong bankroll = wrong qty and a fake GP/h. Alch is a nature-rune engine. Invest is a hold thesis.",
  howToRead:
    "Set it before you pick an item. Compare GP/h at the same number. Local only — no sign-in.",
};

export const QUICK_PLAYBOOK = [
  {
    step: "1",
    title: "Set Starting GP",
    body: "Best/Hot qty and GP/h are for this cash. Empty hides those lists. Alch and Invest do not rank from this number.",
  },
  {
    step: "2",
    title: "Pick Best or Hot — don’t mix them",
    body: "Best = sit hour averages (reliable). Hot = last prints (faster, faker). Alch is click-cast downtime. Invest is a hold thesis, not a flip rank.",
  },
  {
    step: "3",
    title: "After-tax profit AND a fill",
    body: "Need a green Flip profit and a workable Will it fill? Quiet, stale, or one-sided flow = stuck GP. A raw high−low gap does not count.",
  },
  {
    step: "4",
    title: "Sit the reliable prices",
    body: "Type the sit-buy / sit-sell and leave them. Last prints are typing aids. Chart lows are often thin dumps — not what GP/h assumes.",
  },
  {
    step: "5",
    title: "Size to the bottleneck, then open the GE",
    body: "Limit, trades, or cash. Use stack size as a guide, not a command. Start smaller if anything looks stale, quiet, or weird vs the hour.",
  },
];
