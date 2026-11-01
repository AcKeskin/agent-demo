import { describe, expect, it, vi } from "vitest";
import { GitHub } from "../src/tools/github.ts";
import { fakeGitHub, REPOS } from "./helpers.ts";

describe("GitHub", () => {
  it("lists only the owner's own public repos", async () => {
    const gh = new GitHub({ owner: "AcKeskin", fetch: fakeGitHub().fetch });
    const repos = await gh.listRepos();
    expect(repos.map((r) => r.name)).toEqual(["procedural-planets", "canvas-deck"]);
    expect(repos[1]).toMatchObject({ description: "", topics: [] });
  });

  it("rejects repos outside that list", async () => {
    const gh = new GitHub({ owner: "AcKeskin", fetch: fakeGitHub().fetch });
    await expect(gh.readme("someone-elses-lib")).rejects.toThrow(/No public repo/);
    await expect(gh.readme("../../orgs/x")).rejects.toThrow(/Invalid repo name/);
  });

  it("matches repo names case-insensitively and uses the real name", async () => {
    const api = fakeGitHub({ "/repos/AcKeskin/procedural-planets/readme": "# Planets" });
    const gh = new GitHub({ owner: "AcKeskin", fetch: api.fetch });
    expect(await gh.readme("Procedural-Planets")).toBe("# Planets");
  });

  it("caches responses until the TTL passes", async () => {
    let now = 0;
    const api = fakeGitHub();
    const gh = new GitHub({ owner: "AcKeskin", fetch: api.fetch, cacheTtlMs: 100, now: () => now });
    await gh.listRepos();
    await gh.listRepos();
    expect(api.calls).toHaveLength(1);
    now = 101;
    await gh.listRepos();
    expect(api.calls).toHaveLength(2);
  });

  it("uses global fetch when none is passed", async () => {
    const api = fakeGitHub();
    vi.stubGlobal("fetch", api.fetch);
    try {
      await new GitHub({ owner: "AcKeskin", fetch: undefined }).listRepos();
      expect(api.calls).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("follows pages until one is not full", async () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ ...REPOS[0]!, name: `r${i}` }));
    const api = fakeGitHub({
      "/users/AcKeskin/repos?type=owner&sort=pushed&per_page=100&page=1": many,
      "/users/AcKeskin/repos?type=owner&sort=pushed&per_page=100&page=2": [REPOS[1]],
    });
    const repos = await new GitHub({ owner: "AcKeskin", fetch: api.fetch }).listRepos();
    expect(repos).toHaveLength(101);
  });

  it("clamps the commit limit to 1..10", async () => {
    const api = fakeGitHub({
      "/repos/AcKeskin/canvas-deck/commits?per_page=10": [{ commit: { message: "Add pen\n\nbody", author: { date: "2026-09-01T00:00:00Z" } } }],
    });
    const gh = new GitHub({ owner: "AcKeskin", fetch: api.fetch });
    expect(await gh.commits("canvas-deck", 99)).toEqual([{ date: "2026-09-01T00:00:00Z", message: "Add pen" }]);
    await gh.commits("canvas-deck", 0).catch(() => {});
    expect(api.calls.at(-1)).toBe("/repos/AcKeskin/canvas-deck/commits?per_page=1");
  });

  it("sends the token when given and reports API errors", async () => {
    let auth: string | null = null;
    const fetchFn = (async (_: unknown, init?: RequestInit) => {
      auth = new Headers(init?.headers).get("authorization");
      return new Response("rate limited", { status: 403 });
    }) as typeof fetch;
    const gh = new GitHub({ owner: "AcKeskin", token: "t", fetch: fetchFn });
    await expect(gh.listRepos()).rejects.toThrow(/GitHub 403/);
    expect(auth).toBe("Bearer t");
  });
});
