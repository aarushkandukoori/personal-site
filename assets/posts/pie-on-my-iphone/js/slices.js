// Figure 9: the only pie chart in this post. A 618 MiB model, cut small enough
// for GitHub. The real cut was 13 slices of 48 MiB.
import { $, clamp, drag, el, svgEl } from "./core.js";

const FILE_MIB = 618;
const GITHUB_LIMIT_MB = 100; // GitHub refuses a file over 100 MB
const MIB = 1048576;
const C = 200, R = 150;

const polar = (deg, r) => [C + r * Math.cos(((deg - 90) * Math.PI) / 180), C + r * Math.sin(((deg - 90) * Math.PI) / 180)];

export function initSlices() {
  const fig = $("#fig-slices");
  const svg = $("[data-svg]", fig);
  const num = $("[data-num]", fig);
  const read = $("[data-read]", fig);
  const wedges = svgEl("g");
  const knob = svgEl("g", { tabindex: 0, role: "slider", "aria-label": "Slice size. Arrow keys change it.", style: "cursor:grab" });
  knob.append(svgEl("line", { x1: C, y1: C, stroke: "var(--ink)", "stroke-width": 2.5 }), svgEl("circle", { r: 13, fill: "var(--accent)", stroke: "var(--paper)", "stroke-width": 3 }));
  svg.append(wedges, knob);
  const [knobLine, knobDot] = knob.children;
  let size = 48;
  let picked = 0;

  function wedge(a0, a1) {
    const [x0, y0] = polar(a0, R);
    const [x1, y1] = polar(a1, R);
    return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
  }

  function draw() {
    const n = Math.ceil(FILE_MIB / size);
    const tooBig = size * MIB > GITHUB_LIMIT_MB * 1e6;
    picked = Math.min(picked, n - 1);
    wedges.replaceChildren();
    for (let i = 0; i < n; i++) {
      const a0 = (360 * i * size) / FILE_MIB;
      const a1 = Math.min(360, (360 * (i + 1) * size) / FILE_MIB);
      const shade = i % 2 ? 90 : 62;
      const fill = `color-mix(in srgb, var(--${tooBig ? "red" : "orange"}) ${shade}%, var(--paper))`;
      const path = svgEl("path", { class: `slice${i === picked ? " sel" : ""}`, d: wedge(a0, a1), fill, role: "button", "aria-label": `Slice ${i}` });
      path.addEventListener("click", () => {
        picked = i;
        draw();
      });
      wedges.append(path);
    }

    // The knife sits on the edge of the first slice.
    const [kx, ky] = polar((360 * size) / FILE_MIB, R + 22);
    knobLine.setAttribute("x2", kx);
    knobLine.setAttribute("y2", ky);
    knobDot.setAttribute("cx", kx);
    knobDot.setAttribute("cy", ky);
    knob.setAttribute("aria-valuetext", `${size} MiB per slice, ${n} slices`);

    num.textContent = `${n} slice${n === 1 ? "" : "s"} of ${size} MiB`;
    const from = picked * size * MIB;
    const to = Math.min((picked + 1) * size, FILE_MIB) * MIB - 1;
    const name = `qwen3.5-0.8b.wgpu.zt.${String(picked).padStart(2, "0")}`;
    read.replaceChildren(
      tooBig ? el("span", { class: "bad", text: "GitHub refuses any file over 100 MB. Cut smaller.\n" }) : "",
      el("span", { text: `The tab asks for bytes=${from}-${to}.` }),
      el("br"),
      el("span", { text: `The service worker answers from ${name}.` }),
    );
  }

  const setFromAngle = (deg) => {
    // The angle of the first slice's edge is the slice size.
    const wrapped = ((deg % 360) + 360) % 360;
    const next = clamp(Math.round((wrapped / 360) * FILE_MIB), 16, 310);
    if (Math.abs(next - size) > 200) return; // dragged past 12 o'clock, don't teleport
    size = next;
    draw();
  };
  drag(knob, {
    onMove: (e) => {
      const r = svg.getBoundingClientRect();
      const k = 400 / r.width;
      const x = (e.clientX - r.left) * k - C;
      const y = (e.clientY - r.top) * k - C;
      setFromAngle((Math.atan2(y, x) * 180) / Math.PI + 90);
    },
  });
  knob.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 4, ArrowUp: 4, ArrowLeft: -4, ArrowDown: -4 }[e.key];
    if (!step) return;
    e.preventDefault();
    size = clamp(size + step, 16, 310);
    draw();
  });
  draw();
}
