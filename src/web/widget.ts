// Embeddable agent chat. Usage:
//   <div data-agent-demo data-endpoint="https://agent-demo.example.workers.dev"></div>
//   <script type="module" src="widget.js"></script>
// Without data-endpoint it shows a labelled example run instead.
import type { AskResponse } from "../worker/handler.ts";
import { EXAMPLE } from "./example.ts";
import { escapeHtml, renderAnswer, renderSteps } from "./render.ts";
import { STYLES } from "./styles.ts";
import { MAX_QUESTION_CHARS as MAX_CHARS } from "../limits.ts";

const TIMEOUT_MS = 45_000;
const QUESTIONS = [
  "What graphics work has he done?",
  "Which of his repos changed most recently?",
  "What does he do at his day job?",
  "Does he write TypeScript?",
];

/** An error with a message that is safe and useful to show. */
class ApiError extends Error {}

function mount(host: HTMLElement): void {
  const endpoint = host.dataset.endpoint?.replace(/\/$/, "");
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${STYLES}</style>
    <div class="box">
      <div class="top"><span class="hud"><span class="dot"></span>Agent · tools on GitHub</span><span class="hud">${endpoint ? "Live" : "Example only"}</span></div>
      <div class="log" aria-live="polite"></div>
      <div class="chips">${QUESTIONS.map((q) => `<button type="button">${escapeHtml(q)}</button>`).join("")}</div>
      <form><input id="agent-q" name="q" maxlength="${MAX_CHARS}" placeholder="Ask about his projects or work" autocomplete="off" aria-label="Question"><button>Ask</button></form>
    </div>`;

  const log = root.querySelector<HTMLElement>(".log")!;
  const form = root.querySelector("form")!;
  const input = form.querySelector("input")!;
  const button = form.querySelector("button")!;

  function addEntry(question: string): { steps: HTMLOListElement; answer: HTMLElement; entry: HTMLElement } {
    const entry = document.createElement("div");
    entry.className = "entry";
    entry.innerHTML = `<p class="q">&gt; ${escapeHtml(question)}</p><ol></ol><p class="a wait">Thinking...</p>`;
    log.append(entry);
    log.scrollTop = log.scrollHeight;
    return { entry, steps: entry.querySelector("ol")!, answer: entry.querySelector(".a")! };
  }

  function show(els: ReturnType<typeof addEntry>, res: AskResponse): void {
    els.steps.innerHTML = renderSteps(res.steps);
    els.answer.classList.remove("wait");
    els.answer.innerHTML = renderAnswer(res.answer);
    log.scrollTop = log.scrollHeight;
  }

  function showExample(): void {
    const els = addEntry(EXAMPLE.question);
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "Example of a run. Live answers need the Worker.";
    els.entry.insertBefore(note, els.steps);
    show(els, EXAMPLE.result);
    log.scrollTop = 0;
  }

  async function ask(question: string): Promise<void> {
    question = question.trim().slice(0, MAX_CHARS);
    if (!endpoint || !question || button.disabled) return;
    button.disabled = true;
    const els = addEntry(question);
    try {
      show(els, await post(question));
      input.value = "";
    } catch (err) {
      els.answer.classList.remove("wait");
      els.answer.textContent = err instanceof ApiError ? err.message : "Could not reach the agent. Try again.";
    } finally {
      button.disabled = false;
    }
  }

  async function post(question: string): Promise<AskResponse> {
    const res = await fetch(`${endpoint}/api/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as (AskResponse & { error?: string }) | null;
    if (res.ok && body) return body;
    throw new ApiError(body?.error ?? "The agent is unavailable right now. Try again later.");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void ask(input.value);
  });
  root.querySelectorAll<HTMLButtonElement>(".chips button").forEach((b) => b.addEventListener("click", () => void ask(b.textContent ?? "")));

  if (!endpoint) {
    // Nothing to ask without a Worker: show the example and hide the inputs.
    root.querySelector<HTMLElement>(".chips")!.hidden = true;
    form.hidden = true;
    showExample();
  }
}

document.querySelectorAll<HTMLElement>("[data-agent-demo]").forEach(mount);
