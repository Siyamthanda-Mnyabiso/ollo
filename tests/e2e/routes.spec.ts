import { expect, test } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ollo" })).toBeVisible();
});

test("pay page placeholder renders for any handle", async ({ page }) => {
  await page.goto("/thandihair");
  await expect(page.getByRole("heading", { name: "Pay page" })).toBeVisible();
});

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
