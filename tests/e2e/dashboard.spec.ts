import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { nextPhone, onboardSeller, resetSeller, sql } from "./helpers";

test.skip(process.env.E2E_AUTH !== "1", "Set E2E_AUTH=1 with a local Supabase to run these.");
test.describe.configure({ mode: "serial" });
test.setTimeout(90_000);

let phone = "";
test.beforeEach(async ({ page }, testInfo) => {
  phone = nextPhone(testInfo.project.name);
  await resetSeller(phone);
  await page.context().clearCookies();
});

const e164 = () => "27" + phone.replace(/\D/g, "").slice(1);

async function createRequest(page: import("@playwright/test").Page, amount: string, note?: string) {
  await page.getByRole("link", { name: "Request payment" }).first().click();
  await page.waitForURL("**/dashboard/requests/new");
  await page.getByLabel("Amount in rand").fill(amount);
  if (note) await page.getByLabel(/What is it for/).fill(note);
  await page.getByRole("button", { name: "Create request" }).click();
  await page.waitForURL(/\/dashboard\/requests\/[0-9a-f-]{36}$/);
  const link = (await page.getByTestId("request-link").innerText()).trim();
  return new URL(link).pathname;
}

test.describe("dashboard", () => {
  test("starts empty, with a Request payment button", async ({ page }) => {
    await onboardSeller(page, phone);
    await expect(page.getByTestId("money-in")).toHaveText(/R\s?0,00/);
    await expect(page.getByText("No payments yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request payment" })).toBeVisible();
  });

  test("a request can be paid on the public page, and shows in money in", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    const path = await createRequest(page, "250", "Braids deposit");

    // The customer is anonymous: a separate browser context with no session.
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(path);
    await expect(customer.getByTestId("request-amount")).toHaveText(/R\s?250,00/);
    await customer.getByLabel("PayShap").check();
    await customer.getByRole("button", { name: /^Pay/ }).click();
    await expect(customer.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/dashboard");
    await expect(page.getByTestId("money-in")).toHaveText(/R\s?250,00/);
    await expect(page.getByText("Braids deposit").or(page.getByText("Customer"))).toBeVisible();
    await page.goto(path.replace(/^\/[^/]+\//, "/dashboard/requests/"));
    await expect(page.getByTestId("request-status")).toHaveText("Paid");

    // The fee is 3% for bank methods on Free: R7.50, and the ledger is balanced.
    const rows = await sql!`
      select p.fee_cents, p.status, (select coalesce(sum(amount_cents),0)::int from ledger_entries l where l.payment_id = p.id) as ledger_sum,
             (select count(*)::int from ledger_entries l where l.payment_id = p.id) as entries
      from payments p join sellers s on s.id = p.seller_id join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      fee_cents: 750,
      status: "succeeded",
      ledger_sum: 0,
      entries: 3,
    });
    await customer.context().close();
  });

  test("a paid request cannot be paid twice, and a duplicate webhook does not double count", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    const path = await createRequest(page, "100");
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(path);
    await customer.getByLabel("Card").check();
    await customer.getByRole("button", { name: /^Pay/ }).click();
    await expect(customer.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });

    // Replay the success webhook twice. Ledger entries must not grow.
    const [payment] = await sql!`
      select p.provider_reference as ref from payments p join sellers s on s.id = p.seller_id
      join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    const body = JSON.stringify({
      id: "evt_replay",
      type: "payment.succeeded",
      providerReference: payment!.ref,
      occurredAt: new Date().toISOString(),
    });
    const signature = createHmac("sha256", process.env.MOCK_WEBHOOK_SECRET ?? "mock-webhook-secret")
      .update(body)
      .digest("hex");
    for (let i = 0; i < 2; i++) {
      const res = await customer.request.post("/api/webhooks/payments", {
        data: body,
        headers: { "x-mock-signature": signature },
      });
      expect(res.status()).toBe(200);
    }
    const bad = await customer.request.post("/api/webhooks/payments", {
      data: body,
      headers: { "x-mock-signature": "nope" },
    });
    expect(bad.status()).toBe(401);
    const [{ n }] =
      await sql!`select count(*)::int as n from ledger_entries l join payments p on p.id = l.payment_id
      join sellers s on s.id = p.seller_id join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    expect(n).toBe(3);

    // The link now says it is paid.
    await customer.goto(path);
    await expect(customer.getByText("already been paid")).toBeVisible();
    await customer.context().close();
  });

  test("the open pay link takes any amount and rejects a bad one", async ({ page, browser }) => {
    await onboardSeller(page, phone);
    const [seller] =
      await sql!`select s.handle from sellers s join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(`/${seller!.handle}`);
    await customer.getByLabel("Instant EFT").check();
    await customer.getByLabel("Amount in rand").fill("1");
    await customer.getByRole("button", { name: "Pay" }).click();
    await expect(customer.getByText("The smallest payment is R5")).toBeVisible();
    await customer.getByLabel("Amount in rand").fill("80.50");
    await customer.getByRole("button", { name: "Pay" }).click();
    await expect(customer.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });
    await customer.context().close();
  });

  test("a cancelled request cannot be paid", async ({ page, browser }) => {
    await onboardSeller(page, phone);
    const path = await createRequest(page, "60");
    await page.getByRole("button", { name: "Cancel request" }).click();
    await expect(page.getByTestId("request-status")).toHaveText("Cancelled");
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(path);
    await expect(customer.getByText("seller cancelled this request")).toBeVisible();
    await customer.context().close();
  });

  test("an unknown pay link shows not found", async ({ page }) => {
    await page.goto("/no-such-seller-here");
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });

  test("items can be added and hidden", async ({ page }) => {
    await onboardSeller(page, phone);
    await page.getByRole("link", { name: "Items" }).click();
    await page.getByLabel("Item name").fill("Box braids");
    await page.getByLabel("Price in rand").fill("850");
    await page.getByRole("button", { name: "Add item" }).click();
    await expect(page.getByText("Box braids")).toBeVisible();
    await expect(page.getByText(/R\s?850,00/)).toBeVisible();
    await page.getByRole("button", { name: "Hide" }).click();
    await expect(page.getByRole("button", { name: "Show" })).toBeVisible();
  });

  test("one seller cannot open another seller's request", async ({ page, browser }) => {
    await onboardSeller(page, phone);
    const path = await createRequest(page, "90");
    const requestId = path.split("/").pop()!;
    // A second, signed-in seller tries the dashboard URL of the first one's request.
    const other = await (await browser.newContext()).newPage();
    const otherPhone = nextPhone(test.info().project.name);
    await resetSeller(otherPhone);
    await onboardSeller(other, otherPhone);
    await other.goto(`/dashboard/requests/${requestId}`);
    await expect(other.getByText("This page could not be found")).toBeVisible();
    await other.context().close();
  });
});
