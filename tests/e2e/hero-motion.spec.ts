import { expect, test } from "@playwright/test";

test.describe("hero with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("renders in place with no parallax transforms", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Get paid for what you sell online" }),
    ).toBeVisible();
    await expect(page.getByText("R4,200.00").first()).toBeVisible();
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    // Nothing in the hero carries an inline transform when motion is reduced.
    const moved = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("main section:first-of-type [style]")).filter((el) =>
          /transform/.test((el as HTMLElement).getAttribute("style") ?? ""),
        ).length,
    );
    expect(moved).toBe(0);
  });

  test("search still opens and closes, without animating", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).filter({ visible: true }).click();
    await expect(page.getByRole("searchbox", { name: "Search" })).toBeFocused();
  });
});

test.describe("hero parallax", () => {
  test("layers move at different amounts when the page scrolls", async ({ page, isMobile }) => {
    await page.goto("/");
    const cardTop = () =>
      page.evaluate(() => {
        const el = Array.from(document.querySelectorAll("main section:first-of-type *")).find(
          (e) => e.children.length === 0 && e.textContent === "R4,200.00",
        );
        return el!.getBoundingClientRect().top + window.scrollY;
      });
    await expect(
      page.getByRole("heading", { name: "Get paid for what you sell online" }),
    ).toBeVisible();
    await page.waitForTimeout(500);
    const before = await cardTop();
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);
    const after = await cardTop();
    // The card runs ahead of the page, so its place on the page moves up as the page scrolls.
    expect(before - after).toBeGreaterThan(isMobile ? 3 : 8);
  });
});

test.describe("header search", () => {
  const search = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: "Search" }).filter({ visible: true });
  const box = (page: import("@playwright/test").Page) =>
    page.getByRole("searchbox", { name: "Search" });

  test("opens into the header, focuses the input, and closes when clicking away", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(box(page)).toHaveCount(0);
    await search(page).click();
    await expect(box(page)).toBeVisible();
    await expect(box(page)).toBeFocused();
    await page.getByRole("heading", { name: "Get paid for what you sell online" }).click();
    await expect(box(page)).toHaveCount(0);
  });

  test("stays open with text in it and closes on Escape", async ({ page }) => {
    await page.goto("/");
    await search(page).click();
    await box(page).fill("pricing");
    await page.getByRole("heading", { name: "Get paid for what you sell online" }).click();
    await expect(box(page)).toBeVisible();
    await expect(box(page)).toHaveValue("pricing");
    await box(page).click();
    await page.keyboard.press("Escape");
    await expect(box(page)).toHaveCount(0);
  });

  test("the clear button empties the field", async ({ page }) => {
    await page.goto("/");
    await search(page).click();
    await box(page).fill("pricing");
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(box(page)).toHaveValue("");
    await expect(box(page)).toBeFocused();
  });

  test("moving the mouse over the hero moves nothing", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Get paid for what you sell online" }),
    ).toBeVisible();
    await page.waitForTimeout(500);
    const title = page.getByRole("heading", { name: "Get paid for what you sell online" });
    const before = await title.boundingBox();
    await page.mouse.move(100, 100);
    await page.mouse.move(1300, 700, { steps: 10 });
    await page.waitForTimeout(500);
    expect(await title.boundingBox()).toEqual(before);
  });

  test("opening it does not move anything else in the header", async ({ page, isMobile }) => {
    await page.goto("/");
    const logIn = isMobile
      ? page.getByText("Menu", { exact: true })
      : page.getByRole("link", { name: "Log in" }).filter({ visible: true });
    await expect(logIn).toBeVisible();
    await page.waitForTimeout(500);
    const before = await logIn.boundingBox();
    await search(page).click();
    await expect(box(page)).toBeVisible();
    const after = await logIn.boundingBox();
    expect(after).toEqual(before);
  });
});
