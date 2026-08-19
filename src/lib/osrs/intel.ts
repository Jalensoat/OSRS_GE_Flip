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

const UA = "OSRS Flip Lab (https://osrs-ge-flip.vercel.app; investment intel)";
const INTEL_TIMEOUT_MS = 8_000;

const MARKET_FACTORS: MarketFactor[] = [
  {
    id: "new-content",
    title: "New bosses / raids / areas",
    effect:
      "New loot dumps supply (prices fall), while required gear and supplies spike on release day. Named uniques only matter on the GE after they exist and print.",
    examples:
      "Hallowfell, Crimson Kisten, Necklace of Rupture, ancestral, brews, restores — not unreleased raid names",
  },
  {
    id: "skilling",
    title: "Skilling & training meta shifts",
    effect:
      "Method buffs/nerfs move demand for resources (herbs, logs, ores, secondaries, agility inputs).",
    examples: "Herbs, grimy herbs, summer pie, mithril grapple, planks, coal, pure essence",
  },
  {
    id: "sailing",
    title: "Sailing (live skill)",
    effect:
      "Sailing blogs and patches reprice ship materials and sea resources before and after each drop. Still a structural skill, not a one-week event.",
    examples: "Cannonball, teak/mahogany/oak planks, steel bar, coal, tackle-box fish supplies",
  },
  {
    id: "pvp-bh",
    title: "PvP / bounty / wilderness changes",
    effect:
      "Risk and reward changes hit food, brews, amulets, and popular PvP gear. Permanent Deadman worlds are not the same as a league week.",
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
    title: "Official polls & lock-in blogs",
    effect:
      "Passed questions reprice gear and supplies before and after the update ships. Failed ones often dump rumor pumps. Lock-in ≠ release.",
    examples:
      "Fractured Archive lock-in (Aug 2026, raid not out), CoX unique weights, Wyrmscraig uniques",
  },
  {
    id: "leagues-deadman",
    title: "Leagues / Deadman / temporary modes",
    effect:
      "Temporary game modes spike cosmetics and prep items, then dump after. Leagues VI (Apr 2026) is in the settle/dump window unless a new league is announced.",
    examples: "Old school bond, popular alchables, food, teleport items",
  },
];

