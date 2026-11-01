import { describe, expect, it, vi } from "vitest";
import type { Env } from "../src/worker/env.ts";
import { createHandler } from "../src/worker/handler.ts";
import { fakeGitHub, scripted, text, toolCall } from "./helpers.ts";

const ORIGIN = "https://ackeskin.github.io";
const ENV: Env = { ANTHROPIC_API_KEY: "test-key", ALLOWED_ORIGINS: ORIGIN };

function ask(body: unknown, headers: Record<string, string> = { origin: ORIGIN }) {
  return new Request("https://worker.test/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("worker handler", () => {
  it("runs the agent with GitHub tools and returns the trace", async () => {
    const llm = scripted(toolCall("list_repos"), text("He has 2 public repos."));
    const handle = createHandler({ privateSummary: "x", llm, fetch: fakeGitHub().fetch });
    const res = await handle(ask({ question: "How many repos?" }), ENV);

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    const body = await res.json();
    expect(body.answer).toBe("He has 2 public repos.");
    expect(body.steps[0]).toMatchObject({ tool: "list_repos", ok: true });
    expect(llm.calls[0]!.tools.map((t) => t.name)).toContain("get_private_work_summary");
  });

  it("calls the Claude API with the key, model and tools", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ content: [{ type: "text", text: "Hi" }], stop_reason: "end_turn" }));
    }) as unknown as typeof fetch;
    const res = await createHandler({ privateSummary: "", fetch: fetchFn })(ask({ question: "hi" }), ENV);

    expect((await res.json()).answer).toBe("Hi");
    expect(calls[0]!.url).toBe("https://api.anthropic.com/v1/messages");
    expect((calls[0]!.init.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
    const sent = JSON.parse(calls[0]!.init.body as string);
    expect(sent.model).toBe("claude-haiku-5-5");
    expect(sent.tools).toHaveLength(5);
    expect(sent.tool_choice).toEqual({ type: "auto" });
  });

  it.each([
    ["no Origin", ask({ question: "q" }, {}), 403],
    ["other Origin", ask({ question: "q" }, { origin: "https://evil.test" }), 403],
    ["empty question", ask({ question: " " }), 400],
    ["long question", ask({ question: "x".repeat(301) }), 400],
    ["bad JSON", ask("nope"), 400],
  ])("rejects %s", async (_, req, status) => {
    const llm = scripted();
    const res = await createHandler({ privateSummary: "", llm })(req, ENV);
    expect(res.status).toBe(status);
    expect(llm.calls).toHaveLength(0);
  });

  it("returns 429 when rate limited", async () => {
    const env: Env = { ...ENV, RATE_LIMITER: { limit: async () => ({ success: false }) } };
    const res = await createHandler({ privateSummary: "", llm: scripted() })(ask({ question: "q" }), env);
    expect(res.status).toBe(429);
  });

  it("returns 502 when the model fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = (async () => new Response("overloaded", { status: 529 })) as unknown as typeof fetch;
    const res = await createHandler({ privateSummary: "", fetch: fetchFn })(ask({ question: "q" }), ENV);
    expect(res.status).toBe(502);
  });

  it("answers health, preflight, 404 and 405", async () => {
    const handle = createHandler({ privateSummary: "" });
    expect(await (await handle(new Request("https://w.test/api/health"), ENV)).json()).toEqual({ ok: true });
    const pre = await handle(new Request("https://w.test/api/ask", { method: "OPTIONS", headers: { origin: ORIGIN } }), ENV);
    expect(pre.status).toBe(204);
    expect((await handle(new Request("https://w.test/x"), ENV)).status).toBe(404);
    expect((await handle(new Request("https://w.test/api/ask", { headers: { origin: ORIGIN } }), ENV)).status).toBe(405);
  });
});
