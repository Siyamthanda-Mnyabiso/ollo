import { expect, test, type Browser } from "@playwright/test";
import { nextPhone, onboardSeller, resetSeller, sql } from "./helpers";

test.skip(process.env.E2E_AUTH !== "1", "Set E2E_AUTH=1 with a local Supabase to run these.");
test.describe.configure({ mode: "serial" });
test.setTimeout(90_000);

let phone = "";
const e164 = () => "27" + phone.replace(/\D/g, "").slice(1);
test.beforeEach(async ({ page }, testInfo) => {
  phone = nextPhone(testInfo.project.name);
  await resetSeller(phone);
  await page.context().clearCookies();
});

/** A seller who delivers or collects on every day, with an item that costs R850. */
async function setUpSeller(page: import("@playwright/test").Page) {
  await onboardSeller(page, phone);
  const [s] = await sql!`
    update sellers set fulfilment = 'both', collection_address = 'Observatory, Cape Town',
      delivery_fee_cents = 6000, delivery_days = '{0,1,2,3,4,5,6}', delivery_slots = '{"10:00 to 12:00","14:00 to 16:00"}'
    where user_id = (select id from auth.users where phone = ${e164()})
    returning id, handle`;
  const [item] =
    await sql!`insert into items (seller_id, name, price_cents) values (${s!.id}, 'Box braids', 85000) returning id`;
  return { sellerId: s!.id as string, handle: s!.handle as string, itemId: item!.id as string };
}

/** A buyer with a cart already holding the item, as the Product page leaves it. */
async function buyerAtCheckout(
  browser: Browser,
  handle: string,
  line: { itemId: string; priceCents: number; quantity?: number },
) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(
    ([h, l]) =>
      localStorage.setItem(
        `ollo-cart-${h}`,
        JSON.stringify([
          {
            ...(l as object),
            name: "Box braids",
            length: '14"',
            quantity: (l as { quantity?: number }).quantity ?? 1,
          },
        ]),
      ),
    [handle, line] as const,
  );
  const page = await ctx.newPage();
  await page.goto(`/${handle}/checkout`);
  await page.getByLabel("Full name").fill("Nomsa Dlamini");
  await page.getByLabel("Cellphone number").fill("71 234 5678");
  await page.getByLabel("Street address").fill("12 Long Street");
  await page.getByLabel("Suburb and city").fill("Gardens, Cape Town");
  return page;
}

const ordersOf = (sellerId: string) =>
  sql!`select number, total_cents, subtotal_cents, delivery_fee_cents, method, access_token from orders where seller_id = ${sellerId}`;

