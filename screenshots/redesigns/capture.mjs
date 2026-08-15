#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = dirname(fileURLToPath(import.meta.url));
const htmlDir = resolve(root, "html");
mkdirSync(root, { recursive: true });

const shots = [
  { file: "option-a-command-deck-pc.html", out: "option-a-command-deck-pc.png", w: 1440, h: 900 },
  { file: "option-a-command-deck-mobile.html", out: "option-a-command-deck-mobile.png", w: 390, h: 844 },
  { file: "option-b-field-kit-pc.html", out: "option-b-field-kit-pc.png", w: 1440, h: 900 },
  { file: "option-b-field-kit-mobile.html", out: "option-b-field-kit-mobile.png", w: 390, h: 844 },
  { file: "option-c-war-room-pc.html", out: "option-c-war-room-pc.png", w: 1440, h: 900 },
  { file: "option-c-war-room-mobile.html", out: "option-c-war-room-mobile.png", w: 390, h: 844 },
  { file: "option-a-search-dropdown-pc.html", out: "option-a-search-dropdown-pc.png", w: 1440, h: 900 },
  { file: "option-a-search-dropdown-mobile.html", out: "option-a-search-dropdown-mobile.png", w: 390, h: 844 },
  { file: "option-a-item-detail-pc.html", out: "option-a-item-detail-pc.png", w: 1440, h: 900 },
  { file: "option-b-sheet-mobile.html", out: "option-b-sheet-mobile.png", w: 390, h: 844 },
];

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  for (const s of shots) {
    const page = await browser.newPage({
      viewport: { width: s.w, height: s.h },
      deviceScaleFactor: 2,
    });
    const url = pathToFileURL(resolve(htmlDir, s.file)).href;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(400);
    const out = resolve(root, s.out);
    await page.screenshot({ path: out, fullPage: false });
    console.log("wrote", out);
    await page.close();
  }
} finally {
  await browser.close();
}
