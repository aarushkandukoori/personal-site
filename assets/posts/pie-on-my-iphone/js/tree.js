// Figure 10: a tree of replies, every one a fork of the prompt's KV.
//
// Two engines with the same shape:
//   RecordedEngine replays rows captured from the real engine (tools/dev/capture.html),
//     at the speed they were measured, so this works on any device.
//   LiveEngine runs token_tree.wasm on Pie 0.6.2 on the reader's own GPU.
import { $, clamp, el, sleep, svgEl, whenNear, reducedMotion } from "./core.js";

const DATA = new URL("../data/trees.json", import.meta.url);
const MODEL_URL = "https://huggingface.co/ingim/qwen3.5-wgpu/resolve/main/0.6/qwen--qwen3-5-0-8b.qwen35-d0-8b-vision-u4g64-kv-bf16.wgpu.zt";
// Same settings as Pie's own Playground.
const ENGINE = { max_forward_tokens: 1024, max_forward_requests: 8, max_state_slots: 16 };
const MAX_TOKENS = 64;
const BOOT_FLAG = "pie-post-boot";
const BITS = Math.LN2; // the inferlet reports entropy in nats

// ── Engines ──────────────────────────────────────────────────────────────

class RecordedEngine {
  constructor(tree) {
    this.tree = tree;
    this.live = false;
    this.cancelled = false;
  }
  canFork(path) {
    return Boolean(this.tree.rows[path.join(",")]);
  }
  rootInfo() {
    return { prompt_tokens: this.tree.prompt_tokens, ms: this.tree.root_ms };
  }
  async *grow(path) {
    this.cancelled = false;
    const { rows, texts } = this.tree;
    yield { type: "forked", reused: this.tree.prompt_tokens, reread: path.length, ms: this.tree.forks?.[path.join(",")] ?? null };
    const p = [...path];
    for (let made = 0; made < MAX_TOKENS; made++) {
      const row = rows[p.join(",")];
      if (!row) {
        yield { type: "done", reason: "unrecorded", tokens: made };
        return;
      }
      const [ids, probs, entropy, ms, end] = row;
      await sleep(ms);
      if (this.cancelled) {
        yield { type: "done", reason: "stop", tokens: made };
        return;
      }
      yield {
        type: "token",
        step: p.length,
        id: ids[0],
        text: texts[ids[0]],
        p: probs[0],
        rank: 0,
        entropy,
        temperature: 0,
        ms,
        end: Boolean(end),
        top: ids.map((id, i) => ({ id, text: texts[id], p: probs[i] })),
      };
      if (end) {
        yield { type: "done", reason: "eos", tokens: made };
        return;
      }
      p.push(ids[0]);
    }
    yield { type: "done", reason: "max_tokens", tokens: MAX_TOKENS };
  }
  stop() {
    this.cancelled = true;
  }
  temperature() {}
}

class LiveEngine {
  constructor(server, client, program) {
    this.server = server;
    this.client = client;
    this.program = program;
    this.proc = null;
    this.live = true;
    this.temp = 0;
    this.seed = 1;
  }
  canFork() {
    return true;
  }
  rootInfo() {
    return this.root;
  }

  // Reads the prompt once. Every grow after this is a fork of it.
  async setPrompt(prompt) {
    if (this.proc) {
      const old = this.proc;
      this.proc = null;
      old.signal(JSON.stringify({ quit: true })).catch(() => {});
    }
    this.proc = await this.client.launchProcess(this.program, { prompt });
    const first = await this.next();
    if (first.type !== "root") throw new Error(first.value || "the inferlet did not start");
    this.root = first;
    return first;
  }

  async next() {
    const { event, value } = await this.proc.recv();
    if (event === "message") return JSON.parse(value);
    this.proc = null; // it's gone: the next reply needs a fresh setPrompt
    return { type: "ended", event, value };
  }

