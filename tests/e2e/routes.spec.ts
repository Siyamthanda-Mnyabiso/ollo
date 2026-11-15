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

test("with PAYMENTS_LIVE off, the home page says Launching January and has sign-up buttons", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Get paid for what you sell online" }),
  ).toBeVisible();
  await expect(page.getByText("Launching January", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Join as a founding seller" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Join as a founding seller" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create your free pay page" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
  await expect(page.getByLabel("Cellphone number")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "How Ollo works" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Everything you need to get paid" }),
  ).toBeVisible();
  await expect(page.getByText(/\b(shop|store)\b/i)).toHaveCount(0);
  await expect(page.getByText("Public marketing pages live in this route group.")).toHaveCount(0);
});

test("pricing shows the agreed fees and leaves out the lines still waiting for wording", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Simple fees, no surprises" })).toBeVisible();
  await expect(page.getByText("3% per bank sale")).toBeVisible();
  await expect(page.getByText("3.9% per card sale")).toBeVisible();
  await expect(page.getByText("R149 a month", { exact: true })).toBeVisible();
  await expect(page.getByText("2.5% per bank sale")).toBeVisible();
  await expect(page.getByText(/product listings|order requests|instantly/i)).toHaveCount(0);
});

const PAGES: [string, string][] = [
  ["/about", "Built for people who sell from their phones"],
  ["/help", "How can we help?"],
  ["/contact", "Talk to us"],
  ["/terms", "Terms of service"],
  ["/privacy", "Privacy policy"],
];
for (const [path, heading] of PAGES) {
  test(`${path} exists and the header and footer link to it`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Pricing" }),
    ).toBeVisible();
  });
}

test("terms and privacy are marked as placeholders for a lawyer", async ({ page }) => {
  for (const path of ["/terms", "/privacy"]) {
    await page.goto(path);
    await expect(page.getByTestId("legal-placeholder-notice")).toContainText("legal adviser");
    await expect(page.getByText(/to be written by a lawyer/).first()).toBeVisible();
  }
});

test("the help centre search filters the questions", async ({ page }) => {
  await page.goto("/help");
  await page.getByLabel("Search for answers").fill("website");
  await expect(page.getByRole("heading", { name: "Do I need a website?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What is Ollo?" })).toHaveCount(0);
});

test("the landing page links to every public page and shows the two real phone screens", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const [name, href] of [
    ["About", "/about"],
    ["Help centre", "/help"],
    ["Contact", "/contact"],
    ["Terms of service", "/terms"],
    ["Privacy policy", "/privacy"],
  ]) {
    await expect(footer.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  // Step 2 shows the share screen and feature 04 the payouts screen, with sample data.
  await expect(page.getByText("ollopay.co.za/demo-thandi")).toBeVisible();
  await expect(page.getByText("Waiting to be paid out")).toBeVisible();
});
