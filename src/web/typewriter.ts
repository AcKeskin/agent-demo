/** Longest time an answer takes to type out, whatever its length. */
const MAX_MS = 1600;

export function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Types `text` into `el` like a terminal feed, then swaps in the final `html`
 * (which may hold links and citation chips). Instant with reduced motion.
 */
export async function typeOut(el: HTMLElement, text: string, html: string): Promise<void> {
  if (reducedMotion() || !text) {
    el.innerHTML = html;
    return;
  }
  const msPerChar = Math.min(12, MAX_MS / text.length);
  el.classList.add("typing");
  await new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const n = Math.min(text.length, Math.floor((now - start) / msPerChar));
      el.textContent = text.slice(0, n);
      if (n < text.length) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  el.classList.remove("typing");
  el.innerHTML = html;
}