  async *grow(path) {
    if (!this.proc) {
      yield { type: "done", reason: "error", tokens: 0, detail: "the inferlet has stopped. Start over to run it again." };
      return;
    }
    await this.proc.signal(JSON.stringify({ grow: { path, max_tokens: MAX_TOKENS, temperature: this.temp, seed: this.seed++ } }));
    for (;;) {
      const m = await this.next();
      if (m.type === "ended") {
        yield { type: "done", reason: "error", tokens: 0, detail: m.value };
        return;
      }
      yield m;
      if (m.type === "done") return;
    }
  }
  stop() {
    this.proc?.signal(JSON.stringify({ stop: true })).catch(() => {});
  }
  temperature(t) {
    this.temp = t;
    this.proc?.signal(JSON.stringify({ temperature: t })).catch(() => {});
  }
}

// Turns on the two headers Pie's tab runtime needs. GitHub Pages can't send
// them, so a service worker adds them and the page reloads once.
async function isolate() {
  if (crossOriginIsolated) return true;
  if (!("serviceWorker" in navigator)) return false;
  await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  try {
    if (sessionStorage.getItem(BOOT_FLAG) === "reloaded") return false; // tried already
    sessionStorage.setItem(BOOT_FLAG, "reloaded");
  } catch {
    return false;
  }
  location.reload();
  await new Promise(() => {});
}

async function support() {
  if (!navigator.gpu) return "This browser has no WebGPU.";
  if (!("Suspending" in WebAssembly)) return "This browser has no WebAssembly JSPI.";
  try {
    if (!(await navigator.gpu.requestAdapter())) return "This browser found no usable GPU.";
  } catch {
    return "This browser found no usable GPU.";
  }
  return null;
}

// ── The figure ───────────────────────────────────────────────────────────

// Makes spaces and line breaks in a token visible, and names the stop token.
const isStop = (s) => /im_end|^<\|.*\|>$/.test(s);
const visible = (s) => (isStop(s) ? "(end)" : s === "" ? "(empty)" : s.replace(/ /g, "␣").replace(/\n/g, "⏎"));
const pct = (p) => `${(100 * p).toFixed(p < 0.1 ? 1 : 0)}%`;

