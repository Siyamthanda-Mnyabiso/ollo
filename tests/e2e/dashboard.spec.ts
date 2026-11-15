import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { nextPhone, onboardSeller, resetSeller, signIn, sql } from "./helpers";

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
      // 3 for the payment, plus 2 for the instant payout that bank methods trigger.
      entries: 5,
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
    await customer.getByRole("button", { name: /^Pay/ }).click();
    await expect(customer.getByText("The smallest payment is R5")).toBeVisible();
    await customer.getByLabel("Amount in rand").fill("80.50");
    await customer.getByRole("button", { name: /^Pay/ }).click();
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

test.describe("payment limits", () => {
  async function payOpenAmount(
    browser: import("@playwright/test").Browser,
    handle: string,
    amount: string,
  ) {
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(`/${handle}`);
    await customer.getByLabel("Instant EFT").check();
    await customer.getByLabel("Amount in rand").fill(amount);
    await customer.getByRole("button", { name: /^Pay/ }).click();
    return customer;
  }
  const handleOf = async () => {
    const [seller] =
      await sql!`select s.handle from sellers s join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    return seller!.handle as string;
  };

  test("a new seller has a R5 000 limit per payment, with a clear message to the buyer", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    const customer = await payOpenAmount(browser, await handleOf(), "5000.01");
    await expect(
      customer.getByText(/can accept up to R\s?5\s?000,00 in one payment/),
    ).toBeVisible();
    await customer.context().close();
  });

  test("the daily limit stops a payment that would take the day over", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    await sql!`update sellers set limit_per_day_cents = 20000 where user_id = (select id from auth.users where phone = ${e164()})`;
    const handle = await handleOf();
    const first = await payOpenAmount(browser, handle, "150");
    await expect(first.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });
    const second = await payOpenAmount(browser, handle, "100");
    await expect(second.getByText(/over their limit for today/)).toBeVisible();
    await first.context().close();
    await second.context().close();
  });

  test("a seller cannot create a request above their limit", async ({ page }) => {
    await onboardSeller(page, phone);
    await sql!`update sellers set limit_per_payment_cents = 10000 where user_id = (select id from auth.users where phone = ${e164()})`;
    await page.goto("/dashboard/requests/new");
    await page.getByLabel("Amount in rand").fill("150");
    await page.getByRole("button", { name: "Create request" }).click();
    await expect(page.getByText(/Your limit is R\s?100,00 per payment/)).toBeVisible();
  });

  test("an admin can change one seller's limits from the admin area", async ({ page, browser }) => {
    // Seller A, who will be limited.
    const sellerPage = await (await browser.newContext()).newPage();
    await onboardSeller(sellerPage, phone);
    const handle = await handleOf();

    // Admin B.
    const adminPhone = nextPhone(test.info().project.name);
    await resetSeller(adminPhone);
    await onboardSeller(page, adminPhone);
    const adminE164 = "27" + adminPhone.replace(/\D/g, "").slice(1);
    await sql!`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb where phone = ${adminE164}`;
    // A fresh session so the admin role is in the token.
    await page.context().clearCookies();
    await signIn(page, adminPhone);
    await page.waitForURL("**/dashboard");
    await page.goto("/admin/sellers");
    await page.getByRole("link", { name: new RegExp(handle) }).click();
    await page.getByLabel("Limit per payment, in rand").fill("50");
    await page.getByRole("button", { name: "Save limits" }).click();
    await expect(page.getByText("Limits saved")).toBeVisible();

    const customer = await payOpenAmount(browser, handle, "60");
    await expect(customer.getByText(/can accept up to R\s?50,00 in one payment/)).toBeVisible();

    const audit =
      await sql!`select count(*)::int as n from audit_log where action = 'admin.seller_limits_changed'`;
    expect(audit[0]!.n).toBeGreaterThan(0);
    await customer.context().close();
    await sellerPage.context().close();
  });
});

async function sellerPays(
  page: import("@playwright/test").Page,
  browser: import("@playwright/test").Browser,
  amount: string,
) {
  const path = await createRequest(page, amount);
  const customer = await (await browser.newContext()).newPage();
  await customer.goto(path);
  await customer.getByLabel("PayShap").check();
  await customer.getByRole("button", { name: /^Pay/ }).click();
  await expect(customer.getByRole("heading", { name: "Payment received" })).toBeVisible({
    timeout: 20_000,
  });
  await customer.context().close();
}

test.describe("the pay page layout", () => {
  test("shows the seller, the amount first, and the trust lines", async ({ page, browser }) => {
    await onboardSeller(page, phone);
    const [seller] =
      await sql!`select s.handle, s.status from sellers s join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    expect(seller!.status).toBe("verified");
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(`/${seller!.handle}`);
    await expect(customer.getByRole("heading", { name: "Thandi Treats" })).toBeVisible();
    await expect(customer.getByText("Verified seller")).toBeVisible();
    await expect(customer.getByLabel("Amount in rand")).toBeVisible();
    await expect(customer.getByText("Secure payment powered by Stitch")).toBeVisible();
    await expect(
      customer.getByText("Check the address says ollopay.co.za before you pay."),
    ).toBeVisible();
    await expect(customer.getByRole("link", { name: "Report this seller" })).toBeVisible();
    await expect(customer.getByText(/\b(shop|store)\b/i)).toHaveCount(0);
    await customer.context().close();
  });
});

