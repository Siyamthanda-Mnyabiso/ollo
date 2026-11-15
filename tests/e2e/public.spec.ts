import { expect, test } from "@playwright/test";
import { sql } from "./helpers";

test.skip(process.env.E2E_AUTH !== "1", "Set E2E_AUTH=1 with a local Supabase to run these.");

test.describe("pre-launch sign-up (PAYMENTS_LIVE off)", () => {
  test.beforeEach(async () => {
    await sql!`delete from waitlist_signups where phone in ('+27829990001', '+27829990002')`;
  });

  test("collects a number, and says the same thing for a repeat", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Cellphone number").fill("082 999 0001");
    await page.getByRole("button", { name: "Tell me when it opens" }).click();
    await expect(page.getByText("We will message you when Ollo opens.")).toBeVisible();

    await page.goto("/");
    await page.getByLabel("Cellphone number").fill("+27 82 999 0001");
    await page.getByRole("button", { name: "Tell me when it opens" }).click();
    await expect(page.getByText("We will message you when Ollo opens.")).toBeVisible();

    const rows = await sql!`select phone from waitlist_signups where phone = '+27829990001'`;
    expect(rows).toHaveLength(1);
  });

  test("rejects a bad number and keeps what was typed", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Cellphone number").fill("12345");
    await page.getByRole("button", { name: "Tell me when it opens" }).click();
    await expect(page.getByText("Enter a valid South African cellphone number")).toBeVisible();
    await expect(page.getByLabel("Cellphone number")).toHaveValue("12345");
  });

  test("ignores a bot that fills the hidden field", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Cellphone number").fill("082 999 0002");
    await page
      .locator('input[name="website"]')
      .evaluate((el: HTMLInputElement) => (el.value = "spam"));
    await page.getByRole("button", { name: "Tell me when it opens" }).click();
    await expect(page.getByText("We will message you when Ollo opens.")).toBeVisible();
    const rows = await sql!`select phone from waitlist_signups where phone = '+27829990002'`;
    expect(rows).toHaveLength(0);
  });
});
