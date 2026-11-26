"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildTrend, toSvgPoints } from "@/lib/trend";
import ComparisonBanner from "@/components/ComparisonBanner";

interface ReviewIssue {
  severity: "critical" | "warning" | "suggestion";
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}

interface Review {
  id: string;
  source: string;
  sourceRef: string | null;
  language: string | null;
  summary: string;
  issues: ReviewIssue[];
  score: number;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  source: string;
  sourceRef: string | null;
  language: string | null;
  summary: string;
  score: number;
  createdAt: string;
}

const severityStyles: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  suggestion: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

const focusOptions = [
  { value: "general", label: "General review" },
  { value: "security", label: "Security" },
  { value: "performance", label: "Performance" },
  { value: "readability", label: "Readability" },
  { value: "beginner", label: "Beginner-friendly" },
];

const card = "bg-slate-900 border border-slate-800 rounded-xl p-5";

function scoreHex(score: number) {
  return score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="text-3xl font-bold" style={{ color: scoreHex(score) }}>
      {score}
      <span className="text-sm text-slate-400 font-normal">/100</span>
    </div>
  );
}

function ScoreTrend({ history }: { history: HistoryItem[] }) {
  const trend = useMemo(() => buildTrend(history), [history]);

  if (trend.points.length < 2) {
    return (
      <section className={card}>
        <h2 className="text-base font-semibold">Score Trend</h2>
        <p className="text-sm text-slate-500 mt-2">
          Run at least two reviews to see how your code quality changes.
        </p>
      </section>
    );
  }

  const W = 480;
  const H = 190;
  const PAD = 26;
  const coords = toSvgPoints(trend.points, W, H, PAD);
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const gridValues = [0, 50, 100];
  const change = trend.change ?? 0;

  const stats = [
    { label: "Avg", value: `${trend.average}`, color: "text-slate-100" },
    { label: "Best", value: `${trend.best}`, color: "text-emerald-400" },
    { label: "Worst", value: `${trend.worst}`, color: "text-red-400" },
    {
      label: "Change",
      value: `${change > 0 ? "+" : ""}${change}`,
      color:
        change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-slate-300",
    },
  ];

  return (
    <section className={card}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Score Trend</h2>
        <span className="text-xs text-slate-500">last {trend.points.length} reviews</span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className={`text-lg font-semibold leading-tight ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto mt-3"
        role="img"
        aria-label="Line chart of review scores over time"
      >
        {gridValues.map((v) => {
          const y = PAD + (1 - v / 100) * (H - PAD * 2);
          return (
            <g key={v}>
              <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" />
              <text x={PAD - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                {v}
              </text>
            </g>
          );
        })}
        <polyline
          points={line}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="4" fill={scoreHex(trend.points[i].score)}>
            <title>
              {`${trend.points[i].score}/100 - ${new Date(
                trend.points[i].createdAt
              ).toLocaleString()}`}
            </title>
          </circle>
        ))}
      </svg>
    </section>
  );
}

export default function Home() {
  const [mode, setMode] = useState<"snippet" | "github">("snippet");
  const [code, setCode] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [focus, setFocus] = useState("general");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [previous, setPrevious] = useState<Review | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (res.ok) setHistory(data.reviews);
    } catch {
      // silent - history is non-critical
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prevReview = review;
    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "snippet" ? { mode, code, focus } : { mode, githubUrl, focus }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Review failed");
      }
      setReview(data.review);
      setPrevious(prevReview);
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Open a saved review from the history list.
  async function openReview(id: string) {
    setError(null);
    setOpening(true);
    try {
      const res = await fetch(`/api/review/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not open review");
      }
      setReview(data.review);
      setPrevious(null); // a past review has no "previous run" to compare with
      setTimeout(() => {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open review");
    } finally {
      setOpening(false);
    }
  }

  // Delete a saved review after confirmation.
  async function deleteReview(id: string) {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/review/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not delete review");
      }
      setHistory((h) => h.filter((item) => item.id !== id));
      if (review?.id === id) setReview(null);
      if (previous?.id === id) setPrevious(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete review");
    } finally {
      setDeletingId(null);
    }
  }

  const counts = review
    ? {
        critical: review.issues.filter((i) => i.severity === "critical").length,
        warning: review.issues.filter((i) => i.severity === "warning").length,
        suggestion: review.issues.filter((i) => i.severity === "suggestion").length,
      }
    : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">AI Code Reviewer</h1>
        <p className="text-slate-400 mt-1">
          Paste a snippet or drop a GitHub file / PR URL to get an instant AI review.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* LEFT: input + result */}
        <div className="lg:col-span-3 space-y-5">
          <form onSubmit={handleSubmit} className={card}>
            <div className="flex gap-2 mb-4">
              {(["snippet", "github"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    mode === m
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m === "snippet" ? "Paste Code" : "GitHub URL"}
                </button>
              ))}
            </div>

            {mode === "snippet" ? (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/blob/main/src/file.ts or .../pull/123"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label htmlFor="focus" className="block text-xs text-slate-400 mb-1">
                  Review focus
                </label>
                <select
                  id="focus"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {focusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition"
              >
                {loading ? "Reviewing..." : "Run Review"}
              </button>
            </div>
          </form>

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 text-red-300 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className={`${card} animate-pulse text-slate-400 text-sm`}>
              Analysing your code...
            </div>
          )}

          {opening && (
            <div className={`${card} animate-pulse text-slate-400 text-sm`}>
              Loading saved review...
            </div>
          )}

          {!review && !loading && !opening && !error && (
            <div className={`${card} text-center text-slate-500 text-sm py-10`}>
              Your review will appear here.
            </div>
          )}

          {review && counts && !opening && (
            <section id="result" className={`${card} scroll-mt-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Review Result</h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {review.language}
                    <span className="text-slate-600"> · </span>
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                  {review.sourceRef && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-md">
                      {review.sourceRef}
                    </p>
                  )}
                </div>
                <ScoreBadge score={review.score} />
              </div>

              <p className="mt-3 text-slate-200 text-sm leading-relaxed">{review.summary}</p>

              {previous && <ComparisonBanner before={previous} after={review} />}

              <div className="flex flex-wrap gap-2 mt-4">
                {(["critical", "warning", "suggestion"] as const).map((s) => (
                  <span
                    key={s}
                    className={`border rounded-full px-3 py-0.5 text-xs font-medium ${severityStyles[s]}`}
                  >
                    {counts[s]} {s}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-3 max-h-[26rem] overflow-y-auto pr-1">
                {review.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`border rounded-lg p-3 ${severityStyles[issue.severity] || severityStyles.suggestion}`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide font-semibold opacity-80">
                      <span>{issue.severity}</span>
                      {issue.line !== null && <span>Line {issue.line}</span>}
                    </div>
                    <div className="mt-1 font-medium text-slate-100">{issue.title}</div>
                    <p className="text-sm text-slate-300 mt-1">{issue.description}</p>
                    <p className="text-sm mt-2 text-slate-400">
                      <span className="font-medium text-slate-300">Suggestion: </span>
                      {issue.suggestion}
                    </p>
                  </div>
                ))}
                {review.issues.length === 0 && (
                  <p className="text-sm text-slate-400">No issues found. Nice work!</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: trend + history */}
        <aside className="lg:col-span-2 space-y-5 lg:sticky lg:top-6">
          <ScoreTrend history={history} />

          <section className={card}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-base font-semibold">Recent Reviews</h2>
              {history.length > 0 && (
                <span className="text-xs text-slate-500">Click to open</span>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={`border rounded-lg flex items-stretch bg-slate-950 transition ${
                      review?.id === h.id ? "border-indigo-500/60" : "border-slate-800"
                    } ${deletingId === h.id ? "opacity-40" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => openReview(h.id)}
                      disabled={opening || deletingId === h.id}
                      className="flex-1 min-w-0 text-left px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-900 rounded-l-lg transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate">
                          {h.sourceRef || `Snippet review (${h.language || "unknown"})`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(h.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className="text-sm font-semibold shrink-0"
                        style={{ color: scoreHex(h.score) }}
                      >
                        {h.score}/100
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReview(h.id)}
                      disabled={deletingId === h.id}
                      aria-label="Delete review"
                      title="Delete review"
                      className="px-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-r-lg border-l border-slate-800 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}