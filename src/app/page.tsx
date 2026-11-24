"use client";

import { useEffect, useMemo, useState } from "react";
import { buildTrend, toSvgPoints } from "@/lib/trend";

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

function scoreHex(score: number) {
  return score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className={`text-3xl font-bold ${color}`}>
      {score}
      <span className="text-sm text-slate-400 font-normal">/100</span>
    </div>
  );
}

function ScoreTrend({ history }: { history: HistoryItem[] }) {
  const trend = useMemo(() => buildTrend(history), [history]);
  if (trend.points.length < 2) return null;

  const W = 640;
  const H = 220;
  const PAD = 28;
  const coords = toSvgPoints(trend.points, W, H, PAD);
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const gridValues = [0, 25, 50, 75, 100];
  const change = trend.change ?? 0;

  const stats = [
    { label: "Average", value: `${trend.average}` },
    { label: "Best", value: `${trend.best}` },
    { label: "Worst", value: `${trend.worst}` },
    {
      label: "Change",
      value: `${change > 0 ? "+" : ""}${change}`,
      color:
        change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-slate-300",
    },
  ];

  return (
    <section className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-lg font-semibold">Score Trend</h2>
      <p className="text-slate-400 text-sm mt-1">
        Code quality across your last {trend.points.length} reviews, oldest to newest.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-xl font-semibold ${s.color ?? "text-slate-100"}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto mt-4"
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
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
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
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Code Reviewer</h1>
        <p className="text-slate-400 mt-1">
          Paste a snippet or drop a GitHub file / PR URL to get an instant AI review.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("snippet")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === "snippet"
                ? "bg-indigo-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Paste Code
          </button>
          <button
            type="button"
            onClick={() => setMode("github")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === "github"
                ? "bg-indigo-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            GitHub URL
          </button>
        </div>

        {mode === "snippet" ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            rows={12}
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

        <div className="mt-4">
          <label htmlFor="focus" className="block text-sm text-slate-400 mb-1">
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
          className="mt-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition"
        >
          {loading ? "Reviewing..." : "Run Review"}
        </button>
      </form>

      {error && (
        <div className="mt-4 border border-red-500/40 bg-red-500/10 text-red-300 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {review && (
        <section className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Review Result</h2>
              <p className="text-slate-400 text-sm mt-1">{review.language}</p>
            </div>
            <ScoreBadge score={review.score} />
          </div>

          <p className="mt-4 text-slate-200 leading-relaxed">{review.summary}</p>

          <div className="mt-6 space-y-3">
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

      <ScoreTrend history={history} />

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Recent Reviews</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-4 bg-slate-900"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">
                    {h.sourceRef || `Snippet review (${h.language || "unknown"})`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className={`text-sm font-semibold shrink-0`} style={{ color: scoreHex(h.score) }}>
                  {h.score}/100
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}