const KEYWORD_HINTS: { re: RegExp; tag: string; hint: string }[] = [
  {
    re: /fractured archive|rondache|zorya|ascension crossbow|\bbreaker\b/i,
    tag: "New raid",
    hint: "Fractured Archive lock-in closed 10 Aug 2026 — raid not released. Watch competing crush/mage/range prints and raid supplies; do not treat named rewards as live GE until they print.",
  },
  {
    re: /wyrmscraig|hallowfell|jeweller'?s chisel|mad angel|fallen from grace/i,
    tag: "Wyrmscraig",
    hint: "Wyrmscraig is live (29 Jul 2026+). Hallowfell and chisel can dump as killcount/crafting volume ramps; this is not generic PvM.",
  },
  {
    re: /blood moon|maggot king|vampyrium|crimson kisten|necklace of rupture|seeker arrow/i,
    tag: "Blood Moon",
    hint: "Blood Moon / Maggot King is in the post-release settle (30 Jun 2026+). Watch kisten, rupture, and Seeker Arrow vs older ranged amulets.",
  },
  {
    re: /chambers of xeric|\bcox\b|theatre of blood|\btob\b|tombs of amascut|\btoa\b|\bnex\b|dt2|yama|doom of mokhaiotl|\braid\b/i,
    tag: "PvM",
    hint: "Watch related gear, supplies, and new drops for supply dumps. CoX unique weights already shipped 12 Aug 2026 — treat ancestral/scrolls as settle, not a rumor.",
  },
  {
    re: /agility|sepulchre|colossal wyrm|hallowed|summer sweep/i,
    tag: "Agility",
    hint: "Agility sweep (12 Aug 2026) changed Sepulchre floors, Colossal Wyrm intensity, and grapple shortcuts — inputs like summer pie and mithril grapple can reprice.",
  },
  {
    re: /skilling|herblore|farming|mining|fishing|woodcut|fletching|crafting|runecraft|\bsailing\b/i,
    tag: "Skilling",
    hint: "Resource and secondary prices often reprice around method changes.",
  },
  {
    re: /pvp|bounty hunter|\bwilderness\b|\bbh\b|deadman/i,
    tag: "PvP",
    hint: "Combat supplies and popular PvP gear demand can swing quickly.",
  },
  {
    re: /\bbond\b|membership|premier club/i,
    tag: "Economy",
    hint: "Macro GP pressure — bond and staple prices may follow.",
  },
  {
    re: /grand exchange|\bge tax\b|buy limit|trade limit|2%\s*tax/i,
    tag: "GE",
    hint: "Direct market structure change — recalculate post-tax flip margins.",
  },
  {
    re: /\bleagues?\b|trailblazer|grid master|gridmaster/i,
    tag: "Temp mode",
    hint: "Temporary demand spikes; plan exits before the mode ends. Do not treat a settled league as a fresh spike.",
  },
  {
    re: /bronzeman|ruff situation|crab quest/i,
    tag: "Mode/quest",
    hint: "Bronzeman / quest poll (opened 14 Aug 2026). Usually mild GE unless the blood-rune dog sink actually ships — do not front-run a failed poll.",
  },
  {
    re: /poll|lock-in|roadmap|upcoming update/i,
    tag: "Poll",
    hint: "Poll outcomes move prices early — size so you can exit if it fails. Lock-in is not a release.",
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
    re: /fractured archive|rondache|zorya|ascension crossbow|\bbreaker\b/i,
    tag: "Fractured Archive",
    hint: "Lock-in closed 10 Aug 2026; raid not released. Related prices are competing crush/mage/range and raid supplies — named rewards are not live GE until they print.",
    terms: [
      "rondache",
      "zorya's tome",
      "ascension crossbow",
      "elder maul",
      "inquisitor's mace",
      "tumeken's shadow",
      "twisted bow",
      "scythe of vitur",
      "saradomin brew",
      "super restore",
    ],
  },
  {
    re: /wyrmscraig|hallowfell|jeweller'?s chisel|mad angel|fallen from grace|sunstone golem|goat hunting/i,
    tag: "Wyrmscraig",
    hint: "Live island (29 Jul 2026+). Hallowfell can dump as Mad Angel volume ramps; Jeweller's Chisel tracks golem crafting — not a CoX/ToB unique basket.",
    terms: [
      "hallowfell",
      "jeweller's chisel",
      "necklace of passage",
      "slayer ring",
      "gem bag",
      "sunlight antelope",
    ],
  },
  {
    re: /blood moon|maggot king|vampyrium|crimson kisten|necklace of rupture|seeker arrow/i,
    tag: "Blood Moon",
    hint: "Released 30 Jun 2026 — settle/hotfix phase. Kisten, Rupture, and Seeker Arrows vs older ranged swaps; do not treat this as a fresh launch spike.",
    terms: [
      "crimson kisten",
      "necklace of rupture",
      "necklace of anguish",
      "amulet of rancour",
      "seeker arrow",
      "elder maul",
    ],
  },
  {
    re: /chambers of xeric|\bcox\b|olm|raids 1|twisted bow|metamorphic|tekton|ancestral/i,
    tag: "CoX",
    hint: "Unique weightings shipped 12 Aug 2026 (ancestral up, prayer scrolls down). This is a settle window, not a pre-blog front-run.",
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
      "dragon claws",
      "arcane prayer scroll",
      "dexterous prayer scroll",
      "twisted ancestral",
      "metamorphic dust",
    ],
  },
  {
    re: /theatre of blood|\btob\b|scythe|sanguinesti|avernic|verzik/i,
    tag: "ToB",
    hint: "ToB uniques swing on balance and entry-cost changes. 12 Aug 2026 removed the party-make timeout — mild, not a loot dump.",
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
    re: /agility|sepulchre|colossal wyrm|hallowed mark|summer sweep/i,
    tag: "Agility",
    hint: "12 Aug 2026 Sweep-Up: Sepulchre floors lowered, Colossal Wyrm longer/lower intensity, many grapples now barehanded. Watch summer pie and mithril grapple — not boss uniques.",
    terms: [
      "summer pie",
      "mithril grapple",
      "dark essence",
      "hallowed mark",
      "termites",
    ],
  },
  {
    re: /inquisitor|oathplate/i,
    tag: "Inquisitor",
    hint: "Summer Sweep-Up Gear & PvM (wiki 2026) buffed Inquisitor crush bonuses vs Oathplate. Settle on helm/hauberk/skirt/mace — not a new drop table.",
    terms: [
      "inquisitor's great helm",
      "inquisitor's hauberk",
      "inquisitor's plateskirt",
      "inquisitor's mace",
      "oathplate",
    ],
  },
  {
    re: /\bsailing\b|\bcannonball\b|\bships?\b|\bboats?\b|barracuda|\bred reef\b|leechfin/i,
    tag: "Sailing",
    hint: "Sailing is a live skill with ongoing official patches (fishing at sea 5 Aug 2026). Materials reprice on blogs — do not match generic 'port' or 'report'.",
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
    re: /pvp|bounty hunter|\bwilderness\b|deadman|\bbh\b/i,
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
    re: /slayer|\bnex\b|\byama\b|doom of mokhaiotl|dt2|vardorvis|duke sucellus|\bleviathan\b|\bwhisperer\b/i,
    tag: "Bossing",
    hint: "Boss gear and supplies reprice when drop tables or kill methods change. Does not include Wyrmscraig or Colossal Wyrm agility.",
    terms: [
      "scythe of vitur",
      "tumeken's shadow",
      "torva",
      "virtus",
      "sanguinesti",
      "burning claws",
    ],
  },
  {
    re: /bronzeman|ruff situation|crab quest/i,
    tag: "Mode/quest",
    hint: "Poll opened 14 Aug 2026 — results were not locked in this audit. Official text mentions a possible blood-rune sink if dog trading ships; otherwise mild GE. Do not assume it passed.",
    terms: ["blood rune"],
  },
  {
    re: /\bleagues?\b|grid master|trailblazer/i,
    tag: "Temp mode",
    hint: "Prep items and cosmetics spike into the mode, then dump after. Leagues VI launched 15 Apr 2026 — treat as settle/dump unless a new league is announced.",
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
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 8s abort + one 429 retry (Retry-After, cap 5s). Throws on HTTP failure. */
async function intelFetch(url: string, accept: string): Promise<Response> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= 1; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), INTEL_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: accept },
        signal: ctrl.signal,
      });
      if (res.status === 429 && attempt === 0) {
        const ra = Number(res.headers.get("retry-after"));
        const wait =
          Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 5_000) : 500;
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`Intel fetch ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0 && lastErr.message.includes("429")) {
        await sleep(500);
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error("Intel fetch failed");
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
  const res = await intelFetch(
    "https://secure.runescape.com/m=news/latest_news.rss?oldschool=true",
    "application/rss+xml, application/xml, text/xml",
  );
  return parseRss(await res.text());
}

async function fetchWikiUpdates(): Promise<{ title: string; link: string }[]> {
  const url =
    "https://oldschool.runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Game_updates&cmsort=timestamp&cmdir=desc&cmlimit=10&format=json";
  const res = await intelFetch(url, "application/json");
  const data = (await res.json()) as {
    query?: { categorymembers?: { title: string }[] };
  };
  return (data.query?.categorymembers ?? [])
    .filter((m) => m.title.startsWith("Update:"))
    .filter((m) => !/^Update:RS2 Launched!/i.test(m.title))
    .slice(0, 8)
    .map((m) => ({
      title: m.title.replace(/^Update:/, ""),
      link: `https://oldschool.runescape.wiki/w/${encodeURIComponent(m.title.replace(/ /g, "_"))}`,
    }));
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
  const url =
    "https://oldschool.runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Polls&cmsort=timestamp&cmdir=desc&cmlimit=12&format=json";
  const res = await intelFetch(url, "application/json");
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
}

let intelCache: { at: number; data: IntelPayload } | null = null;
const INTEL_TTL = 10 * 60 * 1000;

export const fetchIntel = createServerFn({ method: "GET" }).handler(
  async (): Promise<IntelPayload> => {
    const now = Date.now();
    if (intelCache && now - intelCache.at < INTEL_TTL) {
      return intelCache.data;
    }
    try {
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
    } catch {
      if (intelCache) return intelCache.data;
      return {
        news: [],
        updates: [],
        polls: [],
        factors: MARKET_FACTORS,
        fetchedAt: now,
      };
    }
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
        thesis: `Mid is ~${changePct.toFixed(1)}% above the 1h wiki average on live volume — a short-term print, not a hold thesis. 2% tax and stale highs still apply.`,
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
        thesis: `Mid is ~${Math.abs(changePct).toFixed(1)}% below the 1h wiki average — a print dip, not a fundamental. Skip if the 1h series looks stale or a dump is still printing.`,
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
        thesis:
          "Thick 1h wiki volume — easier to size stacks, but 4h buy limits and 2% tax still cap the flip.",
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
