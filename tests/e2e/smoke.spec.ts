import { test, expect } from "@playwright/test";

test("landing page renders and links to signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Équilibre ta vie étudiante/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Commencer gratuitement/i })).toBeVisible();
});

test("auth pages load", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Content de te revoir/i })).toBeVisible();
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /Crée ton espace/i })).toBeVisible();
});

test("protected route redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
