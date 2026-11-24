import Link from "next/link";

const features = [
  {
    title: "Snippet or GitHub URL",
    text: "Paste code directly, or drop a link to a GitHub file or pull request and we fetch it for you.",
  },
  {
    title: "Focused reviews",
    text: "Choose Security, Performance, Readability or Beginner-friendly so the review looks at what matters to you.",
  },
  {
    title: "Structured results",
    text: "Every review gives a 0-100 score and issues ranked critical, warning or suggestion, with line numbers and fixes.",
  },
  {
    title: "History and score trend",
    text: "Every review is saved, and a trend chart shows whether your code quality is improving over time.",
  },
];

const steps = [
  { n: "1", title: "Submit your code", text: "Paste a snippet or a GitHub file / PR link." },
  { n: "2", title: "Pick a focus", text: "General, security, performance, readability or beginner." },
  { n: "3", title: "Get your review", text: "A score, ranked issues and concrete fixes in seconds." },
];

const stack = ["Next.js 14", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL (Neon)", "Groq API", "Vercel"];

const team = ["Tanmay Singh", "Ayush Bindal", "Aditya Kumar", "Ayush Raj Dixit"];

export default function Landing() {
  return (
    <main className="max-w-6xl mx-auto px-4">
      {/* Nav */}
      <nav className="flex items-center justify-between py-5">
        <span className="font-semibold tracking-tight">AI Code Reviewer</span>
        <Link
          href="/review"
          className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg transition"
        >
          Open app
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center py-16 sm:py-24">
        <span className="inline-block text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1">
          Mini Project II · Group 10
        </span>
        <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight">
          Review code in{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
            seconds
          </span>
          , not hours
        </h1>
        <p className="mt-5 text-slate-400 text-lg max-w-2xl mx-auto">
          Paste a snippet or a GitHub link and get a scored, line-by-line review covering bugs,
          security, performance and readability, powered by AI.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/review"
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            Try a review
          </Link>
          <a
            href="https://github.com/tanmay-1208/ai-code-reviewer"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-6 py-3 rounded-lg transition"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Sample result preview */}
      <section className="max-w-2xl mx-auto -mt-4 mb-20">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl shadow-indigo-500/5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Review Result</div>
              <div className="text-xs text-slate-500">JavaScript · Security focus</div>
            </div>
            <div className="text-3xl font-bold text-red-400">
              42<span className="text-sm text-slate-400 font-normal">/100</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-left">
            <div className="border border-red-500/40 bg-red-500/10 text-red-300 rounded-lg p-3">
              <div className="flex justify-between text-xs uppercase font-semibold opacity-80">
                <span>Critical</span>
                <span>Line 15</span>
              </div>
              <div className="mt-1 text-sm font-medium text-slate-100">SQL injection vulnerability</div>
              <p className="text-xs text-slate-400 mt-1">
                Use parameterised queries instead of joining user input into the SQL string.
              </p>
            </div>
            <div className="border border-amber-500/40 bg-amber-500/10 text-amber-300 rounded-lg p-3">
              <div className="flex justify-between text-xs uppercase font-semibold opacity-80">
                <span>Warning</span>
                <span>Line 17</span>
              </div>
              <div className="mt-1 text-sm font-medium text-slate-100">Cross-site scripting (XSS) risk</div>
              <p className="text-xs text-slate-400 mt-1">Escape the name before inserting it into HTML.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20">
        <h2 className="text-2xl font-bold text-center">Everything you need for a quick review</h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {features.map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="pb-20">
        <h2 className="text-2xl font-bold text-center">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {steps.map((s) => (
            <div key={s.n} className="text-center px-4">
              <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-semibold">
                {s.n}
              </div>
              <h3 className="font-semibold mt-3">{s.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="pb-20 text-center">
        <h2 className="text-2xl font-bold">Built with</h2>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {stack.map((s) => (
            <span
              key={s}
              className="text-sm text-slate-300 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16 bg-gradient-to-br from-indigo-500/15 to-sky-500/10 border border-indigo-500/30 rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-bold">Ready to review your code?</h2>
        <p className="text-slate-400 mt-2">No sign-up needed. Paste some code and see.</p>
        <Link
          href="/review"
          className="inline-block mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-medium px-6 py-3 rounded-lg transition"
        >
          Open the reviewer
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>
          Group 10 · {team.join(" · ")}
        </p>
        <p className="mt-1">B.Tech CSE · BCSJ0962 Mini Project II · Mentor: Mr. Debasish Chakraborty</p>
      </footer>
    </main>
  );
}