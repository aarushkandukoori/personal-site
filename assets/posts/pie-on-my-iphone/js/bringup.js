// Figures 1 to 4: the four ways the app died on a real phone, in order. Each
// fix hands you the next failure, the way it happened. The log lines are the
// real ones.
import { $, $$, Console, bytes, clamp, cssVar, crashes, drag, el, reducedMotion, sleep, svgEl, whenNear } from "./core.js";
import { Phone } from "./phone.js";

const NOT_PERMITTED = "create state dir ... Operation not permitted";
const CEILING_MIB = 5.2 * 1024;

export function initBringup() {
  sandboxFigure();
  swallowFigure();
  hexFigure();
  zoomFigure();
  padFigure();
  halveFigure();
}

// ── Figure 1: PIE_HOME ───────────────────────────────────────────────────
function sandboxFigure() {
  const fig = $("#fig-sandbox");
  const phone = new Phone($("[data-phone]", fig));
  const log = new Console($("[data-console]", fig));
  const fs = $("[data-fs]", fig);
  let fixed = false;

  const places = [
    { path: "~/.pie", note: "read-only, the default", kind: "bad", answer: () => log.line(NOT_PERMITTED, "err") },
    { path: "tmp/pie", note: "writable, but iOS can wipe it", kind: "meh", answer: () => log.line("works today, gone whenever iOS needs the space. Try again.", "dim") },
    { path: "Library/Application Support/pie", note: "writable, and it stays", kind: "good", answer: () => win() },
  ];
  const tag = el("span", { class: "fs-tag", text: "PIE_HOME" });
  const rows = places.map((p) => {
    const row = el("button", { class: `fs-row ${p.kind}`, type: "button" }, el("span", { class: "fs-name", text: p.path }), el("span", { class: "fs-note", text: p.note }));
    row.addEventListener("click", () => choose(p, row));
    fs.append(row);
    return row;
  });
  rows[0].append(tag);

  async function tryBoot() {
    if (fixed) return;
    log.line("launching...", "dim");
    await phone.open("starting the engine...");
    await sleep(reducedMotion() ? 100 : 360);
    if (fixed) return; // the reader fixed it while this was running
    log.line(NOT_PERMITTED, "err");
    await phone.crash();
  }
  phone.onTap(tryBoot);

  async function choose(place, row) {
    if (fixed) return;
    row.append(tag);
    place.answer();
  }

  async function win() {
    fixed = true;
    phone.busy = true;
    log.line("state dir ok: Library/Application Support/pie", "ok");
    await phone.open("starting the engine...");
    log.line("...and now it just sits there. Forever.", "dim");
  }

  // The tag can also be dragged onto a folder.
  let ghost = null;
  drag(tag, {
    onStart: (e) => {
      if (fixed) return;
      ghost = tag;
      ghost.classList.add("dragging");
      ghost.style.left = `${e.clientX - 30}px`;
      ghost.style.top = `${e.clientY - 12}px`;
    },
    onMove: (e) => {
      if (!ghost) return;
      ghost.style.left = `${e.clientX - 30}px`;
      ghost.style.top = `${e.clientY - 12}px`;
      rows.forEach((r) => {
        const b = r.getBoundingClientRect();
        r.classList.toggle("over", e.clientY >= b.top && e.clientY <= b.bottom && e.clientX >= b.left && e.clientX <= b.right);
      });
    },
    onEnd: () => {
      if (!ghost) return;
      ghost.classList.remove("dragging");
      ghost.style.left = ghost.style.top = "";
      ghost = null;
      const i = rows.findIndex((r) => r.classList.contains("over"));
      rows.forEach((r) => r.classList.remove("over"));
      if (i >= 0) choose(places[i], rows[i]);
    },
  });

  whenNear(fig, () => log.line("Tap the app to see it fail, or go straight to the fix.", "dim"));
}

// ── Figure 2: the swallowed error ────────────────────────────────────────
function swallowFigure() {
  const fig = $("#fig-swallow");
  const phone = new Phone($("[data-phone]", fig), { locked: true });
  const log = new Console($("[data-console]", fig));
  const line = $("[data-line]", fig);
  const code = $("[data-code]", fig);
  let opened = false;
  let fixed = false;

  whenNear(fig, async () => {
    await phone.open("starting the engine...");
    opened = true;
    phone.input.classList.add("dead");
    log.line("(nothing)", "dim");
  });

  // The symptom: every control does nothing.
  const wiggle = () => {
    if (fixed) return;
    phone.input.classList.remove("wiggle");
    void phone.input.offsetWidth;
    phone.input.classList.add("wiggle");
    log.line("(nothing)", "dim");
  };
  phone.input.addEventListener("click", wiggle);

  line.addEventListener("click", async () => {
    if (fixed || !opened) return;
    fixed = true;
    line.classList.add("fixed");
    line.setAttribute("aria-disabled", "true");
    code.textContent = 'do { _ = try await run(text: "hello", ...) }\ncatch { return String(describing: error) }';
    await sleep(500);
    log.line("Boot errors reach the screen now.", "ok");
    await sleep(reducedMotion() ? 100 : 1100);
    log.line("But the app still dies, and Swift never sees why.", "dim");
    await phone.crash();
  });
}

