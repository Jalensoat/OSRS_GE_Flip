import { createServerFn } from "@tanstack/react-start";
import type { CatalogItem } from "./api";

export type NewsItem = {
  title: string;
  link: string;
  date: string | null;
  summary: string;
  tags: string[];
  marketHint: string;
};

export type MarketFactor = {
  id: string;
  title: string;
  effect: string;
  examples: string;
};

export type TrendPick = {
  id: number;
  name: string;
  icon?: string;
  mid: number | null;
  changePct: number;
  volume1h: number;
  thesis: string;
  members: boolean;
};

export type PollItem = {
  title: string;
  link: string;
  tags: string[];
  marketHint: string;
  /** Search terms used to match related GE items */
  matchTerms: string[];
};

export type PollRelatedItem = {
  id: number;
  name: string;
  icon?: string;
  mid: number | null;
  changePct: number | null;
  volume1h: number;
};

export type PollImpact = PollItem & {
  related: PollRelatedItem[];
};

export type IntelPayload = {
  news: NewsItem[];
  updates: { title: string; link: string }[];
  polls: PollItem[];
  factors: MarketFactor[];
  fetchedAt: number;
};

const UA = "OSRS-GE-Tracker/1.0 (xAI Grok Build; investment intel)";

const MARKET_FACTORS: MarketFactor[] = [
  {
    id: "new-content",
    title: "New bosses / raids / areas",
    effect:
      "New loot dumps supply (prices fall), while required gear and supplies spike on release day.",
    examples: "Scythe, shadow, torva, food, potions, runes, teleport tabs",
  },
  {
    id: "skilling",
    title: "Skilling & training meta shifts",
    effect:
      "Method buffs/nerfs move demand for resources (herbs, logs, ores, secondaries).",
    examples: "Herbs, grimy herbs, secondaries, planks, coal, pure essence",
  },
  {
    id: "pvp-bh",
    title: "PvP / bounty / wilderness changes",
    effect:
      "Risk and reward changes hit food, brews, amulets, and popular PvP gear.",
    examples: "Anglerfish, brews, restores, smite gear, wilderness weapons",
  },
  {
    id: "bonds",
    title: "Bonds, membership promos, gold sinks",
    effect:
      "Bond price and membership events shift GP→USD pressure and overall GE liquidity.",
    examples: "Old school bond, high-value staples used as GP stores",
  },
  {
    id: "tax-limits",
    title: "GE tax & buy limits",
    effect:
      "2% tax (5m cap) kills thin margins; limit changes alter max flip size per 4h.",
    examples: "High-volume low-margin runes vs high-ticket rare gear",
  },
  {
    id: "polls",
    title: "Wiki / game polls",
    effect:
      "Passed questions reprice gear and supplies before and after the update ships. Failed ones often dump rumor pumps.",
    examples: "CoX uniques, skilling resources, new boss pre-reqs, raid supplies",
  },
  {
    id: "leagues-deadman",
    title: "Leagues / Deadman / temporary modes",
    effect:
      "Temporary game modes spike cosmetics and prep items, then dump after.",
    examples: "League rewards, popular alchables, food, teleport items",
  },
];

const KEYWORD_HINTS: { re: RegExp; tag: string; hint: string }[] = [
  {
    re: /boss|raid|tob|cox|toa|nex|dt2|yama|doom|wyrm|chambers of xeric|theatre of blood|tombs of amascut/i,
    tag: "PvM",
    hint: "Watch related gear, supplies, and new drops for supply dumps.",
  },
  {
    re: /skilling|herblore|farming|agility|mining|fishing|woodcut|fletching|crafting|runecraft|sailing/i,
    tag: "Skilling",
    hint: "Resource and secondary prices often reprice around method changes.",
  },
  {
    re: /pvp|bounty|wilderness|bh|deadman/i,
    tag: "PvP",
    hint: "Combat supplies and popular PvP gear demand can swing quickly.",
  },
  {
    re: /bond|membership|premier|jagex/i,
    tag: "Economy",
    hint: "Macro GP pressure — bond and staple prices may follow.",
  },
  {
    re: /ge|grand exchange|tax|trade|limit/i,
    tag: "GE",
    hint: "Direct market structure change — recalculate flip margins.",
  },
  {
    re: /league|trailblazer|grid|gridmaster/i,
    tag: "Temp mode",
    hint: "Temporary demand spikes; plan exits before the mode ends.",
  },
  {
    re: /poll|blog|roadmap|upcoming|lock-in/i,
    tag: "Poll",
    hint: "Poll outcomes move prices early — size so you can exit if it fails.",
  },
  {
    re: /mobile|client|performance|bug|hotfix|known issue/i,
    tag: "QoL",
    hint: "Usually mild GE impact unless a money-maker is blocked or fixed.",
  },
];

