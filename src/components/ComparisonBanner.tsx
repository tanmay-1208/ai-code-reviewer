import { compareReviews, CompareReview } from "@/lib/compare";

const MAX_LISTED = 4;

function List({ items, mark, color }: { items: string[]; mark: string; color: string }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_LISTED);
  return (
    <ul className="mt-2 space-y-0.5">
      {shown.map((t) => (
        <li key={t} className={`text-xs ${color}`}>
          {mark} {t}
        </li>
      ))}
      {items.length > MAX_LISTED && (
        <li className="text-xs text-slate-500">+{items.length - MAX_LISTED} more</li>
      )}
    </ul>
  );
}

export default function ComparisonBanner({
  before,
  after,
}: {
  before: CompareReview;
  after: CompareReview;
}) {
  const c = compareReviews(before, after);
  const up = c.scoreDelta > 0;
  const same = c.scoreDelta === 0;
  const color = same ? "text-slate-300" : up ? "text-emerald-400" : "text-red-400";
  const arrow = same ? "→" : up ? "↑" : "↓";

  return (
    <div className="mt-4 border border-slate-700 bg-slate-950 rounded-lg p-3">
      <div className="flex items-baseline gap-3">
        <span className={`text-lg font-bold ${color}`}>
          {arrow} {up ? "+" : ""}
          {c.scoreDelta}
        </span>
        <span className="text-xs text-slate-400">
          vs your previous review ({before.score} → {after.score})
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {(["critical", "warning", "suggestion"] as const).map((s) => (
          <span
            key={s}
            className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-0.5"
          >
            {s}: {c.counts[s].before} → {c.counts[s].after}
          </span>
        ))}
      </div>

      <List items={c.resolved} mark="✓ fixed:" color="text-emerald-400" />
      <List items={c.added} mark="+ new:" color="text-amber-400" />
    </div>
  );
}