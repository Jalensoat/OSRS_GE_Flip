#!/usr/bin/env node
/**
 * Capture PC + mobile stills (and a short walkthrough video) of production
 * into docs/references/visual-corpus/. Used when sibling-agent artifacts
 * are not mounted in this workspace.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.argv[2] || "https://osrs-ge-flip.vercel.app/";
const OUT = process.argv[3] || "/workspace/docs/references/visual-corpus";
const timeoutMs = 60_000;

const tabs = [
  { name: "best", label: /best flips|best/i },
  { name: "hot", label: /hot flips|^hot$/i },
  { name: "alch", label: /high alch|^alch$/i },
  { name: "invest", label: /invest/i },
];

mkdirSync(join(OUT, "current-app"), { recursive: true });
mkdirSync(join(OUT, "walkthrough"), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function clickTab(page, re) {
  const btn = page.getByRole("button", { name: re }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

async function captureViewport(width, height, prefix) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForTimeout(2500);
  for (const tab of tabs) {
    await clickTab(page, tab.label);
    await page.screenshot({
      path: join(OUT, "current-app", `${prefix}-${tab.name}.png`),
      fullPage: false,
    });
  }
  const row = page.locator("button, [role='row'], a").filter({ hasText: /shark|rune|log|ore|bow|bone/i }).first();
  if (await row.count()) {
    await row.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(OUT, "current-app", `${prefix}-item-detail.png`),
      fullPage: false,
    });
  }
  await page.close();
}

const videoCtx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: join(OUT, "walkthrough"), size: { width: 1280, height: 800 } },
});
const videoPage = await videoCtx.newPage();
await videoPage.goto(BASE, { waitUntil: "domcontentloaded", timeout: timeoutMs });
await videoPage.waitForTimeout(2000);
for (const tab of tabs) {
  await clickTab(videoPage, tab.label);
  await videoPage.waitForTimeout(700);
}
await videoPage.close();
await videoCtx.close();

await captureViewport(1280, 800, "pc");
await captureViewport(390, 844, "mobile");

await browser.close();
console.log(JSON.stringify({ ok: true, out: OUT, url: BASE }));
