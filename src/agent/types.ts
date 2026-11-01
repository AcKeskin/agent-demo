export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock;

export interface Message {
  role: "user" | "assistant";
  content: string | (ContentBlock | ToolResultBlock)[];
}

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, Json>; required?: string[] };
}

export interface LlmRequest {
  system: string;
  messages: Message[];
  tools: ToolSpec[];
}

export interface LlmResponse {
  content: ContentBlock[];
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence" | string;
}

/** One model call. Claude in production, a script in tests. */
export type Llm = (req: LlmRequest) => Promise<LlmResponse>;

export interface Tool {
  spec: ToolSpec;
  run(input: Record<string, unknown>): Promise<string>;
}

/** What the visitor sees about each tool call. */
export interface Step {
  tool: string;
  input: Record<string, unknown>;
  ok: boolean;
  /** Short preview of the result, not the full text sent to the model. */
  preview: string;
}
