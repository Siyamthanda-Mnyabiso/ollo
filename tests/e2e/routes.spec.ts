import { expect, test } from "@playwright/test";

const routes: Array<[string, string]> = [
  ["/", "Ollo"],
  ["/sign-in", "Sign in"],
  ["/onboarding", "Onboarding"],
  ["/dashboard", "Dashboard"],
  ["/admin", "Admin"],
  ["/thandihair", "Pay page"],
];

for (const [path, heading] of routes) {
  test(`${path} renders its placeholder`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}
