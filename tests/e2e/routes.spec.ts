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
  // The hero has no share row; the strip below it already names the platforms.
  await expect(page.getByText("Share your pay link on")).toHaveCount(0);
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
  await expect(page.getByText("3% per bank payment")).toBeVisible();
  await expect(page.getByText("3.9% per card payment")).toBeVisible();
  await expect(page.getByText("R149 a month", { exact: true })).toBeVisible();
  await expect(page.getByText("2.5% per bank payment")).toBeVisible();
  await expect(page.getByText(/product listings|order requests|instantly/i)).toHaveCount(0);
  await expect(page.getByText("Payment requests", { exact: true })).toBeVisible();
  await expect(page.getByText("Straight to your bank account.", { exact: false })).toBeVisible();
  await expect(page.getByText("More Pro features coming soon")).toBeVisible();
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
    await expect(page.getByText(/to be written by a lawyer/).first()).toBeAttached();
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

test("pricing follows the frame: plan labels, icon rows and the What / Cost table", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByText("Free plan", { exact: true })).toBeVisible();
  await expect(page.getByText("Pro plan", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go Pro" })).toBeVisible();
  await expect(page.getByText("What", { exact: true })).toBeVisible();
  await expect(page.getByText("Cost", { exact: true })).toBeVisible();
  await expect(page.getByText("3% bank, 3.9% card. Pro: 2.5% bank")).toBeVisible();
});

test("the contact form has the frame's fields and a seller option picked by default", async ({
  page,
}) => {
  await page.goto("/contact");
  for (const label of ["Your name", "Email address", "Cellphone number", "Message"]) {
    await expect(page.getByLabel(label).first()).toBeVisible();
  }
  await expect(page.getByRole("radio", { name: "Seller" })).toBeChecked();
  await expect(page.getByText("hello@ollopay.co.za")).toBeVisible();
  await expect(page.getByText("+27 82 456 7890")).toHaveCount(0);
  await expect(page.getByText("Support hours")).toHaveCount(0);
});

test("about shows the three beliefs from the frame", async ({ page }) => {
  await page.goto("/about");
  for (const t of ["Made for sellers", "Simple by default", "Safe for buyers"]) {
    await expect(page.getByRole("heading", { name: t })).toBeVisible();
  }
});

test("help centre: payments start answer says January while the flag is off", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByText("Payments are launching in January.")).toBeVisible();
  await expect(page.getByText("Payments are live.")).toHaveCount(0);
});
