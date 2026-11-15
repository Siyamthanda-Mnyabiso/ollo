import { describe, expect, it } from "vitest";
import { isAdminUser } from "./roles";

describe("isAdminUser", () => {
  it("is true only for app_metadata.role = admin", () => {
    expect(isAdminUser({ app_metadata: { role: "admin" } })).toBe(true);
    expect(isAdminUser({ app_metadata: { role: "seller" } })).toBe(false);
    expect(isAdminUser({ app_metadata: {} })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
  it("ignores user_metadata, which users can edit", () => {
    const user = { app_metadata: {}, user_metadata: { role: "admin" } };
    expect(isAdminUser(user)).toBe(false);
  });
});
