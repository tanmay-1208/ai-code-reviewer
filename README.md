# AI Code Reviewer

A full-stack mini project: paste a code snippet or a GitHub file/PR URL, and get
an AI-generated code review (bugs, security, performance, style) with a quality
score and issue list. Every review is saved to Postgres so you get a history view.

**Stack:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · Prisma · PostgreSQL · Groq API

## Features
- Paste any code snippet directly
- Or paste a GitHub URL:
  - a file: `https://github.com/owner/repo/blob/main/path/to/file.ts`
  - a pull request: `https://github.com/owner/repo/pull/123` (reviews the diff)
  - a bare repo URL (falls back to reviewing the README)
- AI returns: overall score (0-100), summary, and a list of issues each tagged
  `critical` / `warning` / `suggestion` with a line number and fix suggestion
- Review history persisted in PostgreSQL

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `DATABASE_URL` — your Postgres connection string (e.g. from Neon or Supabase)
   - `GROQ_API_KEY` — from https://console.groq.com. Groq's free tier needs
     no credit card — you just sign up and generate a key under API Keys.
     Usage is capped by rate limits (requests/tokens per minute), not cost.
   - `GITHUB_TOKEN` (optional) — raises GitHub API rate limits, needed for private repos

3. **Set up the database**
   ```bash
   npm run prisma:migrate
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Project structure
```
src/
  app/
    page.tsx              # Frontend UI (tabs, form, results, history)
    layout.tsx
    api/
      review/route.ts     # POST: run an AI review, save to DB
      history/route.ts    # GET: list past reviews
  lib/
    groq.ts                  # Groq API call + JSON parsing
    github.ts               # Resolves GitHub URLs into raw code/diff
    prisma.ts               # Prisma client singleton
prisma/
  schema.prisma            # Review model
```

## Notes on the Groq integration
- `src/lib/groq.ts` calls `https://api.groq.com/openai/v1/chat/completions`
  directly via `fetch` — no extra SDK dependency needed, since Groq's API is
  OpenAI-compatible.
- The default model is `llama-3.3-70b-versatile`. `openai/gpt-oss-20b` is a
  good alternative if you want a model tuned more for coding/reasoning — just
  change the `GROQ_MODEL` constant in `groq.ts`.
- If you hit a 429 (rate limit) error during testing, wait a minute — the free
  tier caps requests per minute, not total usage. Check your exact limits at
  console.groq.com → Settings → Limits.
- If you see a 401 error, double check `GROQ_API_KEY` in `.env` is set correctly.

## Possible extensions
- Add auth (NextAuth) to scope history per user
- Stream the AI response for a "typing" effect
- Support multi-file reviews (zip upload or full repo crawl)
- Add a "re-review after fix" diff comparison
- Rate-limit the `/api/review` route in production
