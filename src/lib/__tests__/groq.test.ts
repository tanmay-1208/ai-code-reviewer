import { describe, it, expect } from "vitest";
import { cleanJsonResponse } from "../groq";
import { isReviewFocus, FOCUS_INSTRUCTIONS } from "../groq";

describe("review focus", () => {
  it("accepts known focus values", () => {
    expect(isReviewFocus("security")).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isReviewFocus("hack")).toBe(false);
    expect(isReviewFocus(undefined)).toBe(false);
  });
  it("has an instruction for every focus except general", () => {
    expect(FOCUS_INSTRUCTIONS.security).toContain("security");
    expect(FOCUS_INSTRUCTIONS.general).toBe("");
  });
});

describe("cleanJsonResponse", () => {
  it("returns valid JSON unchanged", () => {
    const input = '{"score": 80, "summary": "Looks good"}';
    expect(cleanJsonResponse(input)).toBe(input);
  });

  it("strips a leading ```json fence", () => {
    const input = '```json\n{"score": 80}\n```';
    const result = cleanJsonResponse(input);
    expect(result.startsWith("{")).toBe(true);
    expect(JSON.parse(result)).toEqual({ score: 80 });
  });

  it("strips fences case-insensitively", () => {
    const input = '```JSON\n{"score": 42}\n```';
    const result = cleanJsonResponse(input);
    expect(JSON.parse(result)).toEqual({ score: 42 });
  });

  it("trims surrounding whitespace", () => {
    const input = '   \n{"score": 10}\n   ';
    expect(cleanJsonResponse(input)).toBe('{"score": 10}');
  });

  it("produces parseable JSON matching the expected review shape", () => {
    const input = `\`\`\`json
{
  "summary": "Minor issues found",
  "language": "JavaScript",
  "score": 85,
  "issues": [
    { "severity": "warning", "line": 4, "title": "x", "description": "y", "suggestion": "z" }
  ]
}
\`\`\``;
    const parsed = JSON.parse(cleanJsonResponse(input));
    expect(parsed.score).toBe(85);
    expect(parsed.issues).toHaveLength(1);
    expect(parsed.issues[0].severity).toBe("warning");
  });
});
