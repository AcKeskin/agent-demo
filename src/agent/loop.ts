import type { ContentBlock, Llm, Message, Step, Tool, ToolResultBlock, ToolUseBlock } from "./types.ts";

export interface AgentOptions {
  llm: Llm;
  tools: Tool[];
  system: string;
  /** Model calls allowed before the agent must answer. Caps cost per question. */
  maxTurns?: number;
  /** Tool output longer than this is cut before it goes to the model. */
  maxToolChars?: number;
  /** Tool calls run per turn. Extra calls get an error result instead. */
  maxToolCalls?: number;
}

export interface AgentResult {
  answer: string;
  steps: Step[];
  /** True when the agent hit maxTurns and was told to answer with what it had. */
  truncated: boolean;
}

const PREVIEW_CHARS = 160;
const OUT_OF_STEPS = "I ran out of steps before finding an answer. Try a narrower question.";
const NO_ANSWER = "I couldn't answer that. Try asking about Ali Can's projects or work.";

/**
 * The agent loop: ask the model, run any tools it calls, send the results
 * back, repeat until it answers. On the last turn tools are withheld so the
 * model has to answer.
 */
export async function runAgent(question: string, opts: AgentOptions): Promise<AgentResult> {
  const { llm, tools, system, maxTurns = 5, maxToolChars = 4000, maxToolCalls = 4 } = opts;
  const byName = new Map(tools.map((t) => [t.spec.name, t]));
  const messages: Message[] = [{ role: "user", content: question }];
  const steps: Step[] = [];

  for (let turn = 1; turn <= maxTurns; turn++) {
    const last = turn === maxTurns;
    const res = await llm({
      system: last ? `${system}\n\nYou are out of tool calls. Answer now with what you have.` : system,
      messages,
      tools: tools.map((t) => t.spec),
      toolChoice: last ? "none" : "auto",
    });

    const answer = textOf(res.content);
    if (res.stop_reason === "max_tokens") {
      return { answer: answer ? `${answer}...` : OUT_OF_STEPS, steps, truncated: true };
    }
    const calls = res.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || calls.length === 0) {
      return { answer: answer || NO_ANSWER, steps, truncated: false };
    }
    // Tools are off on the last turn; never run calls made anyway, but keep any text.
    if (last) return { answer: answer || OUT_OF_STEPS, steps, truncated: true };

    messages.push({ role: "assistant", content: res.content });
    const results: ToolResultBlock[] = [];
    for (const [i, call] of calls.entries()) {
      // Every tool_use needs a tool_result, so skipped calls still get one.
      const { content, ok } =
        i < maxToolCalls
          ? await runTool(byName.get(call.name), call)
          : { content: `Skipped: at most ${maxToolCalls} tool calls per turn.`, ok: false };
      steps.push({ tool: call.name, input: call.input, ok, preview: preview(content) });
      results.push({ type: "tool_result", tool_use_id: call.id, content: content.slice(0, maxToolChars), is_error: !ok });
    }
    messages.push({ role: "user", content: results });
  }

  return { answer: OUT_OF_STEPS, steps, truncated: true };
}

async function runTool(tool: Tool | undefined, call: ToolUseBlock): Promise<{ content: string; ok: boolean }> {
  if (!tool) return { content: `Unknown tool: ${call.name}`, ok: false };
  try {
    return { content: await tool.run(call.input), ok: true };
  } catch (err) {
    return { content: `Error: ${err instanceof Error ? err.message : String(err)}`, ok: false };
  }
}

function textOf(content: ContentBlock[]): string {
  return content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
}

function preview(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_CHARS ? `${flat.slice(0, PREVIEW_CHARS - 3)}...` : flat;
}
