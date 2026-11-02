// Figure 7: a real five-turn conversation from the phone, on a tape of KV pages.
// Everything shown comes from data/turns.json, which is the app's own log.
import { $, el, reducedMotion, sleep, whenNear } from "./core.js";

const DATA = new URL("../data/turns.json", import.meta.url);

export function initKv() {
  const fig = $("#fig-kv");
  whenNear(fig, async () => {
    const data = await (await fetch(DATA)).json();
    build(fig, data);
  });
}

function build(fig, { page, turns, warm_mb }) {
  const q = $("[data-q]", fig);
  const tape = $("[data-tape]", fig);
  const stats = $("[data-stats]", fig);
  const ghost = $("[data-ghost]", fig);
  const next = $("[data-next]", fig);
  const cells = [];
  let turn = -1;
  let busy = false;

  // Enough pages for the longest prompt plus its reply.
  const last = turns[turns.length - 1];
  const totalCells = last.prompt + last.generated;
  const pages = Math.ceil(totalCells / page);
  for (let p = 0; p < pages; p++) {
    const pageEl = el("div", { class: "kv-page" });
    for (let c = 0; c < page; c++) {
      const cell = el("div", { class: "kv-cell" });
      pageEl.append(cell);
      cells.push(cell);
    }
    tape.append(pageEl);
  }

  q.textContent = "Nothing in the KV yet.";
  stats.replaceChildren(el("span", {}, "memory ", el("b", { text: `${Math.round(warm_mb)} MiB` }), " after boot"));

  const paint = (from, to, kind) => {
    for (let i = from; i < to; i++) cells[i].className = `kv-cell ${kind}`;
  };

  function ghostBars(t) {
    const max = last.prompt;
    const row = (label, value, color) => [
      el("span", { text: `${label} ${value}` }),
      el("div", { class: "kv-bar", style: `width:${(100 * value) / max}%;background:var(--${color})` }),
    ];
    ghost.replaceChildren(
      el("div", { class: "kv-ghost-bars" }, ...row("read:", t.prefill, "orange"), ...row("no reuse:", t.prompt, "muted")),
    );
  }

  next.addEventListener("click", async () => {
    if (busy) return;
    if (turn === turns.length - 1) {
      // Start again.
      turn = -1;
      paint(0, cells.length, "");
      q.textContent = "Nothing in the KV yet.";
      next.textContent = "Ask the first question";
      ghost.replaceChildren();
      return;
    }
    busy = true;
    next.disabled = true;
    turn++;
    const t = turns[turn];
    q.textContent = `"${t.utterance}"`;
    stats.replaceChildren(el("span", { text: `turn ${t.turn}` }));

    // Whatever is past the reused prefix isn't shared with this prompt.
    paint(0, cells.length, "");
    paint(0, t.reused, "reused");
    const motion = reducedMotion() ? 0 : 1;

    // The prefill, slowed ten times so it can be seen. Reuse is instant.
    const per = motion ? (t.ttft_s * 1000 * 10) / Math.max(1, t.prefill) : 0;
    for (let i = t.reused; i < t.prompt; i++) {
      paint(i, i + 1, "prefill");
      if (motion) await sleep(per);
    }
    // The reply, at the same 1/10 speed.
    const genPer = motion ? (1000 / t.decode_tps) * 10 : 0;
    for (let i = t.prompt; i < t.prompt + t.generated; i++) {
      paint(i, i + 1, "gen");
      if (motion) await sleep(genPer);
    }

    stats.replaceChildren(
      el("span", {}, "reused ", el("b", { text: `${t.reused} of ${t.prompt}` })),
      el("span", {}, "read ", el("b", { text: `${t.prefill}` })),
      el("span", {}, "first token ", el("b", { text: `${t.ttft_s.toFixed(2)} s` })),
      el("span", {}, "decode ", el("b", { text: `${t.decode_tps.toFixed(0)} tok/s` })),
      el("span", {}, "wrote ", el("b", { text: `${t.generated}` })),
      el("span", {}, "memory ", el("b", { text: `${Math.round(t.footprint_mb)} MiB` })),
    );
    ghostBars(t);
    busy = false;
    next.disabled = false;
    next.textContent = turn === turns.length - 1 ? "Start over" : "Ask the next question";
  });
}
