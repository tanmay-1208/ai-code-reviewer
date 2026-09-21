import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewCode } from "@/lib/groq";
import { fetchGithubContent } from "@/lib/github";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, code, githubUrl } = body as {
      mode: "snippet" | "github";
      code?: string;
      githubUrl?: string;
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

    // Guard against absurdly large payloads going to the model
    const MAX_CHARS = 20000;
    if (codeToReview.length > MAX_CHARS) {
      codeToReview = codeToReview.slice(0, MAX_CHARS) + "\n\n/* ...truncated for review... */";
    }

    const result = await reviewCode(codeToReview, contextLabel);

    const saved = await prisma.review.create({
      data: {
        source: mode,
        sourceRef,
        language: result.language,
        summary: result.summary,
        issues: result.issues as unknown as object,
        score: result.score,
        rawCode: codeToReview,
      },
    });

    return NextResponse.json({ review: saved });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
