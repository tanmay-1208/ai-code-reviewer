import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { getOwnerId } from "@/lib/owner";

// Never run this at build time; always query live data.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // A brand-new visitor has no id yet, so they have no history.
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return NextResponse.json({ reviews: [] });
    }

    const reviews = await withRetry(() =>
      prisma.review.findMany({
        where: { ownerId },
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