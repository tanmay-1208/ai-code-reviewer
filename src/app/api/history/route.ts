import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

// Never run this at build time; always query live data.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await withRetry(() =>
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          source: true,
          sourceRef: true,
          language: true,
          summary: true,
          score: true,
          createdAt: true,
        },
      })
    );
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}