/**
 * Map poll title keywords → GE item name fragments to surface live prices.
 * Order matters: first matching baskets win tags; all matching terms accumulate.
 */
const POLL_BASKETS: {
  re: RegExp;
  tag: string;
  hint: string;
  terms: string[];
}[] = [
  {
    re: /chambers of xeric|\bcox\b|olm|raids 1|twisted|metamorphic|tekton/i,
    tag: "CoX",
    hint: "CoX uniques, kits, and raid supplies often reprice hard around poll blogs and patches.",
    terms: [
      "twisted bow",
      "ancestral hat",
      "ancestral robe top",
      "ancestral robe bottom",
      "kodai wand",
      "kodai insignia",
      "elder maul",
      "dinhs bulwark",
      "dinh's bulwark",
      "twisted buckler",
      "dragon hunter crossbow",
      "arcane prayer scroll",
      "dexterous prayer scroll",
      "twisted ancestral",
      "metamorphic dust",
      "olmlet",
    ],
  },
  {
    re: /theatre of blood|\btob\b|scythe|sanguinesti|avernic|verzik/i,
    tag: "ToB",
    hint: "ToB uniques and supplies swing on balance and entry-cost changes.",
    terms: [
      "scythe of vitur",
      "sanguinesti staff",
      "ghrazi rapier",
      "avernic defender",
      "justiciar",
    ],
  },
  {
    re: /tombs of amascut|\btoa\b|shadow of tumeken|masori|osmumten/i,
    tag: "ToA",
    hint: "ToA uniques and invocation meta gear reprice with raid changes.",
    terms: [
      "tumeken's shadow",
      "masori",
      "elidinis' ward",
      "lightbearer",
      "osmumten's fang",
    ],
  },
  {
    re: /sailing|ship|cannonball|port|boat/i,
    tag: "Sailing",
    hint: "Sailing polls move resources, ship parts, and related skilling items early.",
    terms: [
      "cannonball",
      "teak plank",
      "mahogany plank",
      "steel bar",
      "iron ore",
      "coal",
      "oak plank",
    ],
  },
  {
    re: /herblore|herb|potion|farming|seed/i,
    tag: "Herblore",
    hint: "Herb and secondary prices track training meta and supply rate changes.",
    terms: [
      "grimy torstol",
      "grimy ranarr",
      "grimy snapdragon",
      "torstol",
      "ranarr weed",
      "snapdragon",
      "super restore",
      "saradomin brew",
      "prayer potion",
    ],
  },
  {
    re: /pvp|bounty|wilderness|deadman|bh\b/i,
    tag: "PvP",
    hint: "Food, brews, and popular PvP gear demand shift with risk/reward changes.",
    terms: [
      "anglerfish",
      "manta ray",
      "saradomin brew",
      "super restore",
      "amulet of fury",
      "dragon claws",
      "armadyl godsword",
    ],
  },
  {
    re: /slayer|boss|nex|yama|doom|wyrm|dt2|vardorvis|duke|leviathan|whisperer/i,
    tag: "Bossing",
    hint: "Boss gear and supplies reprice when drop tables or kill methods change.",
    terms: [
      "scythe of vitur",
      "tumeken's shadow",
      "torva",
      "virtus",
      "sang",
      "burning claws",
    ],
  },
  {
    re: /league|grid master|trailblazer|deadman/i,
    tag: "Temp mode",
    hint: "Prep items and cosmetics spike into the mode, then dump after.",
    terms: ["old school bond", "super combat potion", "shark", "rune arrow"],
  },
  {
    re: /clan|chat|player tweak|qol|quality of life/i,
    tag: "QoL",
    hint: "Usually mild GE impact — watch only if a money-maker is touched.",
    terms: [],
  },
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/"/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function tagBlob(blob: string): { tags: string[]; marketHint: string } {
  const tags: string[] = [];
  const hints: string[] = [];
  for (const k of KEYWORD_HINTS) {
    if (k.re.test(blob)) {
      tags.push(k.tag);
      hints.push(k.hint);
    }
  }
  return {
    tags: tags.length ? [...new Set(tags)] : ["General"],
    marketHint: hints[0] ?? "Monitor related supplies and gear if the update ships.",
  };
}

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<item>/i).slice(1);
  for (const block of blocks.slice(0, 12)) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const date =
      block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? null;
    const descRaw =
      block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ??
      "";
    if (!title || !link) continue;
    const summary = stripHtml(descRaw).slice(0, 220);
    const blob = `${title} ${summary}`;
    const { tags, marketHint } = tagBlob(blob);
    items.push({
      title: stripHtml(title),
      link: link.trim(),
      date,
      summary,
      tags,
      marketHint,
    });
  }
  return items;
}

