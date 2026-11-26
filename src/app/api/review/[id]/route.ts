import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

// Always read live data; never cache or pre-render.
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// GET /api/review/:id - full saved review (including every issue).
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const review = await withRetry(() =>
      prisma.review.findUnique({
        where: { id: params.id },
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

// DELETE /api/review/:id - remove a saved review.
// deleteMany is used so the call is safe to retry and a missing row is a
// clean 404 rather than a thrown error.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const result = await withRetry(() =>
      prisma.review.deleteMany({ where: { id: params.id } })
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