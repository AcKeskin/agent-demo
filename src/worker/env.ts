/** Workers Rate Limiting binding. */
export interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  /** Secret. Set with `wrangler secret put ANTHROPIC_API_KEY`. */
  ANTHROPIC_API_KEY: string;
  /**
   * Secret. A token with no scopes. Needed in practice: without it GitHub
   * allows 60 requests per hour per IP, and Worker IPs are shared.
   */
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  /** Comma-separated repos the agent may read. Empty means all public, non-fork repos. */
  ALLOWED_REPOS?: string;
  /** Comma-separated list of origins allowed to call the API. */
  ALLOWED_ORIGINS?: string;
  MODEL?: string;
  RATE_LIMITER?: RateLimitBinding;
  /** Same binding type, one shared key: caps all visitors together. */
  GLOBAL_LIMITER?: RateLimitBinding;
}
