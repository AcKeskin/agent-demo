import { describe, expect, it } from "vitest";
import { runAgent } from "../src/agent/loop.ts";
import type { Tool } from "../src/agent/types.ts";
import { scripted, text, toolCall } from "./helpers.ts";

const echo: Tool = {
  spec: { name: "echo", description: "", input_schema: { type: "object", properties: { v: { type: "string" } } } },
  run: async ({ v }) => `got ${String(v)}`,
};
const broken: Tool = {
  spec: { name: "broken", description: "", input_schema: { type: "object", properties: {} } },
  run: async () => {
    throw new Error("boom");
  },
};

describe("runAgent", () => {
  it("answers directly when no tool is needed", async () => {
    const llm = scripted(text("Hi."));
    expect(await runAgent("q", { llm, tools: [echo], system: "s" })).toEqual({ answer: "Hi.", steps: [], truncated: false });
  });

  it("runs tools, feeds results back and records steps", async () => {
    const llm = scripted(toolCall("echo", { v: "x" }), text("Done."));
    const res = await runAgent("q", { llm, tools: [echo], system: "s" });

    expect(res.answer).toBe("Done.");
    expect(res.steps).toEqual([{ tool: "echo", input: { v: "x" }, ok: true, preview: "got x" }]);
    const last = llm.calls[1]!.messages.at(-1)!;
    expect(last.content).toEqual([{ type: "tool_result", tool_use_id: "id-echo", content: "got x", is_error: false }]);
  });

  it("reports tool errors to the model instead of failing", async () => {
    const llm = scripted(toolCall("broken"), toolCall("nope"), text("Sorry."));
    const res = await runAgent("q", { llm, tools: [broken], system: "s" });
    expect(res.steps.map((s) => [s.tool, s.ok, s.preview])).toEqual([
      ["broken", false, "Error: boom"],
      ["nope", false, "Unknown tool: nope"],
    ]);
    expect(res.answer).toBe("Sorry.");
  });

  it("withholds tools on the last turn so the model must answer", async () => {
    const llm = scripted(toolCall("echo", { v: "1" }), text("Final."));
    const res = await runAgent("q", { llm, tools: [echo], system: "s", maxTurns: 2 });
    expect(res.answer).toBe("Final.");
    expect(llm.calls[0]!.tools).toHaveLength(1);
    expect(llm.calls[1]!.tools).toEqual([]);
    expect(llm.calls[1]!.system).toContain("out of tool calls");
  });

  it("stops at maxTurns if the model keeps calling tools", async () => {
    const llm = scripted(toolCall("echo"), toolCall("echo"));
    const res = await runAgent("q", { llm, tools: [echo], system: "s", maxTurns: 2 });
    expect(res.truncated).toBe(true);
    expect(res.steps).toHaveLength(1);
  });

  it("cuts long tool output before sending it to the model", async () => {
    const long: Tool = { ...echo, run: async () => "x".repeat(50) };
    const llm = scripted(toolCall("echo"), text("ok"));
    const res = await runAgent("q", { llm, tools: [long], system: "s", maxToolChars: 10 });
    const sent = llm.calls[1]!.messages.at(-1)!.content as { content: string }[];
    expect(sent[0]!.content).toHaveLength(10);
    expect(res.steps[0]!.preview).toHaveLength(50);
  });
});
