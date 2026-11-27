import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewCode, isReviewFocus } from "@/lib/groq";
import { fetchGithubContent } from "@/lib/github";
import { withRetry } from "@/lib/retry";
import { checkRateLimit } from "@/lib/rateLimit";
import { getOwnerId, newOwnerId, OWNER_COOKIE, ownerCookieOptions } from "@/lib/owner";

export const maxDuration = 60;

// 10 reviews per minute per visitor protects the free Groq quota.
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rl = checkRateLimit(ip, RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many reviews. Please wait ${rl.retryAfterSec}s and try again.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    // Existing visitor keeps their id; a new visitor gets one with this request.
    const existingOwner = getOwnerId(req);
    const ownerId = existingOwner ?? newOwnerId();

    const body = await req.json();
    const { mode, code, githubUrl, focus } = body as {
      mode: "snippet" | "github";
      code?: string;
      githubUrl?: string;
      focus?: string;
    };

    let codeToReview = "";
    let contextLabel: string | undefined;
    let sourceRef: string | null = null;

    if (mode === "snippet") {
      if (!code || !code.trim()) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
      }
      codeToReview = code;
    } else if (mode === "github") {
      if (!githubUrl || !githubUrl.trim()) {
        return NextResponse.json({ error: "No GitHub URL provided" }, { status: 400 });
      }
      const fetched = await fetchGithubContent(githubUrl.trim());
      codeToReview = fetched.content;
      contextLabel = fetched.contextLabel;
      sourceRef = githubUrl.trim();
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Guard against large payloads (Groq free tier caps tokens per minute)
    const MAX_CHARS = 20000;
    if (codeToReview.length > MAX_CHARS) {
      codeToReview = codeToReview.slice(0, MAX_CHARS) + "\n\n/* ...truncated for review... */";
    }

    const result = await reviewCode(
      codeToReview,
      contextLabel,
      isReviewFocus(focus) ? focus : "general"
    );

    // Retry the save so a Neon cold start does not lose a finished review.
    const saved = await withRetry(() =>
      prisma.review.create({
        data: {
          ownerId,
          source: mode,
          sourceRef,
          language: result.language,
          summary: result.summary,
          issues: result.issues as unknown as object,
          score: result.score,
          rawCode: codeToReview,
        },
      })
    );

    const res = NextResponse.json({ review: saved });
    if (!existingOwner) {
      res.cookies.set(OWNER_COOKIE, ownerId, ownerCookieOptions());
    }
    return res;
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}