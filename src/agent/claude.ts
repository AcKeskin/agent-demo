import type { Llm, LlmResponse } from "./types.ts";

const API_URL = "https://api.anthropic.com/v1/messages";
/** Per call. The widget gives up after 45 s for the whole run. */
const TIMEOUT_MS = 15_000;

export class UpstreamError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ClaudeOptions {
  apiKey: string;
  model: string;
  maxTokens: number;
  fetch?: typeof fetch;
}

/** Claude Messages API with tool use, as an `Llm`. */
export function claude(opts: ClaudeOptions): Llm {
  return async ({ system, messages, tools, toolChoice = "auto" }) => {
    const res = await (opts.fetch ?? fetch)(API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        system,
        messages,
        tools,
        tool_choice: { type: toolChoice },
      }),
    });
    if (!res.ok) throw new UpstreamError(res.status, await res.text());
    return (await res.json()) as LlmResponse;
  };
}
