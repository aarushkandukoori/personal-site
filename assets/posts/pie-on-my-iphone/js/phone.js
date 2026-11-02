// A drawn iPhone with the real app's layout: Yale blue band, serif "Pie",
// "Ask anything" at the bottom. Screens are redrawn in HTML so they can replay;
// the real screenshots are in Figure 5.
import { el, sleep, reducedMotion, crashes } from "./core.js";

const ICON = new URL("../img/app-icon.png", import.meta.url).href;

export class Phone {
  constructor(slot, { locked = false } = {}) {
    this.icon = el("button", { class: "ph-icon", type: "button", "aria-label": "Open the Pie app" }, el("img", { src: ICON, alt: "" }));
    const tiles = Array.from({ length: 7 }, () => el("div", { class: "ph-tile" }));
    this.home = el("div", { class: "ph-home" }, this.icon, ...tiles);
    this.status = el("div", { class: "ph-status" });
    this.body = el("div", { class: "ph-body" }, this.status);
    this.input = el("div", { class: "ph-input" }, el("span", { text: "Ask anything" }), el("button", { class: "ph-send", type: "button", "aria-label": "Send" }));
    this.app = el(
      "div",
      { class: "ph-app" },
      el("div", { class: "ph-band" }, el("b", { text: "Pie" }), el("span", { text: "Instant" })),
      this.body,
      this.input,
    );
    this.screen = el("div", { class: "ph-screen" }, el("div", { class: "ph-island" }), this.home, this.app);
    this.root = el("div", { class: `phone${locked ? " locked" : ""}` }, this.screen);
    slot.append(this.root);
    this.busy = false;
  }

  // The reader tapped the icon. fn decides what happens.
  onTap(fn) {
    this.icon.addEventListener("click", async () => {
      if (this.busy) return;
      this.busy = true;
      this.root.classList.add("tapped");
      try {
        await fn();
      } finally {
        this.busy = false;
      }
    });
  }

  // The icon grows into the app.
  async open(status = "") {
    const a = this.icon.getBoundingClientRect();
    const s = this.screen.getBoundingClientRect();
    this.app.style.setProperty("--ox", `${(100 * (a.left + a.width / 2 - s.left)) / (s.width || 1)}%`);
    this.app.style.setProperty("--oy", `${(100 * (a.top + a.height / 2 - s.top)) / (s.height || 1)}%`);
    this.setStatus(status);
    this.app.classList.add("open");
    await sleep(reducedMotion() ? 0 : 240);
  }

  close() {
    this.app.classList.remove("open");
  }

  // Back to the home screen with no warning, which is exactly what it did.
  async crash() {
    this.close();
    crashes.add();
    if (!reducedMotion()) {
      this.root.classList.remove("shake");
      void this.root.offsetWidth;
      this.root.classList.add("shake");
    }
    await sleep(reducedMotion() ? 0 : 280);
  }

  setStatus(text, isError = false) {
    this.body.replaceChildren(this.status);
    this.status.textContent = text;
    this.status.className = `ph-status${isError ? " err" : ""}`;
  }

  // A question and a reply streamed at the speed it was measured at.
  async chat({ question, reply, ttft, tokens, tps, stats, slow = 1, signal }) {
    const q = el("div", { class: "ph-q", text: question });
    const a = el("div", { class: "ph-a" });
    const s = el("div", { class: "ph-stats" });
    this.body.replaceChildren(q, a, s);
    await sleep(ttft * 1000 * slow);
    // No token boundaries were saved for this reply, so cut it into the same
    // number of equal pieces. The count and the rate are the measured ones.
    const size = reply.length / tokens;
    const started = performance.now();
    for (let i = 1; i <= tokens; i++) {
      if (signal?.stale?.()) return;
      a.textContent = reply.slice(0, Math.round(i * size));
      const due = started + ((i * 1000) / tps) * slow;
      await sleep(Math.max(0, due - performance.now()));
    }
    s.textContent = stats;
  }
}
