// Drives the live site: login → settings → click Plus → check it reaches
// Stripe Checkout. Does NOT enter payment. Verifies STRIPE_SECRET_KEY + price link.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE;
const b = await chromium.launch();
const p = await b.newPage();
const errors = [];
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.fill('input[type="email"]', process.env.SEED_EMAIL);
await p.fill('input[type="password"]', process.env.SEED_PASSWORD);
await p.getByRole("button", { name: /Se connecter/i }).click();
await p.waitForURL(/\/dashboard/, { timeout: 25000 });

await p.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

const btn = p.getByRole("button", { name: /4,99/ }).first(); // Plus monthly
const count = await btn.count();
console.log("Plus monthly button found:", count > 0 ? "yes" : "NO (offers not rendering?)");
if (count > 0) {
  await Promise.all([
    p.waitForURL(/stripe\.com/, { timeout: 20000 }).catch(() => null),
    btn.click(),
  ]);
}
await p.waitForTimeout(2500);
const url = p.url();
const reached = /stripe\.com/.test(url);
console.log("URL after click:", url.replace(/cs_live_[^/?#]+/, "cs_live_[redacted]"));
console.log("REACHED STRIPE CHECKOUT:", reached ? "YES ✓ (key + price valid)" : "NO ✗");
if (!reached) {
  await p.screenshot({ path: "/tmp/balanceu_live/checkout_state.png" });
  console.log("console errors:", errors.slice(0, 4));
}
await b.close();