async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://secure.runescape.com/m=news/latest_news.rss?oldschool=true",
      { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" } },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}

async function fetchWikiUpdates(): Promise<{ title: string; link: string }[]> {
  try {
    const url =
      "https://oldschool.runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Game_updates&cmsort=timestamp&cmdir=desc&cmlimit=10&format=json";
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { categorymembers?: { title: string }[] };
    };
    return (data.query?.categorymembers ?? [])
      .filter((m) => m.title.startsWith("Update:"))
      .slice(0, 8)
      .map((m) => ({
        title: m.title.replace(/^Update:/, ""),
        link: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.title.replace(/ /g, "_"))}`,
      }));
  } catch {
    return [];
  }
}

function annotatePoll(title: string): Pick<PollItem, "tags" | "marketHint" | "matchTerms"> {
  const tags: string[] = [];
  const hints: string[] = [];
  const terms: string[] = [];
  for (const b of POLL_BASKETS) {
    if (b.re.test(title)) {
      tags.push(b.tag);
      hints.push(b.hint);
      terms.push(...b.terms);
    }
  }
  if (!tags.length) {
    const fallback = tagBlob(title);
    return {
      tags: fallback.tags.includes("Poll") ? fallback.tags : ["Poll", ...fallback.tags],
      marketHint: fallback.marketHint,
      matchTerms: [],
    };
  }
  return {
    tags: [...new Set(tags)],
    marketHint: hints[0]!,
    matchTerms: [...new Set(terms.map((t) => t.toLowerCase()))],
  };
}

async function fetchPolls(): Promise<PollItem[]> {
  try {
    const url =
      "https://oldschool.runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Polls&cmsort=timestamp&cmdir=desc&cmlimit=12&format=json";
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { categorymembers?: { title: string }[] };
    };
    return (data.query?.categorymembers ?? [])
      .filter((m) => m.title.startsWith("Poll:"))
      .slice(0, 10)
      .map((m) => {
        const clean = m.title.replace(/^Poll:/, "");
        const meta = annotatePoll(clean);
        return {
          title: clean,
          link: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.title.replace(/ /g, "_"))}`,
          ...meta,
        };
      });
  } catch {
    return [];
  }
}

let intelCache: { at: number; data: IntelPayload } | null = null;
const INTEL_TTL = 10 * 60 * 1000;

