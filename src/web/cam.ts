/** Camera-style label with a live clock, e.g. "RAG_07  15:08:01". */
export function startCam(el: HTMLElement, id: string): void {
  const pad = (n: number) => String(n).padStart(2, "0");
  const tick = () => {
    const d = new Date();
    el.innerHTML = `${id}<br>${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  tick();
  setInterval(tick, 1000);
}
