// Figure 8: the app talking to itself. The conversation is data/echo.json,
// word for word from the phone's saved chats. Sound is off until you ask for it.
import { $, cssVar, el, reducedMotion, svgEl, whenNear } from "./core.js";

const DATA = new URL("../data/echo.json", import.meta.url);

// The two "user" lines that were really the phone hearing its own reply.
const ECHOES = new Set(["Don't have your personal list", "I don't have personal"]);

export function initEcho() {
  const fig = $("#fig-echo");
  whenNear(fig, async () => {
    const lines = await (await fetch(DATA)).json();
    build(fig, lines);
  });
}

function build(fig, lines) {
  const log = $("[data-log]", fig);
  const next = $("[data-next]", fig);
  const filterBtn = $("[data-filter]", fig);
  const soundBtn = $("[data-sound]", fig);
  const svg = $("[data-svg]", fig);
  const pulse = loop(svg);
  let i = 0;
  let filter = false;
  let sound = false;

  const say = (text) => {
    if (!sound || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    // Same as the app: speech drops the emoji.
    speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, "")));
  };

  function show(m) {
    const echoed = m.role === "user" && ECHOES.has(m.text);
    if (echoed && filter) {
      log.append(el("div", { class: "echo-msg dropped" }, el("s", { text: m.text }), el("span", { class: "echo-meta", text: "matches the reply being spoken. Dropped." })));
      pulse("blocked");
      log.scrollTop = log.scrollHeight;
      next.textContent = "It stays quiet now";
      next.disabled = true;
      return false;
    }
    const meta = echoed ? "heard from its own speaker" : m.role === "user" ? "via voice" : `reused ${m.reused} of ${m.prompt} prompt tokens`;
    log.append(el("div", { class: `echo-msg ${echoed ? "echoed" : m.role}` }, m.text, el("span", { class: "echo-meta", text: meta })));
    log.scrollTop = log.scrollHeight;
    if (m.role === "assistant") say(m.text);
    pulse(echoed ? "echo" : m.role);
    return true;
  }

  function step() {
    if (i >= lines.length) {
      next.disabled = true;
      next.textContent = "The log ends here";
      return;
    }
    const m = lines[i++];
    if (!show(m)) return;
    if (i >= lines.length) {
      next.disabled = true;
      next.textContent = "The log ends here";
    }
  }

  next.addEventListener("click", step);
  filterBtn.addEventListener("click", () => {
    filter = !filter;
    filterBtn.setAttribute("aria-pressed", String(filter));
    // Replay with the filter, so the reader sees the same moment go differently.
    log.replaceChildren();
    i = 0;
    next.disabled = false;
    next.textContent = "Keep listening";
    step();
  });
  soundBtn.addEventListener("click", () => {
    sound = !sound;
    soundBtn.setAttribute("aria-pressed", String(sound));
    soundBtn.textContent = sound ? "Sound off" : "Sound on";
    if (!sound && "speechSynthesis" in window) speechSynthesis.cancel();
  });
  if (!("speechSynthesis" in window)) soundBtn.hidden = true;
  step();
}

// The loop diagram: speaker, room, microphone, model. Returns a function that
// sends one pulse around it.
function loop(svg) {
  const C = 160, R = 112;
  const stops = [
    { label: "Model", a: -90 },
    { label: "Speaker", a: 0 },
    { label: "Microphone", a: 90 },
    { label: "Recognizer", a: 180 },
  ];
  const at = (deg) => [C + R * Math.cos((deg * Math.PI) / 180), C + R * Math.sin((deg * Math.PI) / 180)];
  const ring = svgEl("circle", { cx: C, cy: C, r: R, fill: "none", stroke: "var(--rule)", "stroke-width": 2, "stroke-dasharray": "4 7" });
  svg.append(ring);
  for (const s of stops) {
    const [x, y] = at(s.a);
    svg.append(svgEl("circle", { cx: x, cy: y, r: 33, fill: "var(--paper)", stroke: "var(--ink)", "stroke-width": 1.2 }), svgEl("text", { x, y: y + 4, text: s.label, "font-size": 9.5 }));
  }
  const center = svgEl("text", { x: C, y: C + 4, "font-size": 13, text: "" });
  svg.append(center);
  const dot = svgEl("circle", { r: 8, fill: "var(--accent-2)", opacity: 0 });
  svg.append(dot);

  let anim = 0;
  return (kind) => {
    cancelAnimationFrame(anim);
    const color = kind === "echo" ? "var(--red)" : kind === "blocked" ? "var(--green)" : kind === "assistant" ? "var(--accent-2)" : "var(--orange)";
    dot.setAttribute("fill", color);
    center.textContent = kind === "echo" ? "it hears itself" : kind === "blocked" ? "filtered" : "";
    // A reply travels model to speaker to mic. A person starts at the mic.
    const from = kind === "assistant" ? -90 : kind === "echo" ? 0 : 90;
    const to = kind === "blocked" ? 140 : kind === "assistant" ? 0 : 270;
    if (reducedMotion()) return;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / 900);
      const [x, y] = at(from + (to - from) * t);
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("opacity", t < 1 ? 1 : 0);
      if (t < 1) anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  };
}