export const fetchIntel = createServerFn({ method: "GET" }).handler(
  async (): Promise<IntelPayload> => {
    const now = Date.now();
    if (intelCache && now - intelCache.at < INTEL_TTL) {
      return intelCache.data;
    }
    const [news, updates, polls] = await Promise.all([
      fetchNews(),
      fetchWikiUpdates(),
      fetchPolls(),
    ]);
    const data: IntelPayload = {
      news,
      updates,
      polls,
      factors: MARKET_FACTORS,
      fetchedAt: now,
    };
    intelCache = { at: now, data };
    return data;
  },
);

/** Attach live catalog prices to poll match terms. */
export function buildPollImpacts(
  polls: PollItem[],
  items: CatalogItem[],
): PollImpact[] {
  const byLower = items.map((it) => ({
    it,
    name: it.name.toLowerCase(),
  }));

  return polls.map((poll) => {
    const related: PollRelatedItem[] = [];
    if (poll.matchTerms.length) {
      for (const term of poll.matchTerms) {
        for (const { it, name } of byLower) {
          if (!name.includes(term)) continue;
          if (related.some((r) => r.id === it.id)) continue;
          const ref = it.avgHigh1h ?? it.avgLow1h ?? it.mid;
          let changePct: number | null = null;
          if (it.mid != null && ref != null && ref > 0) {
            changePct = ((it.mid - ref) / ref) * 100;
          }
          related.push({
            id: it.id,
            name: it.name,
            icon: it.icon,
            mid: it.mid,
            changePct,
            volume1h: it.volume1h,
          });
        }
      }
    }
    // Prefer movers + liquid names
    related.sort((a, b) => {
      const ca = Math.abs(a.changePct ?? 0);
      const cb = Math.abs(b.changePct ?? 0);
      return cb - ca || b.volume1h - a.volume1h;
    });
    return { ...poll, related: related.slice(0, 8) };
  });
}

/** Momentum / investment candidates from live catalog (no extra API). */
export function buildTrendPicks(items: CatalogItem[], bankroll: number): {
  rising: TrendPick[];
  dipping: TrendPick[];
  volumeSurges: TrendPick[];
} {
  const rising: TrendPick[] = [];
  const dipping: TrendPick[] = [];
  const volumeSurges: TrendPick[] = [];

  for (const it of items) {
    if (it.high == null || it.mid == null || it.volume1h < 20) continue;
    if (bankroll > 0 && it.high > bankroll * 1.05) continue;

    const ref = it.avgHigh1h ?? it.avgLow1h;
    if (ref == null || ref <= 0) continue;
    const changePct = ((it.mid - ref) / ref) * 100;

    if (changePct >= 1.5 && it.volume1h >= 30) {
      rising.push({
        id: it.id,
        name: it.name,
        icon: it.icon,
        mid: it.mid,
        changePct,
        volume1h: it.volume1h,
        thesis: `Trading ~${changePct.toFixed(1)}% above the 1h average with solid volume — short-term momentum.`,
        members: it.members,
      });
    } else if (changePct <= -2 && it.volume1h >= 30) {
      dipping.push({
        id: it.id,
        name: it.name,
        icon: it.icon,
        mid: it.mid,
        changePct,
        volume1h: it.volume1h,
        thesis: `Down ~${Math.abs(changePct).toFixed(1)}% vs 1h avg — possible dip-buy if fundamentals hold (higher risk).`,
        members: it.members,
      });
    }

    if (it.volume1h >= 5000 && it.high != null && it.high >= 100 && it.high <= bankroll) {
      volumeSurges.push({
        id: it.id,
        name: it.name,
        icon: it.icon,
        mid: it.mid,
        changePct,
        volume1h: it.volume1h,
        thesis: "Deep liquidity — easier entries/exits for larger stacks.",
        members: it.members,
      });
    }
  }

  rising.sort((a, b) => b.changePct - a.changePct);
  dipping.sort((a, b) => a.changePct - b.changePct);
  volumeSurges.sort((a, b) => b.volume1h - a.volume1h);

  return {
    rising: rising.slice(0, 12),
    dipping: dipping.slice(0, 12),
    volumeSurges: volumeSurges.slice(0, 12),
  };
}
