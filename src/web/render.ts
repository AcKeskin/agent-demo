import type { Step } from "../agent/types.ts";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

/** `get_readme(repo: "x")` */
export function formatCall(step: Pick<Step, "tool" | "input">): string {
  const args = Object.entries(step.input)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");
  return `${step.tool}(${args})`;
}

export function renderSteps(steps: Step[]): string {
  return steps
    .map(
      (s, i) =>
        `<li class="${s.ok ? "ok" : "err"}"><span class="n">${String(i + 1).padStart(2, "0")}</span>` +
        `<code>${escapeHtml(formatCall(s))}</code><span class="pv">${escapeHtml(s.preview)}</span></li>`,
    )
    .join("");
}

export function renderAnswer(answer: string): string {
  return escapeHtml(answer).replace(/\n/g, "<br>");
}
