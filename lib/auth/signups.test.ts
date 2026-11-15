import { describe, expect, it } from "vitest";
import { signupsOpen } from "./signups";

const base = { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co" };

describe("signupsOpen", () => {
  it("is closed on a production site unless it is switched on", () => {
    expect(signupsOpen(base)).toBe(false);
    expect(signupsOpen({ ...base, SIGNUPS_OPEN: true })).toBe(true);
    expect(signupsOpen({ ...base, SIGNUPS_OPEN: false })).toBe(false);
  });
  it("is open in development and tests", () => {
    expect(signupsOpen({ ...base, NODE_ENV: "development" })).toBe(true);
    expect(signupsOpen({ ...base, NODE_ENV: "test" })).toBe(true);
  });
  it("is open in a production build against a local Supabase, and can still be closed", () => {
    const local = { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54421" };
    expect(signupsOpen(local)).toBe(true);
    expect(signupsOpen({ ...local, SIGNUPS_OPEN: false })).toBe(false);
  });
});
