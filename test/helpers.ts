import type { ContentBlock, Llm, LlmRequest, LlmResponse } from "../src/agent/types.ts";

export const text = (t: string): LlmResponse => ({ content: [{ type: "text", text: t }], stop_reason: "end_turn" });

export const toolCall = (name: string, input: Record<string, unknown> = {}, id = `id-${name}`): LlmResponse => ({
  content: [{ type: "tool_use", id, name, input } satisfies ContentBlock],
  stop_reason: "tool_use",
});

/** An Llm that replays responses in order and records every request. */
export function scripted(...responses: LlmResponse[]): Llm & { calls: LlmRequest[] } {
  const calls: LlmRequest[] = [];
  const llm = async (req: LlmRequest) => {
    calls.push(structuredClone(req));
    const next = responses.shift();
    if (!next) throw new Error("No more scripted responses");
    return next;
  };
  return Object.assign(llm, { calls });
}

export const REPOS = [
  { name: "procedural-planets", description: "GPU planets", language: "C++", stargazers_count: 3, pushed_at: "2026-10-01T00:00:00Z", topics: ["opengl"], html_url: "https://github.com/AcKeskin/procedural-planets", fork: false, private: false },
  { name: "canvas-deck", description: null, language: "TypeScript", stargazers_count: 1, pushed_at: "2026-09-01T00:00:00Z", html_url: "https://github.com/AcKeskin/canvas-deck", fork: false, private: false },
  { name: "someone-elses-lib", description: "fork", language: "C", stargazers_count: 0, pushed_at: "2025-01-01T00:00:00Z", html_url: "", fork: true, private: false },
];

/** Fake GitHub API. Unknown paths return 404. */
export function fakeGitHub(routes: Record<string, unknown> = {}) {
  const all: Record<string, unknown> = { "/users/AcKeskin/repos?type=owner&sort=pushed&per_page=100": REPOS, ...routes };
  const calls: string[] = [];
  const fetchFn = (async (url: string | URL | Request) => {
    const path = String(url).replace("https://api.github.com", "");
    calls.push(path);
    if (!(path in all)) return new Response("not found", { status: 404 });
    const body = all[path];
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  return { fetch: fetchFn, calls };
}
