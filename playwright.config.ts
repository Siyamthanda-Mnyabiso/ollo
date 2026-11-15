import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // E2E_PROD=1 tests the production build, which has no first-visit compile delays.
    command: process.env.E2E_PROD ? "pnpm build && pnpm start" : "pnpm dev",
    timeout: 300_000,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