test.describe("items on the pay page", () => {
  test("a buyer can pick an item, and its price comes from the database", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    await page.getByRole("link", { name: "Items" }).click();
    await page.getByLabel("Item name").fill("Box braids");
    await page.getByLabel("Price in rand").fill("850");
    await page.getByRole("button", { name: "Add item" }).click();
    await expect(page.getByText("Box braids")).toBeVisible();

    const [seller] =
      await sql!`select s.handle from sellers s join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(`/${seller!.handle}`);
    // Picking an item fills the amount with its price.
    await customer.getByLabel(/Box braids/).check();
    await expect(customer.getByLabel("Amount in rand")).toHaveValue("850,00");
    await customer.getByLabel("Capitec Pay").check();
    await customer.getByRole("button", { name: /^Pay/ }).click();
    await expect(customer.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });

    const rows =
      await sql!`select p.amount_cents, p.item_name, p.source from payments p join sellers s on s.id = p.seller_id join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    expect(rows[0]).toMatchObject({ amount_cents: 85000, item_name: "Box braids", source: "item" });

    // "Another amount" still works.
    const other = await (await browser.newContext()).newPage();
    await other.goto(`/${seller!.handle}`);
    await other.getByLabel("Amount in rand").fill("40");
    await other.getByLabel("Card").check();
    await other.getByRole("button", { name: /^Pay/ }).click();
    await expect(other.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });

    // A hidden item is no longer offered.
    await page.goto("/dashboard/items");
    await page.getByRole("button", { name: "Hide" }).click();
    // Wait for the action to finish before the buyer loads the page.
    await expect(page.getByRole("button", { name: "Show" })).toBeVisible();
    await customer.goto(`/${seller!.handle}`);
    await expect(customer.getByLabel(/Box braids/)).toHaveCount(0);
    await customer.context().close();
    await other.context().close();
  });
});

