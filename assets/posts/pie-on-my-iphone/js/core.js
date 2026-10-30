// Small helpers shared by every figure. No frameworks on this page, so anyone
// can read how a figure works with view-source.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...kids);
  return node;
}

const SVG_NS = "http://www.w3.org/2000/svg";
export function svgEl(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...kids);
  return node;
}

// The current value of a CSS color variable, so canvas and SVG follow the theme.
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Runs fn once, the first time the element comes near the screen.
export function whenNear(node, fn, margin = "700px") {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        Promise.resolve()
          .then(fn)
          .catch((e) => {
            console.error(e);
            node.append(el("p", { class: "fig-note", text: "This figure couldn't load its data. Reload to try again." }));
          });
      }
    },
    { rootMargin: margin },
  );
  io.observe(node);
}

// One finger or mouse dragging on an element. onMove gets the pointer's
// position in client coordinates.
export function drag(node, { onStart, onMove, onEnd }) {
  node.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    node.setPointerCapture(e.pointerId);
    onStart?.(e);
    const move = (ev) => onMove?.(ev);
    const up = (ev) => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
      onEnd?.(ev);
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
  });
}

// Binary units, the way the phone's logs report them.
export function bytes(mib) {
  if (mib >= 1024 * 1024) return `${(mib / (1024 * 1024)).toFixed(1)} TiB`;
  if (mib >= 1024) return `${+(mib / 1024).toFixed(1)} GiB`;
  return `${Math.round(mib)} MiB`;
}

// A terminal strip. Each figure logs into its own.
export class Console {
  constructor(node) {
    this.node = node;
  }
  line(text, kind = "") {
    const row = el("div", { class: `console-line ${kind}`, text });
    this.node.append(row);
    this.node.scrollTop = this.node.scrollHeight;
    return row;
  }
  clear() {
    this.node.textContent = "";
  }
}

// How many times this reader has crashed my phone, shown at the bottom left
// and read back at the end of the post.
export const crashes = {
  count: 0,
  add() {
    this.count++;
    const bar = $("#crashbar");
    if (bar) {
      bar.hidden = false;
      bar.textContent = `You've crashed my phone ${this.count} time${this.count === 1 ? "" : "s"}.`;
    }
  },
};
