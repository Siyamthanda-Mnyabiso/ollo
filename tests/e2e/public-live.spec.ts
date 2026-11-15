import { expect, test } from "@playwright/test";

// Runs against a second server with PAYMENTS_LIVE=true (see scripts/e2e-servers.sh, production build only).

test("with PAYMENTS_LIVE on, the home page describes live payments", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Get paid for what you sell online" }),
  ).toBeVisible();
  await expect(page.getByText("Launching January")).toHaveCount(0);
  await expect(page.getByText("Join as a founding seller")).toHaveCount(0);
  await expect(page.getByLabel("Cellphone number")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Get your pay link" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start getting paid today" })).toBeVisible();
  await expect(page.getByText("Paid in seconds with pay by bank").first()).toBeVisible();
  await expect(page.getByText(/\b(shop|store)\b/i)).toHaveCount(0);
});