test.describe("payments list, detail and refund", () => {
  test("lists a payment, shows its detail, and refunds it once", async ({ page, browser }) => {
    await onboardSeller(page, phone);
    // Pause payouts so the money is still in the seller's balance. Once a bank payment has been
    // paid out instantly, a refund is refused (see the next test).
    await sql!`update sellers set payouts_paused_until = now() + interval '1 day' where user_id = (select id from auth.users where phone = ${e164()})`;
    await sellerPays(page, browser, "200");

    await page.getByRole("link", { name: "Payments" }).click();
    await expect(page.getByText(/R\s?200,00/).first()).toBeVisible();
    await page
      .getByRole("link", { name: /Customer/ })
      .first()
      .click();
    await expect(page.getByTestId("payment-ollo-fee")).toHaveText(/R\s?6,00/);
    await expect(page.getByTestId("payment-you-receive")).toHaveText(/R\s?194,00/);

    await page.getByRole("link", { name: "Refund this payment" }).click();
    await page.getByRole("button", { name: /^Refund/ }).click();
    await expect(page.getByTestId("payment-status")).toHaveText("Refunded");
    await expect(page.getByRole("link", { name: "Refund this payment" })).toHaveCount(0);

    const [sum] =
      await sql!`select coalesce(sum(l.amount_cents),0)::int as total, count(*)::int as n from ledger_entries l join payments p on p.id = l.payment_id join sellers s on s.id = p.seller_id join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;
    expect(sum).toMatchObject({ total: 0, n: 6 });

    await page.goto("/dashboard?range=30d");
    await expect(page.getByTestId("money-in")).toHaveText(/R\s?0,00/);
  });

  test("after the payout has gone out there is no refund button, only a note", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    await sellerPays(page, browser, "200"); // PayShap: paid out straight away on the mock
    await page.goto("/dashboard/payments");
    await page
      .getByRole("link", { name: /Customer/ })
      .first()
      .click();
    await expect(page.getByTestId("paid-out-note")).toHaveText(
      "This payment has been paid out. Arrange the refund directly with your customer.",
    );
    await expect(page.getByRole("link", { name: "Refund this payment" })).toHaveCount(0);

    // The refund page itself sends the seller back to the payment.
    const detail = page.url();
    await page.goto(`${detail}/refund`);
    await expect(page).toHaveURL(detail);
    await expect(page.getByRole("button", { name: /^Refund/ })).toHaveCount(0);
  });
});

test.describe("payouts, payment methods, settings and sharing", () => {
  const payoutsFor = async () =>
    sql!`select po.amount_cents, po.status from payouts po join sellers s on s.id = po.seller_id join auth.users u on u.id = s.user_id where u.phone = ${e164()}`;

  async function payWith(
    browser: import("@playwright/test").Browser,
    handle: string,
    method: string,
    amount: string,
  ) {
    const customer = await (await browser.newContext()).newPage();
    await customer.goto(`/${handle}`);
    await customer.getByLabel(method).check();
    await customer.getByLabel("Amount in rand").fill(amount);
    await customer.getByRole("button", { name: /^Pay/ }).click();
    await expect(customer.getByRole("heading", { name: "Payment received" })).toBeVisible({
      timeout: 20_000,
    });
    await customer.context().close();
  }
  const handleOf = async () =>
    (
      await sql!`select s.handle from sellers s join auth.users u on u.id = s.user_id where u.phone = ${e164()}`
    )[0]!.handle as string;

  test("a bank payment is paid out at once, a card payment is not", async ({ page, browser }) => {
    await onboardSeller(page, phone);
    const handle = await handleOf();
    await payWith(browser, handle, "PayShap", "100"); // fee R3.00, payout R97.00
    await payWith(browser, handle, "Card", "100"); // fee R3.90, stays in balance

    const payouts = await payoutsFor();
    expect(payouts).toHaveLength(1);
    expect(payouts[0]).toMatchObject({ amount_cents: 9700, status: "paid" });

    await page.goto("/dashboard/payouts");
    await expect(page.getByTestId("owed")).toHaveText(/R\s?96,10/); // the card payment's R96.10
    await expect(page.getByText(/Card payments are not paid out instantly/)).toBeVisible();
    await expect(page.getByText(/account ending 7890/)).toBeVisible();
  });

  test("changing the bank account pauses payouts, and a failed change keeps the old account", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    const handle = await handleOf();
    await page.goto("/dashboard/settings");

    // A failed check must not wipe the verified account.
    await page.getByLabel("Bank", { exact: true }).selectOption("FNB");
    await page.getByLabel("Account number").fill("5555550000");
    await page.getByLabel("Account holder name").fill("Thandi Ndlovu");
    await page.getByRole("button", { name: "Check and change" }).click();
    await expect(page.getByText("We could not find that account.")).toBeVisible();
    await expect(page.getByText(/Capitec, account ending 7890/)).toBeVisible();

    await page.getByLabel("Account number").fill("5555551234");
    await page.getByRole("button", { name: "Check and change" }).click();
    await expect(page.getByText(/Payouts are paused for 48 hours/)).toBeVisible();

    await payWith(browser, handle, "PayShap", "100");
    expect(await payoutsFor()).toHaveLength(0);
    await page.goto("/dashboard/payouts");
    await expect(page.getByTestId("payout-pause")).toBeVisible();
    await expect(page.getByTestId("owed")).toHaveText(/R\s?97,00/);
    await expect(page.getByText(/FNB, account ending 1234/)).toBeVisible();

    // The change is in the audit log without the account number.
    const [audit] =
      await sql!`select after from audit_log where action = 'seller.bank_changed' order by created_at desc limit 1`;
    expect(JSON.stringify(audit!.after)).not.toContain("5555551234");
    expect(JSON.stringify(audit!.after)).toContain("1234");
  });

  test("switching a payment method off removes it from the pay page, and one must stay on", async ({
    page,
    browser,
  }) => {
    await onboardSeller(page, phone);
    const handle = await handleOf();
    await page.goto("/dashboard/payment-methods");
    await page.getByLabel("Card").uncheck();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    const customer = await (await browser.newContext()).newPage();
    await customer.goto(`/${handle}`);
    await expect(customer.getByLabel("PayShap")).toBeVisible();
    await expect(customer.getByLabel("Card")).toHaveCount(0);
    await customer.context().close();

    for (const m of ["PayShap", "Capitec Pay", "Instant EFT"]) await page.getByLabel(m).uncheck();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Keep at least one way to pay switched on")).toBeVisible();
  });

  test("settings shows the pay link with copy, WhatsApp and a QR code, and saves the name", async ({
    page,
    context,
  }) => {
    await onboardSeller(page, phone);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dashboard/settings");
    const link = (await page.getByTestId("pay-link").innerText()).trim();
    expect(link).toMatch(/^http:\/\/localhost:3000\/[a-z0-9-]+$/);
    await expect(page.getByTestId("qr").locator("svg")).toBeVisible();
    await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me\/\?text=.*localhost/,
    );
    await page.getByRole("button", { name: "Copy link" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);

    await page.getByLabel("Name on your pay page").fill("Thandi Braids");
    await page.getByRole("button", { name: "Save", exact: true }).first().click();
    await expect(page.getByText("Saved")).toBeVisible();
    const customer = await (await page.context().browser()!.newContext()).newPage();
    await customer.goto(link);
    await expect(customer.getByRole("heading", { name: "Thandi Braids" })).toBeVisible();
    await customer.context().close();
  });
});
