// Login → /coach → click "Générer" → read the AI result or the real error.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE;
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.fill('input[type="email"]', process.env.SEED_EMAIL);
await p.fill('input[type="password"]', process.env.SEED_PASSWORD);
await p.getByRole("button", { name: /Se connecter/i }).click();
await p.waitForURL(/\/dashboard/, { timeout: 25000 });
await p.goto(`${BASE}/coach`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const btn = p.getByRole("button", { name: /Générer|Régénérer/ }).first();
console.log("Générer button:", (await btn.count()) > 0 ? "found" : "NOT found (not Pro?)");
await btn.click();
await p.waitForTimeout(12000); // AI round-trip
const alert = await p.locator('[role="alert"]').first().textContent().catch(() => null);
console.log("AI ALERT/ERROR:", alert || "(none — likely succeeded)");
await b.close();