// ── The hex ──────────────────────────────────────────────────────────────
function hexFigure() {
  const fig = $("#fig-hex");
  const out = $("[data-out]", fig);
  const seen = new Set();
  const say = () => {
    const parts = [];
    if (seen.has("a")) parts.push("0x3e8 is 1000: the number of slots.");
    if (seen.has("b")) parts.push("Eight hex zeros shift by 32 bits, which is 4 GiB: the size of each slot.");
    if (seen.size === 2) parts.push("1000 × 4 GiB, printed right there in the error.");
    out.textContent = parts.join(" ");
  };
  $$("[data-hex]", fig).forEach((b) =>
    b.addEventListener("click", () => {
      seen.add(b.dataset.hex);
      say();
    }),
  );
}

// ── The zoom: one slot, then 1000 ────────────────────────────────────────
function zoomFigure() {
  const section = $("#fig-zoom");
  const canvas = $("[data-canvas]", section);
  const ctx = canvas.getContext("2d");
  const count = $("[data-count]", section);
  const size = $("[data-bytes]", section);
  const caption = $("[data-caption]", section);
  const captions = [
    [0, "The red square is the most one reservation can get on my phone. The blue one is a single Wasmtime slot."],
    [0.12, "One slot nearly fills it. There's room for exactly one."],
    [0.55, "The default was sized for a server, with room for a thousand inferlets at once. It keeps going."],
    [0.86, "1000 slots. The phone's whole limit is the speck in the corner. A Mac said yes to this."],
  ];
  let w, h, cols, rows, frame = 0;

  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.max(10, Math.round(Math.sqrt((1000 * w) / h)));
    rows = Math.ceil(1000 / cols);
    draw();
  }

  function progress() {
    const r = section.getBoundingClientRect();
    // Reaches 1 a little before the section ends, so the last frame gets to sit.
    return clamp(-r.top / ((r.height - innerHeight) * 0.9), 0, 1);
  }

  function draw() {
    frame = 0;
    const p = progress();
    // One unit is one 4 GiB slot, so area is honest. The limit has area 1.3.
    const limit = Math.sqrt(5.2 / 4);
    // Zoom out exponentially from a view around one slot to the whole wall.
    const fit = Math.max(cols, (rows * w) / h) * 1.06;
    const view = 3.3 * Math.pow(fit / 3.3, p);
    const scale = w / view;
    // The camera stays on the first slot for a while, then drifts to the middle.
    const drift = p * p * p;
    const cx = (limit / 2) * (1 - drift) + (cols / 2) * drift;
    const cy = (limit / 2) * (1 - drift) + (rows / 2) * drift;
    const X = (u) => w / 2 + (u - cx) * scale;
    const Y = (v) => h / 2 + (v - cy) * scale;

    ctx.clearRect(0, 0, w, h);
    const lit = Math.round(Math.pow(1000, p));
    const gap = 0.07;
    let n = 0;
    // Light the slots nearest the first one, growing outward.
    const order = [];
    for (let v = 0; v < rows; v++) for (let u = 0; u < cols && order.length < 1000; u++) order.push([u, v, Math.hypot(u, v)]);
    order.sort((a, b) => a[2] - b[2]);
    for (const [u, v] of order) {
      n++;
      const x = X(u + gap / 2);
      const y = Y(v + gap / 2);
      const s = (1 - gap) * scale;
      if (x > w || y > h || x + s < 0 || y + s < 0) continue;
      ctx.fillStyle = n <= lit ? "#4f8bd6" : "rgba(255,255,255,.06)";
      ctx.fillRect(x, y, s, s);
    }
    const lx = X(0);
    const ly = Y(0);
    const ls = limit * scale;
    ctx.fillStyle = "rgba(235,50,40,.34)";
    ctx.fillRect(lx, ly, ls, ls);
    ctx.lineWidth = Math.max(1.5, Math.min(3, ls / 60));
    ctx.strokeStyle = "#ff5247";
    ctx.strokeRect(lx, ly, ls, ls);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "top";
    if (ls > 120) {
      ctx.font = `${Math.min(17, ls / 14)}px "JetBrains Mono", monospace`;
      ctx.fillText("5.2 GiB limit", lx + 8, ly + ls - Math.min(26, ls / 8));
      ctx.fillText("one 4 GiB slot", lx + 16, ly + 16);
    } else {
      // Once it's tiny, ring it so it can still be found.
      ctx.beginPath();
      ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2 + 12, 0, 2 * Math.PI);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      const size = 14;
      ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
      const label = "the phone's limit";
      const lw = ctx.measureText(label).width;
      const tx = lx + ls + 22;
      const ty = ly + ls / 2 - size / 2 - 4;
      ctx.fillStyle = "rgba(0,20,45,.9)";
      ctx.fillRect(tx - 6, ty - 4, lw + 12, size + 12);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, tx, ty);
    }

    count.textContent = `${lit.toLocaleString("en-US")} slot${lit === 1 ? "" : "s"}`;
    size.textContent = bytes(lit * 4096);
    caption.textContent = captions.filter(([at]) => p >= at).pop()[1];
  }

  addEventListener("scroll", () => {
    const r = section.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    frame ||= requestAnimationFrame(draw);
  }, { passive: true });
  new ResizeObserver(layout).observe(canvas);
  layout();
}

