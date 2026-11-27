import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { getOwnerId } from "@/lib/owner";

// Always read live data; never cache or pre-render.
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// GET /api/review/:id - one saved review, only if it belongs to this visitor.
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = await withRetry(() =>
      prisma.review.findFirst({
        where: { id: params.id, ownerId },
        select: {
          id: true,
          source: true,
          sourceRef: true,
          language: true,
          summary: true,
          issues: true,
          score: true,
          createdAt: true,
        },
      })
    );
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load review" }, { status: 500 });
  }
}

// DELETE /api/review/:id - delete a review, only if it belongs to this visitor.
// deleteMany keeps the call retry-safe and turns "not yours / not found" into
// a clean 404 instead of a thrown error.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const result = await withRetry(() =>
      prisma.review.deleteMany({ where: { id: params.id, ownerId } })
    );
    if (result.count === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}