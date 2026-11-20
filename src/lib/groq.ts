// Groq (console.groq.com) integration. Groq exposes an OpenAI-compatible
// chat completions endpoint on their fast LPU hardware, so we call it
// directly with fetch rather than pulling in an SDK.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.3-70b-versatile was deprecated by Groq on 08/16/26.
// openai/gpt-oss-120b is the recommended replacement — strong general quality.
// openai/gpt-oss-20b is a smaller/faster alternative if you hit rate limits.
const GROQ_MODEL = "openai/gpt-oss-120b";

export interface ReviewIssue {
  severity: "critical" | "warning" | "suggestion";
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}

export interface ReviewResult {
  summary: string;
  language: string;
  score: number; // 0-100
  issues: ReviewIssue[];
}

export type ReviewFocus =
  | "general"
  | "security"
  | "performance"
  | "readability"
  | "beginner";

/**
 * Extra instruction added to the user prompt for each review focus.
 * "general" adds nothing, so the default behaviour is unchanged.
 */
export const FOCUS_INSTRUCTIONS: Record<ReviewFocus, string> = {
  general: "",
  security:
    "FOCUS: Prioritise security. Look for injection, XSS, unsafe input handling, secrets in code, weak authentication and unsafe dependencies. Rank security problems as critical or warning before anything else.",
  performance:
    "FOCUS: Prioritise performance. Look for unnecessary loops, N+1 queries, blocking calls, memory leaks and wasted re-renders.",
  readability:
    "FOCUS: Prioritise readability and maintainability. Look for naming, function length, duplication, missing types and unclear structure.",
  beginner:
    "FOCUS: The author is a beginner. Explain each issue in simple language, define any jargon, and keep every suggestion short and easy to follow.",
};

/** Type guard so API input can be validated without trusting the client. */
export function isReviewFocus(value: unknown): value is ReviewFocus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(FOCUS_INSTRUCTIONS, value)
  );
}

const SYSTEM_PROMPT = `You are a senior software engineer performing a code review.
Analyze the given code for bugs, security issues, performance problems, readability,
and best-practice violations. Be specific and reference line numbers where possible.

Respond with ONLY valid JSON (no markdown fences, no preamble) matching this exact shape:
{
  "summary": "2-4 sentence high-level assessment",
  "language": "detected programming language",
  "score": <integer 0-100 overall code quality score>,
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "line": <line number or null>,
      "title": "short issue title",
      "description": "what is wrong and why it matters",
      "suggestion": "concrete fix or improvement"
    }
  ]
}`;

/**
 * Strips incidental markdown code fences (```json ... ```) that models
 * sometimes wrap around JSON output despite instructions not to.
 * Extracted as a pure function so it can be unit tested without any
 * network calls.
 */
export function cleanJsonResponse(raw: string): string {
  return raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function reviewCode(
  code: string,
  context?: string,
  focus: ReviewFocus = "general"
): Promise<ReviewResult> {
  const userPrompt = [
    FOCUS_INSTRUCTIONS[focus],
    context ? `Context: ${context}` : "",
    `Review this code:\n\n${code}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "{}";

  const cleaned = cleanJsonResponse(raw);

  try {
    const parsed = JSON.parse(cleaned) as ReviewResult;
    return parsed;
  } catch (err) {
    throw new Error("Failed to parse AI review response as JSON: " + (err as Error).message);
  }
}