import { describe, expect, it } from "vitest";
import { GitHub } from "../src/tools/github.ts";
import { fakeGitHub } from "./helpers.ts";

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

  it("clamps the commit limit to 1..10", async () => {
    const api = fakeGitHub({
      "/repos/AcKeskin/canvas-deck/commits?per_page=10": [{ commit: { message: "Add pen\n\nbody", author: { date: "2026-09-01T00:00:00Z" } } }],
    });
    const gh = new GitHub({ owner: "AcKeskin", fetch: api.fetch });
    expect(await gh.commits("canvas-deck", 99)).toEqual([{ date: "2026-09-01T00:00:00Z", message: "Add pen" }]);
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
