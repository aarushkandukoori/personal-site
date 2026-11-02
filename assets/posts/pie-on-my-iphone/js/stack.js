// Figure 6: what a token passes through, as a stack of layers you can pull apart.
import { $, clamp, drag, el, lerp, reducedMotion, svgEl, whenNear } from "./core.js";

const LAYERS = [
  { name: "Pie Voice", tag: "Swift", color: "#286dc0", text: "The app. Speech recognition and speech synthesis come from iOS, and the version-specific values sit in one small module so it can follow Pie's versions." },
  { name: "The shim", tag: "Rust, C ABI", color: "#3f7fc9", text: "Three C functions the Swift side can call: run an inferlet and stream its output through a callback, cancel, and free. Cancel is how a tap stops a reply in milliseconds." },
  { name: "Pie runtime", tag: "Rust", color: "#00356b", text: "The same runtime that runs on servers, in-process inside the app. It schedules forward passes and owns the KV pages." },
  { name: "The inferlet", tag: "WebAssembly on Pulley", color: "#bd5319", text: "The program that decides what happens at every token. iOS forbids JIT, so it's interpreted. That's fine because it only makes decisions. It keeps the conversation's KV between turns." },
  { name: "Metal engine", tag: "GPU kernels", color: "#17734c", text: "Where the math is. The shaders compile from source on the device, and they're a big part of why cargo check for iPhone passed with zero code changes." },
  { name: "Qwen3.5-0.8B", tag: "421 MiB, 4-bit weights", color: "#6a7480", text: "Small enough to fit next to everything else on a phone with 8 GB. It's also why the replies are funny." },
];

export function initStack() {
  const fig = $("#fig-stack");
  const svg = $("[data-svg]", fig);
  const note = $("[data-note]", fig);
  const groups = [];
  let spread = 0.15;
  let selected = 3;

  const CX = 190, RX = 165, RY = 44, H = 20;
  LAYERS.forEach((layer, i) => {
    const g = svgEl("g", { class: "layer", tabindex: 0, role: "button", "aria-label": `${layer.name}: ${layer.text}` });
    const side = svgEl("path", { class: "edge", d: `M ${CX - RX} 0 A ${RX} ${RY} 0 0 0 ${CX + RX} 0 L ${CX + RX} ${H} A ${RX} ${RY} 0 0 1 ${CX - RX} ${H} Z`, fill: layer.color, opacity: 0.82 });
    const top = svgEl("ellipse", { class: "edge", cx: CX, cy: 0, rx: RX, ry: RY, fill: layer.color });
    const label = svgEl("text", { x: CX + RX + 14, y: 5, text: layer.name });
    const tag = svgEl("text", { x: CX + RX + 14, y: 27, text: layer.tag, opacity: 0.65 });
    g.append(side, top, label, tag);
    const pick = () => select(i);
    g.addEventListener("click", pick);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick();
      }
    });
    groups.push(g);
  });
  // Drawn bottom layer first, so upper layers sit on top.
  [...groups].reverse().forEach((g) => svg.append(g));

  function layout() {
    const closed = 30, open = 70;
    const gap = lerp(closed, open, spread);
    const top = 56;
    groups.forEach((g, i) => g.setAttribute("transform", `translate(0 ${top + i * gap})`));
    const total = top + (LAYERS.length - 1) * gap + RY + H + 8;
    svg.setAttribute("viewBox", `0 0 640 ${Math.max(total, 330)}`);
  }

  function select(i) {
    selected = i;
    groups.forEach((g, j) => g.classList.toggle("sel", j === i));
    const l = LAYERS[i];
    note.replaceChildren(el("h4", { text: l.name }), el("p", { text: l.text }));
  }

  // Dragging up and down pulls the layers apart.
  let startY = 0, startSpread = 0, moved = false;
  drag(svg, {
    onStart: (e) => {
      startY = e.clientY;
      startSpread = spread;
      moved = false;
    },
    onMove: (e) => {
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 3) moved = true;
      spread = clamp(startSpread + dy / 220, 0, 1);
      layout();
    },
    // The svg holds the pointer while dragging, so a tap has to find its layer.
    onEnd: (e) => {
      if (moved || e.type !== "pointerup") return;
      const g = document.elementFromPoint(e.clientX, e.clientY)?.closest(".layer");
      if (g) select(groups.indexOf(g));
    },
  });

  layout();
  select(selected);

  // Opens by itself the first time you reach it.
  whenNear(
    fig,
    () => {
      if (reducedMotion()) {
        spread = 0.6;
        layout();
        return;
      }
      const from = spread, to = 0.7, t0 = performance.now();
      const tick = (now) => {
        const t = clamp((now - t0) / 1100, 0, 1);
        spread = lerp(from, to, 1 - (1 - t) ** 3);
        layout();
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    "-25% 0px",
  );
}
