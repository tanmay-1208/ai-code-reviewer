import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "../rateLimit";

const opts = { limit: 3, windowMs: 60000 };

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit", () => {
    expect(checkRateLimit("a", opts, 1000).allowed).toBe(true);
    expect(checkRateLimit("a", opts, 1001).allowed).toBe(true);
    const third = checkRateLimit("a", opts, 1002);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks the request after the limit with a retry time", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", opts, 1000);
    const blocked = checkRateLimit("a", opts, 11000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(50);
  });

  it("tracks each key separately", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", opts, 1000);
    expect(checkRateLimit("b", opts, 1000).allowed).toBe(true);
  });

  it("resets after the window passes", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", opts, 1000);
    expect(checkRateLimit("a", opts, 61001).allowed).toBe(true);
  });
});