export function initTree() {
  const fig = $("#fig-tree");
  const ui = {
    prompts: $("[data-prompts]", fig),
    rows: $("[data-rows]", fig),
    gutter: $("[data-gutter]", fig),
    detail: $("[data-detail]", fig),
    status: $("[data-status]", fig),
    boot: $("[data-boot]", fig),
    pie: $("[data-pie]", fig),
    form: $("[data-form]", fig),
    auto: $("[data-auto]", fig),
    reset: $("[data-reset]", fig),
    stop: $("[data-stop]", fig),
    heat: $("[data-heat]", fig),
    temp: $("[data-temp]", fig),
    tempOut: $("[data-temp-out]", fig),
  };

  let trees = [];
  let engine = null;
  let live = null;
  let rows = [];
  let selected = null;
  let running = null; // the promise of the reply being written
  let autoRun = 0;
  let nextId = 0;
  let promptIndex = 0;
  let customPrompt = null;
  let reading = false; // a prompt is being read on the live engine
  let cacheNote = "";
  let bootFailed = false;

  // ── Rows ───────────────────────────────────────────────────────────────

  function newRow(parent, forkStep, path) {
    const depth = parent ? parent.depth + 1 : 0;
    const textEl = el("div", { class: "tree-row-text" });
    const meta = el("span", { class: "tree-row-meta" });
    const node = el("div", { class: "tree-row", style: `--indent:${18 + Math.min(depth, 5) * 16}px` }, textEl, meta);
    const row = { id: nextId++, parent, depth, forkStep, path, tokens: [], node, textEl, meta, children: [] };
    if (parent) {
      row.tokens = parent.tokens.slice(0, forkStep);
      // The token at forkStep is the candidate that was picked. The model has
      // already been asked about it, so it comes from the parent's list.
      const from = parent.tokens[forkStep];
      const id = path[path.length - 1];
      const pick = from.top.find((c) => c.id === id);
      row.tokens[forkStep] = { id, text: pick.text, p: pick.p, rank: from.top.indexOf(pick), entropy: from.entropy, temperature: from.temperature, ms: 0, end: false, top: from.top };
      // Directly under the parent's family, like git log --graph.
      let after = parent;
      while (after.children.length) after = after.children[after.children.length - 1];
      parent.children.push(row);
      rows.splice(rows.indexOf(after) + 1, 0, row);
      after.node.after(node);
    } else {
      rows.push(row);
      ui.rows.append(node);
    }
    return row;
  }

  function tokenEl(row, step, shared) {
    const t = row.tokens[step];
    const span = el("span", {
      class: `tok${shared ? " shared" : ""}${step === row.forkStep && row.parent ? " forked" : ""}${t.end ? " end" : ""}`,
      role: "button",
      tabindex: 0,
      "data-row": row.id,
      "data-step": step,
      text: t.end ? "end" : t.text,
    });
    if (!shared) span.style.setProperty("--a", (0.62 * (1 - t.p)).toFixed(3));
    return span;
  }

  // A fork shows only the last few shared tokens, so a family of replies reads
  // as what's different about each one.
  function drawShared(row) {
    if (!row.parent) return;
    // Back up to the start of a word, so it never opens on "ittsburgh".
    let from = Math.max(0, row.forkStep - 4);
    while (from > 0 && !/^\s/.test(row.tokens[from].text)) from--;
    if (from > 0) row.textEl.append(el("span", { class: "tok shared", text: "..." }));
    for (let s = from; s < row.forkStep; s++) row.textEl.append(tokenEl(row, s, true));
  }

  function drawGutter() {
    const g = ui.gutter;
    g.replaceChildren();
    g.style.height = "0";
    const height = ui.rows.scrollHeight;
    g.setAttribute("height", height);
    g.style.height = `${height}px`;
    const xOf = (r) => 8 + Math.min(r.depth, 5) * 16;
    for (const r of rows) {
      const y = r.node.offsetTop + 17;
      if (r.parent) {
        const px = xOf(r.parent);
        const py = r.parent.node.offsetTop + 17;
        g.append(svgEl("path", { d: `M ${px} ${py} L ${px} ${y - 8} Q ${px} ${y} ${xOf(r)} ${y}`, fill: "none", stroke: "var(--rule)", "stroke-width": 1.5 }));
      }
      g.append(svgEl("circle", { cx: xOf(r), cy: y, r: r.parent ? 3.5 : 4.5, fill: r.parent ? "var(--orange)" : "var(--accent)" }));
    }
  }

  // ── Writing a reply ────────────────────────────────────────────────────

  async function write(row) {
    const started = performance.now();
    let last = null;
    drawShared(row);
    if (row.parent) row.textEl.append(tokenEl(row, row.forkStep, false));
    drawGutter();
    for await (const m of engine.grow(row.path)) {
      if (m.type === "forked") {
        row.fork = m;
        row.meta.textContent = metaText(row);
      } else if (m.type === "token") {
        row.tokens[m.step] = { id: m.id, text: m.text, p: m.p, rank: m.rank, entropy: m.entropy, temperature: m.temperature, ms: m.ms, end: m.end, top: m.top };
        row.textEl.append(tokenEl(row, m.step, false));
        if (!selected || selected.row === row) {
          if (!selected?.pinned) select(row, m.step, false);
        }
        last = m;
      } else if (m.type === "done") {
        row.done = m;
        row.meta.textContent = metaText(row);
        if (m.reason === "max_tokens" || m.reason === "unrecorded") row.textEl.append(el("span", { class: "tok shared", text: " ..." }));
        if (m.reason === "error") row.meta.textContent = `stopped with an error: ${m.detail ?? ""}`;
      }
      drawGutter();
    }
    // When a reply ends, point at the first spot where the model was really
    // unsure (entropy over 3 nats), or else its least sure spot.
    if (!selected?.pinned) {
      const from = row.parent ? row.forkStep + 1 : 0;
      let best = -1;
      for (let s = from; s < row.tokens.length; s++) {
        if (row.tokens[s].end) continue;
        if (row.tokens[s].entropy > 3) {
          best = s;
          break;
        }
        if (best < 0 || row.tokens[s].entropy > row.tokens[best].entropy) best = s;
      }
      if (best >= 0) select(row, best, false);
    }
    return { last, ms: performance.now() - started };
  }

  function metaText(row) {
    const parts = [];
    if (row.fork) {
      const f = row.fork;
      if (row.parent) {
        parts.push(`fork: ${f.reused} prompt tokens shared, ${f.reread} read`);
        if (f.ms != null) parts.push(`${f.ms.toFixed(f.ms < 10 ? 1 : 0)} ms`);
      } else if (engine.rootInfo()) {
        const r = engine.rootInfo();
        parts.push(`prompt: ${r.prompt_tokens} tokens read once in ${r.ms.toFixed(0)} ms`);
      }
    }
    if (row.done?.ms_per_token) parts.push(`${row.done.ms_per_token.toFixed(1)} ms per token`);
    if (row.done?.reason === "stop") parts.push("stopped, text kept");
    if (row.done?.reason === "unrecorded") parts.push("recording ends here");
    return parts.join(" · ");
  }

  async function startRow(row) {
    ui.stop.disabled = false;
    running = write(row).catch((e) => {
      row.meta.textContent = `failed: ${e.message ?? e}`;
    });
    await running;
    running = null;
    ui.stop.disabled = true;
  }

  async function stopCurrent() {
    if (!running) return;
    engine.stop();
    await running;
  }

  // ── Selecting a token and forking from it ──────────────────────────────

  function select(row, step, pinned = true) {
    // Shared tokens, and the fork's own first token, belong to the parent:
    // that's where the other forks from this spot live.
    while (row.parent && step <= row.forkStep) row = row.parent;
    selected = { row, step, pinned };
    ui.rows.querySelectorAll(".tok.sel").forEach((n) => n.classList.remove("sel"));
    row.node.querySelector(`[data-step="${step}"]`)?.classList.add("sel");
    drawDetail(row, step);
  }

  function pathTo(row, step) {
    return row.tokens.slice(0, step).map((t) => t.id);
  }

  function childOf(row, step, id) {
    return row.children.find((c) => c.forkStep === step && c.path[c.path.length - 1] === id);
  }

  function drawDetail(row, step) {
    const t = row.tokens[step];
    if (!t) return;
    const head = el("h4", { text: t.end ? "end of reply" : visible(t.text) });
    const meta = el("p", { class: "d-meta", text: `${pct(t.p)} sure · ${(t.entropy / BITS).toFixed(2)} bits of doubt` });
    const list = el("div", { class: "cands" });
    const path = pathTo(row, step);
    for (const c of t.top ?? []) {
      const chosen = c.id === t.id;
      const tried = childOf(row, step, c.id);
      const possible = !isStop(c.text) && engine.canFork([...path, c.id]);
      const button = el(
        "button",
        { class: `cand${chosen ? " chosen" : ""}${tried ? " tried" : ""}`, type: "button", title: chosen ? "This is what it picked" : isStop(c.text) ? "The reply would end here" : possible ? "Fork the reply here" : "Not recorded. Boot Pie to try it." },
        el("span", { class: "cand-t", text: visible(c.text) }),
        el("span", { class: "cand-b" }, el("i", { style: `width:${Math.max(1, 100 * c.p)}%` })),
        el("span", { class: "cand-p", text: pct(c.p) }),
      );
      if (!possible && !chosen) button.style.opacity = "0.55";
      button.addEventListener("click", () => {
        if (chosen) return;
        if (tried) {
          tried.node.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
          return;
        }
        if (isStop(c.text)) return;
        if (!possible) {
          ui.status.textContent = "I didn't record that branch. Boot Pie in this tab and you can take any of them.";
          return;
        }
        fork(row, step, c.id);
      });
      list.append(button);
    }
    const hint = el("p", { class: "d-meta", text: t.top?.length ? "Tap a candidate to fork the reply here." : "" });
    ui.detail.replaceChildren(head, meta, list, hint);
  }

  async function fork(row, step, id) {
    autoRun++;
    await stopCurrent();
    const child = newRow(row, step, [...pathTo(row, step), id]);
    child.node.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    selected = null;
    await startRow(child);
  }

  // Let it branch by itself: keep forking at the most doubtful untried spot.
  async function autoBranch() {
    const run = ++autoRun;
    await stopCurrent();
    for (let i = 0; i < 8 && run === autoRun; i++) {
      let best = null;
      for (const row of rows) {
        const start = row.parent ? row.forkStep + 1 : 0;
        for (let s = start; s < row.tokens.length; s++) {
          const t = row.tokens[s];
          if (t.end || !t.top) continue;
          const path = pathTo(row, s);
          for (const c of t.top) {
            if (c.id === t.id || isStop(c.text) || childOf(row, s, c.id) || !engine.canFork([...path, c.id])) continue;
            const score = c.p * t.entropy;
            if (!best || score > best.score) best = { score, row, s, id: c.id };
          }
        }
      }
      if (!best) break;
      const child = newRow(best.row, best.s, [...pathTo(best.row, best.s), best.id]);
      selected = null;
      await startRow(child);
      if (!reducedMotion()) await sleep(engine.live ? 120 : 220);
    }
  }

  // ── Prompts and modes ──────────────────────────────────────────────────

  function clearRows() {
    autoRun++;
    rows.forEach((r) => r.node.remove());
    rows = [];
    selected = null;
    ui.detail.replaceChildren();
    drawGutter();
  }

  // Reads a prompt on the live engine, or points at a recording. One at a time,
  // because the first read can take seconds and the buttons stay on screen.
  async function load(prompt, recorded, firstRead = false) {
    if (reading) return;
    reading = true;
    autoRun++;
    try {
      await stopCurrent();
      clearRows();
      if (live) {
        engine = live;
        if (!firstRead) ui.status.textContent = "Reading the prompt on your GPU...";
        await live.setPrompt(prompt);
        ui.status.textContent = liveStatus();
      } else {
        engine = recorded;
      }
    } catch (e) {
      ui.status.textContent = `Couldn't read that prompt: ${e.message ?? e}`;
      return;
    } finally {
      reading = false;
    }
    await startRow(newRow(null, 0, []));
  }

  function runPrompt(i, firstRead = false) {
    if (!trees.length) return;
    if (reading) return;
    promptIndex = i;
    customPrompt = null;
    [...ui.prompts.children].forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    return load(trees[i].prompt, new RecordedEngine(trees[i]), firstRead);
  }

  function liveStatus() {
    const r = live?.root;
    return `Live: Pie 0.6.2 on your GPU, nothing leaves this tab.${r ? ` This prompt: ${r.prompt_tokens} tokens read in ${r.ms.toFixed(0)} ms.` : ""}${cacheNote}`;
  }

  function drawPie(fraction) {
    const C = 20, R = 18, N = 13;
    const pie = ui.pie;
    pie.replaceChildren();
    const filled = fraction * N;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2;
      const d = `M ${C} ${C} L ${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)} Z`;
      const on = clamp(filled - i, 0, 1);
      pie.append(svgEl("path", { d, fill: on > 0 ? "var(--orange)" : "var(--paper-2)", opacity: on > 0 ? 0.35 + 0.65 * on : 1, stroke: "var(--paper)", "stroke-width": 0.6 }));
    }
  }

  async function boot() {
    // The runtime can't be loaded twice in one page, so a retry reloads.
    if (bootFailed) {
      try {
        sessionStorage.setItem(BOOT_FLAG, "reloaded");
      } catch {}
      location.reload();
      return;
    }
    ui.boot.disabled = true;
    let stall = null;
    try {
      const missing = await support();
      if (missing) {
        ui.status.textContent = `${missing} The recorded version still works. To run it live, use Chrome 137 or newer on a computer.`;
        return;
      }
      if (!(await isolate())) {
        ui.status.textContent = "Couldn't turn on the two headers Pie needs here. The recorded version still works.";
        return;
      }
      const t0 = performance.now();
      ui.status.textContent = "Loading Pie...";
      const { Server } = await import(new URL("pie/pie.mjs", location.href).href);
      // If the bytes stop coming, say so. A hidden or covered window can pause it.
      let lastProgress = performance.now();
      let fromCache = false;
      stall = setInterval(() => {
        if (performance.now() - lastProgress > 30000) ui.status.textContent = "Still waiting on the download. If this window was in the background, keeping it in front should get it going again.";
      }, 5000);
      const server = await Server.start({
        model: MODEL_URL,
        config: ENGINE,
        log: "warn",
        onProgress: (served, total, from) => {
          lastProgress = performance.now();
          fromCache = from === "cache";
          ui.status.textContent = "Loading Pie...";
          drawPie(clamp(served / total, 0, 1));
          ui.boot.textContent = fromCache ? "Loading from this browser's cache" : `Downloading ${Math.min(served, total) >> 20} of ${total >> 20} MiB`;
        },
      });
      clearInterval(stall);
      drawPie(1);
      const program = await server.install(new URL("pie/token_tree.wasm", location.href).href);
      const client = await server.connect();
      live = new LiveEngine(server, client, program);
      // On a first visit the model is saved in the background, for next time.
      if (!fromCache) {
        cacheNote = " Saving the model for next time, so keep this tab open a minute.";
        server.awaitCache().then(() => {
          cacheNote = " Saved for next time.";
          if (!reading && live) ui.status.textContent = liveStatus();
        }, () => {
          cacheNote = "";
        });
      }
      ui.boot.textContent = "Running in this tab";
      ui.status.textContent = `Booted in ${((performance.now() - t0) / 1000).toFixed(1)} s. Building GPU pipelines, which can take 15 s on a first visit...`;
      ui.form.hidden = false;
      ui.heat.hidden = false;
      ui.stop.hidden = false;
      await runPrompt(promptIndex, true);
    } catch (e) {
      console.error(e);
      clearInterval(stall);
      live = null;
      bootFailed = true;
      ui.form.hidden = true;
      ui.heat.hidden = true;
      ui.stop.hidden = true;
      ui.boot.disabled = false;
      ui.boot.textContent = "Try again";
      drawPie(0);
      await runPrompt(promptIndex);
      ui.status.textContent = `Couldn't boot: ${e.message ?? e}. The recorded version still works.`;
    }
  }

  // ── Wiring ─────────────────────────────────────────────────────────────

  ui.rows.addEventListener("click", (e) => {
    const t = e.target.closest(".tok[data-row]");
    if (!t) return;
    const row = rows.find((r) => r.id === Number(t.dataset.row));
    if (row) {
      select(row, Number(t.dataset.step));
      if (innerWidth <= 860) ui.detail.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    }
  });
  ui.rows.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".tok[data-row]")) {
      e.preventDefault();
      e.target.click();
    }
  });
  ui.auto.addEventListener("click", autoBranch);
  ui.reset.addEventListener("click", () => (customPrompt ? load(customPrompt) : runPrompt(promptIndex)));
  ui.stop.addEventListener("click", () => {
    autoRun++;
    if (running) engine?.stop();
  });
  ui.boot.addEventListener("click", boot);
  ui.temp.addEventListener("input", () => {
    const t = Number(ui.temp.value);
    ui.tempOut.textContent = t.toFixed(1);
    engine?.temperature(t);
  });
  ui.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const prompt = $("#tree-text").value.trim();
    if (!prompt || !live || reading) return;
    customPrompt = prompt;
    [...ui.prompts.children].forEach((b) => b.setAttribute("aria-pressed", "false"));
    load(prompt);
  });
  new ResizeObserver(drawGutter).observe(ui.rows);
  drawPie(0);

  // Back from the reload that turns on the headers: carry on booting right away.
  let resuming = false;
  try {
    resuming = sessionStorage.getItem(BOOT_FLAG) === "reloaded" && crossOriginIsolated;
    if (crossOriginIsolated) sessionStorage.removeItem(BOOT_FLAG);
  } catch {}

  async function start() {
    const data = await (await fetch(DATA)).json();
    trees = data.trees;
    for (const [i, t] of trees.entries()) {
      ui.prompts.append(el("button", { class: "tree-chip", type: "button", "aria-pressed": "false", text: t.prompt, onclick: () => runPrompt(i) }));
    }
    if (resuming) {
      fig.scrollIntoView({ block: "start" });
      boot();
    } else {
      runPrompt(0);
    }
  }

  if (resuming) start().catch((e) => console.error(e));
  else whenNear(fig, start, "900px");
}
