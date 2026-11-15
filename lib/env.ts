import { z } from "zod";

const base64Key32 = z
  .string()
  .refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64 encoded");

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  /** Server only. Never import this file from client components. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().startsWith("postgres"),
  /** AES-256 key for ID and account number encryption. */
  FIELD_ENCRYPTION_KEY: base64Key32,
  PAYMENT_PROVIDER: z.enum(["mock", "stitch"]).default("mock"),
  MOCK_PAYMENT_SCENARIO: z
    .enum(["success", "decline", "timeout", "duplicate_webhook", "late_webhook"])
    .default("success"),
  MOCK_WEBHOOK_SECRET: z.string().min(8).default("mock-webhook-secret"),
  /** Stitch credentials. Required once the Stitch provider is implemented. */
  STITCH_CLIENT_ID: z.string().optional(),
  STITCH_CLIENT_SECRET: z.string().optional(),
  STITCH_WEBHOOK_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Parses and caches the environment. Throws a readable error listing every problem. */
export function getEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (cached && source === process.env) return cached;
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment variables:\n${lines.join("\n")}`);
  }
  if (result.data.PAYMENT_PROVIDER === "stitch") {
    const missing = (
      ["STITCH_CLIENT_ID", "STITCH_CLIENT_SECRET", "STITCH_WEBHOOK_SECRET"] as const
    ).filter((k) => !result.data[k]);
    if (missing.length) throw new Error(`PAYMENT_PROVIDER=stitch needs: ${missing.join(", ")}`);
  }
  if (source === process.env) cached = result.data;
  return result.data;
}
