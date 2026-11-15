import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * These tests sign in for real, so they need a Supabase project with the test OTP numbers from
 * supabase/config.toml (run `supabase start`), a DATABASE_URL, and the mock providers.
 * They are skipped unless E2E_AUTH=1.
 */
test.skip(process.env.E2E_AUTH !== "1", "Set E2E_AUTH=1 with a local Supabase to run these.");
test.describe.configure({ mode: "serial" });
// The first request to each page compiles it in dev, which can take a while.
test.setTimeout(60_000);

const VALID_ID = "8001015009087";
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 1 }) : null;

// Each test gets its own test number (4501 to 4540 in config.toml) so tests never share a seller.
const phoneFor = (project: string, n: number) =>
  `082123${4500 + n + (project === "mobile" ? 20 : 0)}`;

async function resetSeller(phone: string) {
  if (!sql) return;
  const e164 = "27" + phone.replace(/\D/g, "").slice(1);
  const users = await sql`select id from auth.users where phone = ${e164}`;
  for (const u of users) {
    await sql`delete from audit_log where actor = ${u.id}`;
    await sql`delete from sellers where user_id = ${u.id}`;
    await sql`delete from auth.users where id = ${u.id}`;
  }
}

async function signIn(page: Page, phone: string) {
  await page.goto("/sign-in");
  await page.getByLabel(/phone/i).fill(phone);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel(/code/i).fill("123456");
  await page.getByRole("button", { name: "Continue" }).click();
}

async function signOut(page: Page) {
  await page.context().clearCookies();
}

/** Signs in as a new seller and completes the profile, business and link steps. */
async function reachVerifyStep(page: Page, phone: string, fullName = "Thandi Ndlovu") {
  await signIn(page, phone);
  await page.waitForURL("**/onboarding/profile");
  await page.getByLabel("Full name").fill(fullName);
  await page.getByLabel("Shop name").fill("Thandi Treats");
  await page.getByLabel("Food and baking").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/business");
  await page.getByLabel("Instagram").check();
  await page.getByLabel("Under R5k").check();
  await page.getByLabel("Cash").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/link");
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/verify");
}

