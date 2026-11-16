import { expect, type Page } from "@playwright/test";
import postgres from "postgres";

export const VALID_ID = "8001015009087";
export const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 })
  : null;

// Each test gets its own test number (4501 to 4590 in config.toml) so tests never share a seller.
export const phoneFor = (project: string, n: number) =>
  `082123${4500 + n + (project === "mobile" ? 45 : 0)}`;

export async function resetSeller(phone: string) {
  if (!sql) return;
  const e164 = "27" + phone.replace(/\D/g, "").slice(1);
  const users = await sql`select id from auth.users where phone = ${e164}`;
  for (const u of users) {
    // The ledger is append-only and payments are never deleted in the real app. For tests only, the
    // database session skips those triggers and foreign keys so a test seller can be wiped.
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      const own = tx`select id from sellers where user_id = ${u.id}`;
      await tx`delete from order_lines where order_id in (select id from orders where seller_id in (${own}))`;
      await tx`delete from orders where seller_id in (${own})`;
      await tx`delete from ledger_entries where payment_id in (select id from payments where seller_id in (${own}))`;
      await tx`delete from ledger_accounts where seller_id in (${own})`;
      await tx`delete from payouts where seller_id in (${own})`;
      await tx`delete from payments where seller_id in (${own})`;
      await tx`delete from payment_requests where seller_id in (${own})`;
      await tx`delete from items where seller_id in (${own})`;
      await tx`delete from seller_verification where seller_id in (${own})`;
      await tx`delete from seller_survey where seller_id in (${own})`;
      await tx`delete from payment_method_settings where seller_id in (${own})`;
      await tx`delete from audit_log where actor = ${u.id}`;
      await tx`delete from sellers where user_id = ${u.id}`;
      await tx`delete from auth.users where id = ${u.id}`;
    });
  }
}

export async function signIn(page: Page, phone: string) {
  await page.goto("/sign-in");
  await page.getByLabel(/phone/i).fill(phone);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Enter your code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
}

export async function signOut(page: Page) {
  await page.context().clearCookies();
}

/** Signs in as a new seller and completes the profile, business and link steps. */
export async function reachVerifyStep(page: Page, phone: string, fullName = "Thandi Ndlovu") {
  await signIn(page, phone);
  await page.waitForURL("**/onboarding/profile");
  await page.getByLabel("Full name").fill(fullName);
  await page.getByLabel("Business name").fill("Thandi Treats");
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

export async function submitId(page: Page, idNumber = VALID_ID) {
  await page.getByLabel("ID number").fill(idNumber);
  await page.getByLabel("Selfie").setInputFiles({
    name: "selfie.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  });
  await page.getByRole("button", { name: "Check my ID" }).click();
}

export async function reachBankStep(page: Page, phone: string) {
  await reachVerifyStep(page, phone);
  await submitId(page);
  await expect(page.getByText("Your ID is verified")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/bank");
}

export async function submitBank(page: Page, account: string, holder?: string) {
  await page.getByLabel("Bank", { exact: true }).selectOption("Capitec");
  await page.getByLabel("Account number").fill(account);
  if (holder) await page.getByLabel("Account holder name").fill(holder);
  await page.getByRole("button", { name: "Check and save" }).click();
}

const counters = new Map<string, number>();
/** A fresh test number for this project, so no two tests share a seller. */
export const nextPhone = (project: string) => {
  const n = (counters.get(project) ?? 0) + 1;
  counters.set(project, n);
  return phoneFor(project, n);
};

/** Signs up a brand new seller and walks through every onboarding step, ending on the dashboard. */
export async function onboardSeller(page: Page, phone: string) {
  await reachBankStep(page, phone);
  await submitBank(page, "1234567890");
  await page.waitForURL("**/onboarding/plan");
  await page.getByRole("button", { name: "Finish" }).click();
  await page.waitForURL("**/onboarding/done");
  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await page.waitForURL("**/dashboard");
}
