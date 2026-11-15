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
});
