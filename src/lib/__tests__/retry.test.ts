import { describe, it, expect } from "vitest";
import { withRetry } from "../retry";

describe("withRetry", () => {
  it("returns the value when the first try works", async () => {
    expect(await withRetry(async () => 7, { delayMs: 0 })).toBe(7);
  });

  it("retries until it succeeds", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new Error("cold start");
        return "ok";
      },
      { attempts: 3, delayMs: 0 }
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("throws the last error after all attempts fail", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw new Error("down " + calls);
        },
        { attempts: 3, delayMs: 0 }
      )
    ).rejects.toThrow("down 3");
    expect(calls).toBe(3);
  });
});