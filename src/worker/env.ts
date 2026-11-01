/** Workers Rate Limiting binding. */
export interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  /** Secret. Set with `wrangler secret put ANTHROPIC_API_KEY`. */
  ANTHROPIC_API_KEY: string;
  /** Optional secret. A token with no scopes, only to raise the GitHub rate limit. */
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  /** Comma-separated list of origins allowed to call the API. */
  ALLOWED_ORIGINS?: string;
  MODEL?: string;
  RATE_LIMITER?: RateLimitBinding;
}