test.describe("orders", () => {
  test("checkout makes the order on the server, from the database's prices", async ({
    page,
    browser,
  }) => {
    const s = await setUpSeller(page);
    // The browser claims the item costs 1 cent. The server must not believe it.
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 1 });
    await buyer.getByRole("button", { name: "Send order request" }).click();
    await buyer.waitForURL(/\/orders\/[\w-]+\/requested$/);
    await expect(buyer.getByRole("heading", { name: "Order request sent" })).toBeVisible();

    const rows = await ordersOf(s.sellerId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      subtotal_cents: 85000,
      delivery_fee_cents: 6000,
      total_cents: 91000,
      method: "delivery",
    });
    await expect(buyer.getByText(`Request #OL-${rows[0]!.number}`)).toBeVisible();
    await expect(buyer.getByText("R910")).toBeVisible();
    // The cart is empty afterwards.
    await expect(buyer.locator(`a[href$="/cart"]`).first()).toContainText("0");
    await buyer.context().close();
  });

  test("collecting is free and shows Free in the summary", async ({ page, browser }) => {
    const s = await setUpSeller(page);
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 85000 });
    await buyer.getByText("Collect from seller", { exact: true }).click();
    await expect(buyer.getByText("Free", { exact: true })).toBeVisible();
    await buyer.getByRole("button", { name: "Send order request" }).click();
    await buyer.waitForURL(/\/requested$/);
    const rows = await ordersOf(s.sellerId);
    expect(rows[0]).toMatchObject({
      delivery_fee_cents: 0,
      total_cents: 85000,
      method: "collection",
    });
    await buyer.context().close();
  });

  test("a product that is gone is refused and nothing is saved", async ({ page, browser }) => {
    const s = await setUpSeller(page);
    const buyer = await buyerAtCheckout(browser, s.handle, {
      itemId: "99999999-9999-4999-8999-999999999999",
      priceCents: 100,
    });
    await buyer.getByRole("button", { name: "Send order request" }).click();
    await expect(buyer.getByText("An item in your cart is no longer available")).toBeVisible();
    expect(await ordersOf(s.sellerId)).toHaveLength(0);
    await buyer.context().close();
  });

  test("a hidden product is refused too", async ({ page, browser }) => {
    const s = await setUpSeller(page);
    await sql!`update items set active = false where id = ${s.itemId}`;
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 85000 });
    await buyer.getByRole("button", { name: "Send order request" }).click();
    await expect(buyer.getByText("An item in your cart is no longer available")).toBeVisible();
    expect(await ordersOf(s.sellerId)).toHaveLength(0);
    await buyer.context().close();
  });

  test("pressing the button twice makes one order", async ({ page, browser }) => {
    const s = await setUpSeller(page);
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 85000 });
    const send = buyer.getByRole("button", { name: "Send order request" });
    await send.dblclick();
    await buyer.waitForURL(/\/requested$/);
    expect(await ordersOf(s.sellerId)).toHaveLength(1);
    await buyer.context().close();
  });

  test("a seller who has not set delivery or collection up offers neither", async ({
    page,
    browser,
  }) => {
    const s = await setUpSeller(page);
    await sql!`update sellers set delivery_fee_cents = null, collection_address = null where id = ${s.sellerId}`;
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 85000 });
    await expect(
      buyer.getByText("This seller has not set up delivery or collection yet."),
    ).toBeVisible();
    await expect(buyer.getByRole("button", { name: "Send order request" })).toBeDisabled();
    await buyer.context().close();
  });

  test("an order link works only with its own token and seller", async ({ page, browser }) => {
    const s = await setUpSeller(page);
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 85000 });
    await buyer.getByRole("button", { name: "Send order request" }).click();
    await buyer.waitForURL(/\/requested$/);
    const [o] = await ordersOf(s.sellerId);
    await buyer.goto(`/${s.handle}/orders/${o!.access_token}/requested`);
    await expect(buyer.getByRole("heading", { name: "Order request sent" })).toBeVisible();
    // A made-up token, and the real token under another seller's handle, show nothing of the order.
    for (const path of [
      `/${s.handle}/orders/${"x".repeat(32)}/requested`,
      `/demo-thandi/orders/${o!.access_token}/requested`,
    ]) {
      await buyer.goto(path);
      await expect(buyer.getByText("This page could not be found")).toBeVisible();
      await expect(buyer.getByText("Order request sent")).toHaveCount(0);
      await expect(buyer.getByText("Nomsa")).toHaveCount(0);
    }
    await buyer.context().close();
  });

  test("row level security: a seller reads only their own orders, and visitors none", async ({
    page,
    browser,
  }) => {
    const s = await setUpSeller(page);
    const buyer = await buyerAtCheckout(browser, s.handle, { itemId: s.itemId, priceCents: 85000 });
    await buyer.getByRole("button", { name: "Send order request" }).click();
    await buyer.waitForURL(/\/requested$/);
    await buyer.context().close();

    const [owner] = await sql!`select user_id from sellers where id = ${s.sellerId}`;
    const asUser = (uid: string, role: "authenticated" | "anon") =>
      sql!.begin(async (tx) => {
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: uid, role })}, true)`;
        await tx.unsafe(`set local role ${role}`);
        const o = await tx`select count(*)::int as n from orders`;
        const l = await tx`select count(*)::int as n from order_lines`;
        return [o[0]!.n, l[0]!.n];
      });
    expect(await asUser(owner!.user_id, "authenticated")).toEqual([1, 1]);
    // Another signed-in user, with no seller row, sees nothing, and neither does a visitor.
    expect(await asUser("00000000-0000-4000-8000-000000000001", "authenticated")).toEqual([0, 0]);
    expect(await asUser("00000000-0000-4000-8000-000000000001", "anon")).toEqual([0, 0]);
  });
});