async function submitId(page: Page, idNumber = VALID_ID) {
  await page.getByLabel("ID number").fill(idNumber);
  await page.getByLabel("Selfie").setInputFiles({
    name: "selfie.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  });
  await page.getByRole("button", { name: "Check my ID" }).click();
}

async function reachBankStep(page: Page, phone: string) {
  await reachVerifyStep(page, phone);
  await submitId(page);
  await expect(page.getByText("Your ID is verified")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/bank");
}

async function submitBank(page: Page, account: string, holder?: string) {
  await page.getByLabel("Bank", { exact: true }).selectOption("Capitec");
  await page.getByLabel("Account number").fill(account);
  if (holder) await page.getByLabel("Account holder name").fill(holder);
  await page.getByRole("button", { name: "Check and save" }).click();
}

let testNumber = 0;
let phone = "";
test.beforeEach(async ({ page }, testInfo) => {
  phone = phoneFor(testInfo.project.name, ++testNumber);
  await resetSeller(phone);
  await page.context().clearCookies();
});
test.afterAll(async () => {
  await sql?.end();
});

test.describe("ID step", () => {
  test("shows checking, then verified", async ({ page }) => {
    await reachVerifyStep(page, phone);
    await submitId(page);
    // The mock answers after 2.5 seconds. A slow first page load can miss the checking state.
    await expect(page.getByText(/Checking your ID|Your ID is verified/)).toBeVisible();
    await expect(page.getByText("Your ID is verified")).toBeVisible({ timeout: 15_000 });
  });

  test("shows the not matched state and lets the seller try again", async ({ page }) => {
    await reachVerifyStep(page, phone, "Thandi MISMATCH");
    await submitId(page);
    await expect(page.getByText(/does not match the name you gave us/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByLabel("ID number")).toBeVisible();
  });

  test("rejects an ID number that is not valid", async ({ page }) => {
    await reachVerifyStep(page, phone);
    await submitId(page, "1234567890123");
    await expect(page.getByText(/ID number does not look right/i)).toBeVisible();
  });

  test("keeps the bank and plan steps closed until the ID passes", async ({ page }) => {
    await reachVerifyStep(page, phone);
    await page.goto("/onboarding/bank");
    await page.waitForURL("**/onboarding/verify");
    await page.goto("/onboarding/plan");
    await page.waitForURL("**/onboarding/verify");
  });
});

test.describe("bank step", () => {
  test("shows a plain message for each failed check", async ({ page }) => {
    await reachBankStep(page, phone);
    await submitBank(page, "1234560000");
    await expect(page.getByText("We could not find that account.")).toBeVisible();
    await submitBank(page, "1234567890", "Thandi MISMATCH");
    await expect(
      page.getByText("The account holder name does not match this account."),
    ).toBeVisible();
    await submitBank(page, "1234569999", "Thandi Ndlovu");
    await expect(page.getByText("The bank check is not available right now.")).toBeVisible();
  });

  test("checks field errors before calling the bank", async ({ page }) => {
    await reachBankStep(page, phone);
    await page.getByRole("button", { name: "Check and save" }).click();
    await expect(page.getByLabel("Account number")).toBeVisible();
    await expect(page).toHaveURL(/onboarding\/bank/);
  });
});

test.describe("plan step", () => {
  test("Free finishes onboarding and shows the pay link", async ({ page }) => {
    await reachBankStep(page, phone);
    await submitBank(page, "1234567890");
    await page.waitForURL("**/onboarding/plan");
    await page.getByRole("button", { name: "Finish" }).click();
    await page.waitForURL("**/onboarding/done");
    await expect(page.getByRole("heading", { name: /You are all set, Thandi/ })).toBeVisible();
  });

  test("Pro is only requested, the seller stays on Free", async ({ page }) => {
    await reachBankStep(page, phone);
    await submitBank(page, "1234567890");
    await page.waitForURL("**/onboarding/plan");
    await page.getByLabel(/Pro/).check();
    await page.getByRole("button", { name: "Finish" }).click();
    await page.waitForURL("**/onboarding/done");
    const e164 = "27" + phone.replace(/\D/g, "").slice(1);
    const [row] = await sql!`
      select s.plan, (select count(*) from audit_log a where a.actor = s.user_id and a.action = 'seller.pro_requested')::int as requests
      from sellers s join auth.users u on u.id = s.user_id where u.phone = ${e164}`;
    expect(row).toMatchObject({ plan: "free", requests: 1 });
  });

  test("does not store the account number as plain text", async ({ page }) => {
    await reachBankStep(page, phone);
    await submitBank(page, "1234567890");
    await page.waitForURL("**/onboarding/plan");
    const e164 = "27" + phone.replace(/\D/g, "").slice(1);
    const [row] = await sql!`
      select v.account_number, v.id_number from seller_verification v
      join sellers s on s.id = v.seller_id join auth.users u on u.id = s.user_id where u.phone = ${e164}`;
    expect(row!.account_number).toMatch(/^v1\./);
    expect(row!.id_number).toMatch(/^v1\./);
  });
});

test.describe("resuming part-way", () => {
  test("returns to the ID step after signing in again", async ({ page }) => {
    await reachVerifyStep(page, phone);
    await signOut(page);
    await signIn(page, phone);
    await page.waitForURL("**/onboarding/verify");
  });

  test("returns to the bank step once the ID has passed", async ({ page }) => {
    await reachBankStep(page, phone);
    await signOut(page);
    await signIn(page, phone);
    await page.waitForURL("**/onboarding/bank");
  });

  test("returns to the plan step once the bank is saved", async ({ page }) => {
    await reachBankStep(page, phone);
    await submitBank(page, "1234567890");
    await page.waitForURL("**/onboarding/plan");
    await signOut(page);
    await signIn(page, phone);
    await page.waitForURL("**/onboarding/plan");
  });

  test("goes straight to the dashboard when onboarding is finished", async ({ page }) => {
    await reachBankStep(page, phone);
    await submitBank(page, "1234567890");
    await page.waitForURL("**/onboarding/plan");
    await page.getByRole("button", { name: "Finish" }).click();
    await page.waitForURL("**/onboarding/done");
    await signOut(page);
    await signIn(page, phone);
    await page.waitForURL("**/dashboard");
  });
});

test.describe("admin area", () => {
  test("sends a normal seller away and lets an admin in", async ({ page }) => {
    await reachVerifyStep(page, phone);
    await page.goto("/admin");
    await page.waitForURL("**/dashboard");

    // Admin is granted by hand in app_metadata. user_metadata must not count.
    const e164 = "27" + phone.replace(/\D/g, "").slice(1);
    await sql!`update auth.users set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb where phone = ${e164}`;
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);

    await sql!`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb where phone = ${e164}`;
    await signOut(page);
    await signIn(page, phone);
    await page.waitForURL("**/onboarding/**");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  });
});
