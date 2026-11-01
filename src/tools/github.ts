const API = "https://api.github.com";
const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_PAGES = 5;

export interface RepoSummary {
  name: string;
  description: string;
  language: string;
  stars: number;
  pushedAt: string;
  topics: string[];
  url: string;
}

export interface Commit {
  date: string;
  message: string;
}

export interface GitHubOptions {
  owner: string;
  /** Optional. Raises the rate limit; needs no scopes, since only public data is read. */
  token?: string;
  fetch?: typeof fetch;
  cacheTtlMs?: number;
  now?: () => number;
}

/**
 * Read-only client for one owner's public, non-fork repos.
 * Every repo argument is checked against that list, so the agent cannot be
 * pointed at other accounts or at private repos.
 */
export class GitHub {
  private readonly opts: Required<Omit<GitHubOptions, "token">> & { token?: string };
  private readonly cache = new Map<string, { at: number; value: unknown }>();

  constructor(opts: GitHubOptions) {
    this.opts = {
      owner: opts.owner,
      token: opts.token,
      fetch: opts.fetch ?? ((...a) => fetch(...a)),
      cacheTtlMs: opts.cacheTtlMs ?? 10 * 60_000,
      now: opts.now ?? Date.now,
    };
  }

  async listRepos(): Promise<RepoSummary[]> {
    const raw: RawRepo[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const batch = await this.get<RawRepo[]>(`/users/${this.opts.owner}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
      raw.push(...batch);
      if (batch.length < 100) break;
    }
    return raw
      .filter((r) => !r.fork && !r.private)
      .map((r) => ({
        name: r.name,
        description: r.description ?? "",
        language: r.language ?? "",
        stars: r.stargazers_count,
        pushedAt: r.pushed_at,
        topics: r.topics ?? [],
        url: r.html_url,
      }));
  }

  async readme(repo: string): Promise<string> {
    const name = await this.checkRepo(repo);
    return this.get<string>(`/repos/${this.opts.owner}/${name}/readme`, "application/vnd.github.raw+json");
  }

  async languages(repo: string): Promise<Record<string, number>> {
    const name = await this.checkRepo(repo);
    return this.get<Record<string, number>>(`/repos/${this.opts.owner}/${name}/languages`);
  }

  async commits(repo: string, limit: number): Promise<Commit[]> {
    const name = await this.checkRepo(repo);
    const n = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 10) : 5;
    const raw = await this.get<RawCommit[]>(`/repos/${this.opts.owner}/${name}/commits?per_page=${n}`);
    return raw.map((c) => ({ date: c.commit.author?.date ?? "", message: c.commit.message.split("\n")[0] ?? "" }));
  }

  /** Returns the canonical repo name, or throws if it is not one of the owner's public repos. */
  private async checkRepo(repo: unknown): Promise<string> {
    if (typeof repo !== "string" || !REPO_NAME.test(repo)) throw new Error("Invalid repo name");
    const match = (await this.listRepos()).find((r) => r.name.toLowerCase() === repo.toLowerCase());
    if (!match) throw new Error(`No public repo named "${repo}". Call list_repos to see the options.`);
    return match.name;
  }

  private async get<T>(path: string, accept = "application/vnd.github+json"): Promise<T> {
    const key = `${accept} ${path}`;
    const hit = this.cache.get(key);
    if (hit && this.opts.now() - hit.at < this.opts.cacheTtlMs) return hit.value as T;

    const headers: Record<string, string> = { accept, "user-agent": "agent-demo", "x-github-api-version": "2022-11-28" };
    if (this.opts.token) headers.authorization = `Bearer ${this.opts.token}`;
    const res = await this.opts.fetch(`${API}${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);

    const value = accept.includes("raw") ? await res.text() : await res.json();
    this.cache.set(key, { at: this.opts.now(), value });
    return value as T;
  }
}

interface RawRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  topics?: string[];
  html_url: string;
  fork: boolean;
  private: boolean;
}

interface RawCommit {
  commit: { message: string; author?: { date?: string } };
}
