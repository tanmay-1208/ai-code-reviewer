import { describe, it, expect } from "vitest";
import { parseGithubUrl } from "../github";

describe("parseGithubUrl", () => {
  it("parses a blob (file) URL correctly", () => {
    const result = parseGithubUrl(
      "https://github.com/expressjs/express/blob/master/lib/utils.js"
    );
    expect(result.owner).toBe("expressjs");
    expect(result.repo).toBe("express");
    expect(result.kind).toBe("blob");
    expect(result.rest).toEqual(["master", "lib", "utils.js"]);
  });

  it("parses a pull request URL correctly", () => {
    const result = parseGithubUrl("https://github.com/expressjs/express/pull/5500");
    expect(result.owner).toBe("expressjs");
    expect(result.repo).toBe("express");
    expect(result.kind).toBe("pull");
    expect(result.rest).toEqual(["5500"]);
  });

  it("parses a bare repo URL correctly (no kind)", () => {
    const result = parseGithubUrl("https://github.com/expressjs/express");
    expect(result.owner).toBe("expressjs");
    expect(result.repo).toBe("express");
    expect(result.kind).toBeUndefined();
  });

  it("handles a nested file path across multiple segments", () => {
    const result = parseGithubUrl(
      "https://github.com/vercel/next.js/blob/canary/packages/next/src/server/config.ts"
    );
    expect(result.rest).toEqual([
      "canary",
      "packages",
      "next",
      "src",
      "server",
      "config.ts",
    ]);
  });

  it("throws for a non-github.com URL", () => {
    expect(() => parseGithubUrl("https://gitlab.com/owner/repo")).toThrow(
      "Only github.com URLs are supported"
    );
  });

  it("throws when owner or repo is missing", () => {
    expect(() => parseGithubUrl("https://github.com/onlyowner")).toThrow(
      "Could not parse owner/repo from URL"
    );
  });

  it("throws on a completely malformed URL", () => {
    expect(() => parseGithubUrl("not-a-url")).toThrow();
  });
});
