import { describe, it, expect } from "vitest";
import { cleanJsonResponse } from "../groq";

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
