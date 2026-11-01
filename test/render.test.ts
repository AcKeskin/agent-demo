import { describe, expect, it } from "vitest";
import { formatCall, renderAnswer, renderSteps } from "../src/web/render.ts";

describe("render", () => {
  it("formats tool calls", () => {
    expect(formatCall({ tool: "get_readme", input: { repo: "x" } })).toBe('get_readme(repo: "x")');
    expect(formatCall({ tool: "list_repos", input: {} })).toBe("list_repos()");
  });

  it("escapes tool previews and answers", () => {
    const html = renderSteps([{ tool: "t", input: {}, ok: false, preview: "<script>" }]);
    expect(html).toContain('class="err"');
    expect(html).toContain("&lt;script&gt;");
    expect(renderAnswer("a <b>\nc")).toBe("a &lt;b&gt;<br>c");
  });
});
