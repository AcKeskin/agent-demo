import { describe, expect, it } from "vitest";
import { GitHub } from "../src/tools/github.ts";
import { cleanMarkdown, createTools } from "../src/tools/index.ts";
import { fakeGitHub } from "./helpers.ts";

function tools(routes: Record<string, unknown> = {}, summary = "Works on XR.") {
  const gh = new GitHub({ owner: "AcKeskin", fetch: fakeGitHub(routes).fetch });
  return Object.fromEntries(createTools(gh, summary).map((t) => [t.spec.name, t]));
}

describe("tools", () => {
  it("list_repos gives one line per repo", async () => {
    const out = await tools().list_repos!.run({});
    expect(out.split("\n")).toEqual([
      "procedural-planets | C++ | 3 stars | pushed 2026-10-01 | GPU planets | topics: opengl",
      "canvas-deck | TypeScript | 1 stars | pushed 2026-09-01 | ",
    ]);
  });

  it("get_languages turns bytes into percentages", async () => {
    const out = await tools({ "/repos/AcKeskin/procedural-planets/languages": { GLSL: 250, "C++": 750 } }).get_languages!.run({ repo: "procedural-planets" });
    expect(out).toBe("C++: 75.0%\nGLSL: 25.0%");
  });

  it("get_private_work_summary returns the reviewed text only", async () => {
    expect(await tools().get_private_work_summary!.run({})).toBe("Works on XR.");
    expect(await tools({}, "").get_private_work_summary!.run({})).toBe("No summary available.");
  });

  it("every tool has a valid object schema", () => {
    for (const t of Object.values(tools())) {
      expect(t.spec.input_schema.type).toBe("object");
      expect(t.spec.name).toMatch(/^[a-z_]+$/);
    }
  });
});

describe("cleanMarkdown", () => {
  it("keeps angle brackets that are not HTML", () => {
    expect(cleanMarkdown("Uses std::vector<Planet> when a < b and c > d")).toBe("Uses std::vector<Planet> when a < b and c > d");
  });

  it("drops images, HTML and comments", () => {
    expect(cleanMarkdown('# T\n<!-- x -->\n![badge](u)\n<p align="center">Hi</p>\n\n\n\nEnd')).toBe("# T\n\nHi\n\nEnd");
  });
});