// ── Figure 3: the pad ────────────────────────────────────────────────────
function padFigure() {
  const fig = $("#fig-pad");
  const phone = new Phone($("[data-phone]", fig));
  const log = new Console($("[data-console]", fig));
  const read = $("[data-read]", fig);
  const SLOTS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1000];
  const SIZES = [64, 128, 256, 512, 1024, 2048, 4096]; // MiB
  let sx = SLOTS.length - 1;
  let sy = SIZES.length - 1;
  let solved = false;

  // A plain log-log chart.
  const L = 66, T = 10, W = 370, H = 300;
  const px = (i) => L + (i / (SLOTS.length - 1)) * W;
  const py = (i) => T + H - (i / (SIZES.length - 1)) * H;
  const svg = svgEl("svg", { viewBox: "0 0 450 372", role: "img", "aria-label": "Slots on one axis, size per slot on the other. The region where they multiply to under 5.2 GiB is the only one that boots." });

  const fits = (i, j) => SLOTS[i] * SIZES[j] <= CEILING_MIB;
  for (let i = 0; i < SLOTS.length; i++) {
    for (let j = 0; j < SIZES.length; j++) {
      const r = 5 + 1.5 * Math.min(4, Math.log10(SLOTS[i] * SIZES[j]) - 1.8);
      svg.append(svgEl("circle", { cx: px(i), cy: py(j), r: Math.max(3, r), fill: fits(i, j) ? "var(--green)" : "var(--red)", opacity: fits(i, j) ? 0.7 : 0.22 }));
    }
  }
  SLOTS.forEach((v, i) => {
    if (i % 2 === 0 || v === 1000) svg.append(svgEl("text", { x: px(i), y: T + H + 22, "text-anchor": "middle", "font-size": 12, "font-family": "var(--mono)", fill: "var(--muted)", text: String(v) }));
  });
  SIZES.forEach((v, j) => svg.append(svgEl("text", { x: L - 12, y: py(j) + 4, "text-anchor": "end", "font-size": 12, "font-family": "var(--mono)", fill: "var(--muted)", text: bytes(v).replace(" ", "\u00a0") })));
  svg.append(svgEl("text", { x: L + W / 2, y: T + H + 46, "text-anchor": "middle", "font-size": 12.5, "font-family": "var(--mono)", fill: "var(--ink)", text: "slots" }));
  const shipped = svgEl("g", { opacity: 0 }, svgEl("circle", { cx: px(2), cy: py(1), r: 13, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5 }), svgEl("text", { x: px(2) + 20, y: py(1) + 4, "font-size": 12, "font-family": "var(--mono)", fill: "var(--ink)", stroke: "var(--paper)", "stroke-width": 4, "paint-order": "stroke", text: "what I shipped" }));
  svg.append(shipped);
  const puck = svgEl("circle", { r: 15, fill: "var(--accent)", stroke: "var(--paper)", "stroke-width": 3, tabindex: 0, role: "slider", "aria-label": "Pool size. Arrow keys move it.", style: "cursor:grab" });
  svg.append(puck);
  $("[data-pad]", fig).append(svg);

  function show() {
    puck.setAttribute("cx", px(sx));
    puck.setAttribute("cy", py(sy));
    const total = SLOTS[sx] * SIZES[sy];
    const ok = total <= CEILING_MIB;
    read.classList.toggle("fits", ok);
    read.replaceChildren(`${SLOTS[sx]} × ${bytes(SIZES[sy])} = `, el("b", { text: `${bytes(total)}: ${ok ? "it fits" : "mmap: ENOMEM"}` }));
    puck.setAttribute("aria-valuetext", `${SLOTS[sx]} slots of ${bytes(SIZES[sy])}, ${bytes(total)} in total`);
    return ok;
  }

  async function settle() {
    const ok = show();
    if (solved) return;
    if (!ok) {
      if (phone.busy) return;
      phone.busy = true;
      await boot(false);
      phone.busy = false;
      return;
    }
    solved = true;
    phone.busy = true;
    await boot(true);
    phone.busy = false;
  }

  async function boot(ok) {
    log.line(`reserving ${bytes(SLOTS[sx] * SIZES[sy])}...`, "dim");
    await phone.open("starting the engine...");
    await sleep(reducedMotion() ? 100 : 380);
    if (!ok) {
      log.line(`0: mmap failed to reserve 0x${Math.round(SLOTS[sx] * SIZES[sy] * 1048576).toString(16)} bytes`, "err");
      log.line("1: Cannot allocate memory (os error 12)", "err");
      await phone.crash();
      return;
    }
    shipped.setAttribute("opacity", 1);
    log.line(`[wasmtime] ios: pooling allocator with ${SLOTS[sx]} slot(s) x ${SIZES[sy]} MiB`, "ok");
    phone.setStatus("loading the model...");
    await sleep(reducedMotion() ? 100 : 700);
    log.line("model loaded. first forward pass...", "ok");
    await sleep(reducedMotion() ? 100 : 500);
    log.line("ggml.c:1604: GGML_ASSERT(ctx->mem_buffer != NULL)", "err");
    await phone.crash();
  }

  const nearest = (value, n) => clamp(Math.round(value * (n - 1)), 0, n - 1);
  drag(puck, {
    onStart: () => (puck.style.cursor = "grabbing"),
    onMove: (e) => {
      const r = svg.getBoundingClientRect();
      const k = 450 / r.width;
      sx = nearest(((e.clientX - r.left) * k - L) / W, SLOTS.length);
      sy = nearest((T + H - (e.clientY - r.top) * k) / H, SIZES.length);
      show();
    },
    onEnd: () => {
      puck.style.cursor = "grab";
      settle();
    },
  });
  puck.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!step) return;
    e.preventDefault();
    sx = clamp(sx + step[0], 0, SLOTS.length - 1);
    sy = clamp(sy + step[1], 0, SIZES.length - 1);
    show();
  });
  puck.addEventListener("keyup", (e) => {
    if (e.key.startsWith("Arrow")) settle();
  });
  phone.onTap(() => boot(fits(sx, sy)));
  show();
  log.line("Starts at the default. Drag the dot, then let go to try it.", "dim");
}

