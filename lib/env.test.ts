import { describe, expect, it } from "vitest";
import { getEnv } from "./env";

const valid = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  FIELD_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
} as unknown as NodeJS.ProcessEnv;

describe("getEnv", () => {
  it("parses a valid environment and applies defaults", () => {
    const env = getEnv(valid);
    expect(env.PAYMENT_PROVIDER).toBe("mock");
    expect(env.MOCK_PAYMENT_SCENARIO).toBe("success");
  });

  it("lists every problem", () => {
    expect(() => getEnv({} as unknown as NodeJS.ProcessEnv)).toThrow(
      /NEXT_PUBLIC_APP_URL[\s\S]*FIELD_ENCRYPTION_KEY/,
    );
  });

  it("rejects an encryption key of the wrong length", () => {
    expect(() => getEnv({ ...valid, FIELD_ENCRYPTION_KEY: "short" })).toThrow(/32 bytes/);
  });

  it("needs Stitch credentials when the provider is stitch", () => {
    expect(() =>
      getEnv({ ...valid, PAYMENT_PROVIDER: "stitch" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/STITCH_CLIENT_ID/);
  });

  describe("disabled provider", () => {
    const prod = (extra: Record<string, string>) =>
      ({
        ...valid,
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
        PAYMENT_PROVIDER: "disabled",
        ...extra,
      }) as unknown as NodeJS.ProcessEnv;

    it("starts in production with payments off", () => {
      const env = getEnv(prod({ PAYMENTS_LIVE: "false" }));
      expect(env.PAYMENT_PROVIDER).toBe("disabled");
      expect(env.PAYMENTS_LIVE).toBe(false);
    });

    it("starts in production when PAYMENTS_LIVE is left unset", () => {
      expect(getEnv(prod({})).PAYMENTS_LIVE).toBe(false);
    });

    it("refuses PAYMENTS_LIVE=true", () => {
      expect(() => getEnv(prod({ PAYMENTS_LIVE: "true" }))).toThrow(
        /needs a real payment provider/,
      );
      expect(() => getEnv(prod({ PAYMENTS_LIVE: "1" }))).toThrow(/needs a real payment provider/);
    });
  });

  describe("mock payments in production", () => {
    const prod = (extra: Record<string, string>) =>
      ({ ...valid, NODE_ENV: "production", ...extra }) as unknown as NodeJS.ProcessEnv;

    it("refuses to start with the mock provider and NODE_ENV=production", () => {
      expect(() =>
        getEnv(
          prod({
            PAYMENT_PROVIDER: "mock",
            NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
          }),
        ),
      ).toThrow(/mock is not allowed when NODE_ENV=production/);
    });

    it("refuses when the provider is left unset, because the default is the mock", () => {
      expect(() => getEnv(prod({ NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co" }))).toThrow(
        /mock is not allowed/,
      );
    });

    it("allows the mock in a production build only against a local Supabase (end-to-end tests)", () => {
      expect(getEnv(prod({ PAYMENT_PROVIDER: "mock" })).PAYMENT_PROVIDER).toBe("mock");
    });

    it("allows the mock in development", () => {
      expect(
        getEnv({
          ...valid,
          NODE_ENV: "development",
          NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
        } as unknown as NodeJS.ProcessEnv).PAYMENT_PROVIDER,
      ).toBe("mock");
    });
  });
});
