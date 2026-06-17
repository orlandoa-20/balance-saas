// Logs in through the real UI against the live Supabase and screenshots the
// authenticated app. Env: SEED_EMAIL, SEED_PASSWORD, [BASE]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL;
const PW = process.env.SEED_PASSWORD;
const OUT = "/tmp/balanceu_live";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1500 }, deviceScaleFactor: 1 });

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000); // let React hydrate before interacting
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PW);
await page.getByRole("button", { name: /Se connecter/i }).click();
const ok = await page.waitForURL(/\/dashboard/, { timeout: 25000 }).then(() => true).catch(() => false);
if (!ok) {
  await page.screenshot({ path: `${OUT}/login_error.png` });
  const alert = await page.locator('[role="alert"]').first().textContent().catch(() => null);
  console.log("LOGIN did not reach /dashboard. url=", page.url(), "| alert=", JSON.stringify(alert));
  await browser.close();
  process.exit(2);
}
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/dashboard.png` });
console.log("dashboard ✓");

for (const [route, name] of [
  ["/balance", "balance"],
  ["/planner", "planner"],
  ["/coach", "coach"],
  ["/settings", "settings"],
  ["/admin", "admin"],
]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${name} ✓`);
}

// mobile dashboard
await page.setViewportSize({ width: 402, height: 1500 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/mobile.png` });
console.log("mobile ✓");

await browser.close();
console.log("all shots done");
