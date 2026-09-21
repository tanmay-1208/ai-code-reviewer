-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "language" TEXT,
    "summary" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "rawCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
