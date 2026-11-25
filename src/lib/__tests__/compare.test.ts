import { describe, it, expect } from "vitest";
import { compareReviews, sameIssue } from "../compare";

describe("sameIssue", () => {
  it("matches reworded titles", () => {
    expect(sameIssue("SQL injection vulnerability", "SQL injection risk in query")).toBe(true);
  });
  it("does not match unrelated titles", () => {
    expect(sameIssue("Hard-coded API secret", "Missing error handling")).toBe(false);
  });
});

describe("compareReviews", () => {
  const before = {
    score: 40,
    issues: [
      { severity: "critical" as const, title: "SQL injection vulnerability" },
      { severity: "critical" as const, title: "Hard-coded API secret" },
      { severity: "warning" as const, title: "No error handling for DB query" },
    ],
  };
  const after = {
    score: 75,
    issues: [
      { severity: "warning" as const, title: "No error handling for database query" },
      { severity: "suggestion" as const, title: "Use const instead of let" },
    ],
  };

  it("computes the score change", () => {
    expect(compareReviews(before, after).scoreDelta).toBe(35);
  });
  it("lists resolved and new issues", () => {
    const c = compareReviews(before, after);
    expect(c.resolved).toEqual(["SQL injection vulnerability", "Hard-coded API secret"]);
    expect(c.added).toEqual(["Use const instead of let"]);
  });
  it("counts issues per severity", () => {
    const c = compareReviews(before, after);
    expect(c.counts.critical).toEqual({ before: 2, after: 0 });
    expect(c.counts.suggestion).toEqual({ before: 0, after: 1 });
  });
});