import { claude, UpstreamError } from "../agent/claude.ts";
import { runAgent, type AgentResult } from "../agent/loop.ts";
import { SYSTEM_PROMPT } from "../agent/prompt.ts";
import type { Llm } from "../agent/types.ts";
import { GitHub } from "../tools/github.ts";
import { createTools } from "../tools/index.ts";
import type { Env } from "./env.ts";

export const MAX_QUESTION_CHARS = 300;
const DEFAULT_MODEL = "claude-haiku-5-5";
const DEFAULT_OWNER = "AcKeskin";
const MAX_TOKENS = 600;
const MAX_TURNS = 5;

export type AskResponse = AgentResult;

export interface HandlerDeps {
  privateSummary: string;
  /** Overrides fetch for Claude and GitHub. Used by tests. */
  fetch?: typeof fetch;
  /** Overrides the model. Used by tests. */
  llm?: Llm;
}

/**
 * Routes:
 *   GET  /api/health  -> { ok: true }
 *   POST /api/ask     -> AskResponse, body { question: string }
 */
export function createHandler(deps: HandlerDeps) {
  // One client per isolate, so its cache survives between requests.
  let github: GitHub | undefined;

  return async function handle(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/health" && req.method === "GET") return json({ ok: true }, 200);
    if (pathname !== "/api/ask") return json({ error: "Not found" }, 404);

    // Origin is easy to fake outside a browser, so this only stops other sites
    // from using the API. The rate limit and the spend limit are the real guards.
    const cors = corsHeaders(req.headers.get("origin"), env.ALLOWED_ORIGINS);
    if (!cors) return json({ error: "Origin not allowed" }, 403);

    const reply = (body: unknown, status = 200) => json(body, status, cors);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

    const question = await readQuestion(req);
    if (!question) {
      return reply({ error: `Send { "question": string } of 1 to ${MAX_QUESTION_CHARS} characters` }, 400);
    }

    if (env.RATE_LIMITER) {
      const key = req.headers.get("cf-connecting-ip") ?? "unknown";
      const { success } = await env.RATE_LIMITER.limit({ key });
      if (!success) return reply({ error: "Too many questions. Try again in a minute." }, 429);
    }

    github ??= new GitHub({ owner: env.GITHUB_OWNER ?? DEFAULT_OWNER, token: env.GITHUB_TOKEN, fetch: deps.fetch });
    const llm =
      deps.llm ??
      claude({ apiKey: env.ANTHROPIC_API_KEY, model: env.MODEL ?? DEFAULT_MODEL, maxTokens: MAX_TOKENS, fetch: deps.fetch });

    try {
      const result = await runAgent(question, {
        llm,
        tools: createTools(github, deps.privateSummary),
        system: SYSTEM_PROMPT,
        maxTurns: MAX_TURNS,
      });
      return reply(result satisfies AskResponse);
    } catch (err) {
      const status = err instanceof UpstreamError ? err.status : 0;
      console.error("Agent failed", status, err instanceof Error ? err.message : err);
      return reply({ error: "The model is unavailable right now." }, 502);
    }
  };
}

async function readQuestion(req: Request): Promise<string | null> {
  try {
    const body = (await req.json()) as { question?: unknown };
    const q = typeof body.question === "string" ? body.question.trim() : "";
    return q.length > 0 && q.length <= MAX_QUESTION_CHARS ? q : null;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string | null, allowed = ""): Record<string, string> | null {
  if (!origin) return null;
  const list = allowed.split(",").map((o) => o.trim()).filter(Boolean);
  if (!list.includes(origin)) return null;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
