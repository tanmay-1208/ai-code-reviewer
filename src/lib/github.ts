interface GithubFetchResult {
  content: string;
  contextLabel: string;
}

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Parses a github.com URL into its owner/repo/kind/rest parts.
 * Extracted as its own function so it can be unit tested without
 * needing network access.
 */
export function parseGithubUrl(url: string): {
  owner: string;
  repo: string;
  kind: string | undefined;
  rest: string[];
} {
  const parsed = new URL(url);
  if (parsed.hostname !== "github.com") {
    throw new Error("Only github.com URLs are supported");
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const [owner, repo, kind, ...rest] = parts;

  if (!owner || !repo) {
    throw new Error("Could not parse owner/repo from URL");
  }

  return { owner, repo, kind, rest };
}

/**
 * Supports:
 *  - PR URLs:   https://github.com/{owner}/{repo}/pull/{number}
 *  - File URLs: https://github.com/{owner}/{repo}/blob/{branch}/{path}
 *  - Repo URLs: https://github.com/{owner}/{repo}  (reviews the README as a fallback overview)
 */
export async function fetchGithubContent(url: string): Promise<GithubFetchResult> {
  const { owner, repo, kind, rest } = parseGithubUrl(url);

  // Pull request -> fetch the diff
  if (kind === "pull" && rest[0]) {
    const prNumber = rest[0];
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers: { ...authHeaders(), Accept: "application/vnd.github.v3.diff" } }
    );
    if (!res.ok) {
      throw new Error(`GitHub API error fetching PR diff: ${res.status} ${res.statusText}`);
    }
    const diff = await res.text();
    return {
      content: diff,
      contextLabel: `Pull request #${prNumber} on ${owner}/${repo} (unified diff)`,
    };
  }

  // Blob (single file) -> fetch raw content
  if (kind === "blob" && rest.length >= 2) {
    const branch = rest[0];
    const filePath = rest.slice(1).join("/");
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const res = await fetch(rawUrl);
    if (!res.ok) {
      throw new Error(`Could not fetch file: ${res.status} ${res.statusText}`);
    }
    const content = await res.text();
    return {
      content,
      contextLabel: `File ${filePath} from ${owner}/${repo}@${branch}`,
    };
  }

  // Bare repo URL -> fall back to README for a general overview review
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { ...authHeaders(), Accept: "application/vnd.github.raw" },
  });
  if (!res.ok) {
    throw new Error(
      `Unsupported GitHub URL. Provide a PR URL or a direct file (blob) URL. (README fallback failed: ${res.status})`
    );
  }
  const content = await res.text();
  return {
    content,
    contextLabel: `README overview of ${owner}/${repo} (no specific file or PR given)`,
  };
}
