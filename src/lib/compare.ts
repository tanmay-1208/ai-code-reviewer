// Pure helpers for the before/after comparison banner.

export interface CompareIssue {
  severity: "critical" | "warning" | "suggestion";
  title: string;
}

export interface CompareReview {
  score: number;
  issues: CompareIssue[];
}

export interface Comparison {
  scoreDelta: number;
  resolved: string[]; // issue titles in the old review that are gone
  added: string[]; // issue titles that are new
  counts: {
    critical: { before: number; after: number };
    warning: { before: number; after: number };
    suggestion: { before: number; after: number };
  };
}

function words(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/**
 * Titles are written by the model and wording changes between runs, so
 * two issues count as "the same" when most of the words of the shorter
 * title appear in the other (overlap coefficient >= 0.6).
 */
export function sameIssue(a: string, b: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let shared = 0;
  wa.forEach((w) => {
    if (wb.has(w)) shared++;
  });
  return shared / Math.min(wa.size, wb.size) >= 0.6;
}

function count(r: CompareReview, s: CompareIssue["severity"]): number {
  return r.issues.filter((i) => i.severity === s).length;
}

export function compareReviews(before: CompareReview, after: CompareReview): Comparison {
  const resolved = before.issues
    .filter((b) => !after.issues.some((a) => sameIssue(a.title, b.title)))
    .map((i) => i.title);
  const added = after.issues
    .filter((a) => !before.issues.some((b) => sameIssue(a.title, b.title)))
    .map((i) => i.title);

  return {
    scoreDelta: after.score - before.score,
    resolved,
    added,
    counts: {
      critical: { before: count(before, "critical"), after: count(after, "critical") },
      warning: { before: count(before, "warning"), after: count(after, "warning") },
      suggestion: { before: count(before, "suggestion"), after: count(after, "suggestion") },
    },
  };
}