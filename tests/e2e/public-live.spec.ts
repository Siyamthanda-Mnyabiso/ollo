import { expect, test } from "@playwright/test";

// Runs against a second server with PAYMENTS_LIVE=true (see scripts/e2e-servers.sh, production build only).

test("with PAYMENTS_LIVE on, the home page describes live payments", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Get paid in seconds", level: 1 })).toBeVisible();
  await expect(page.getByText("Launching January")).toHaveCount(0);
  await expect(page.getByLabel("Cellphone number")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Make your pay link" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("no business registration")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How fast do I get paid?" })).toBeVisible();
  await expect(page.getByText(/\b(shop|store)\b/i)).toHaveCount(0);
});
