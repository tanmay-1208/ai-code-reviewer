import { describe, it, expect } from "vitest";
import { isValidOwnerId, newOwnerId, ownerCookieOptions } from "../owner";

describe("owner id", () => {
  it("generates ids that pass validation", () => {
    expect(isValidOwnerId(newOwnerId())).toBe(true);
  });

  it("generates a different id each time", () => {
    expect(newOwnerId()).not.toBe(newOwnerId());
  });

  it("rejects missing, empty and malformed values", () => {
    expect(isValidOwnerId(undefined)).toBe(false);
    expect(isValidOwnerId("")).toBe(false);
    expect(isValidOwnerId("admin")).toBe(false);
    expect(isValidOwnerId("1234")).toBe(false);
    expect(isValidOwnerId("' OR 1=1 --")).toBe(false);
  });

  it("uses a private, long-lived cookie", () => {
    const o = ownerCookieOptions();
    expect(o.httpOnly).toBe(true);
    expect(o.sameSite).toBe("lax");
    expect(o.maxAge).toBeGreaterThan(60 * 60 * 24 * 30);
  });
});