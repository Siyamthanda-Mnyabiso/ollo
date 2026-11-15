import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // The signed-in tests share one database and a few test phone numbers, so they run one at a time.
  fullyParallel: process.env.E2E_AUTH !== "1",
  workers: process.env.E2E_AUTH === "1" ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /public-live/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /public-live/ },
    // The home page with PAYMENTS_LIVE on, served by scripts/e2e-servers.sh on port 3001.
    ...(process.env.E2E_PROD
      ? [
          {
            name: "live",
            testMatch: /public-live/,
            use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3001" },
          },
          {
            name: "live-mobile",
            testMatch: /public-live/,
            use: { ...devices["Pixel 7"], baseURL: "http://localhost:3001" },
          },
        ]
      : []),
  ],
  webServer: {
    // E2E_PROD=1 tests the production build, which has no first-visit compile delays.
    command: process.env.E2E_PROD ? "bash scripts/e2e-servers.sh" : "pnpm dev",
    timeout: 300_000,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