// The first turn on a real phone: the log kept the numbers but not the words,
// so the reply is drawn as its 22 tokens, at its measured speed.
async function firstReply(phone) {
  const blocks = el("div", { class: "ph-a", text: "" });
  const stats = el("div", { class: "ph-stats" });
  phone.body.replaceChildren(el("div", { class: "ph-q", text: "What is one good reason to run a language model on a phone instead of in the cloud?" }), blocks, stats);
  await sleep(570);
  for (let i = 0; i < 22; i++) {
    blocks.textContent += "\u25A0 ";
    await sleep(1000 / 62.6);
  }
  stats.textContent = "22 tokens. 0.57 s to first token, 63 tok/s.";
}

// ── Figure 4: halving the scheduler ──────────────────────────────────────
function halveFigure() {
  const fig = $("#fig-halve");
  const phone = new Phone($("[data-phone]", fig), { locked: true });
  const num = $("[data-num]", fig);
  const size = $("[data-bytes]", fig);
  const bar = $("[data-bar]", fig);
  const line = $("[data-line]", fig);
  const go = $("[data-go]", fig);
  const KB_PER_NODE = 19.7; // 30 x 2 tensors of 336 bytes per node, from ggml-backend.cpp
  let power = 19;

  const mib = (p) => (2 ** p * KB_PER_NODE) / 1024;
  line.style.bottom = `${(CEILING_MIB / mib(19)) * 100}%`;

  function show() {
    num.replaceChildren(`2`, el("sup", { text: String(power) }), " nodes");
    size.textContent = `${(2 ** power).toLocaleString("en-US")} × about 20 KB = ${bytes(mib(power))}`;
    bar.style.height = `${(mib(power) / mib(19)) * 100}%`;
  }
  show();

  go.addEventListener("click", async () => {
    power--;
    show();
    if (power > 14) return;
    go.disabled = true;
    go.textContent = "That's the one I shipped";
    bar.classList.add("ok");
    await phone.open("loading the model...");
    await sleep(reducedMotion() ? 100 : 600);
    await firstReply(phone);
    $("#payoff").classList.add("on");
    await sleep(500);
    $("#payoff").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  });
}
