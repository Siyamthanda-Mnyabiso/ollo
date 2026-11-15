import { expect, test } from "@playwright/test";

test("sign-in asks for a phone number and rejects a bad one", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Enter your phone number" })).toBeVisible();
  await page.getByLabel("Cellphone number").fill("12345");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Enter a valid South African cellphone number")).toBeVisible();
});

for (const path of ["/dashboard", "/onboarding", "/onboarding/profile", "/admin"]) {
  test(`${path} sends signed-out visitors to sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  });
}

test("with PAYMENTS_LIVE off, the landing page says Launching January and has no shop wording", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Launching January" })).toBeVisible();
  await expect(page.getByText(/\bshop\b|\bstore\b/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
});

test("pricing shows the fees", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("3% on each bank payment")).toBeVisible();
  await expect(page.getByText("2.5% on each bank payment")).toBeVisible();
});
