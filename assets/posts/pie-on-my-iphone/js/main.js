// The whole page's script. Each figure lives in its own small file.
import { $, crashes, svgEl, whenNear, sleep, reducedMotion } from "./core.js";
import { initHero } from "./hero.js";
import { initBringup } from "./bringup.js";
import { initSpeed } from "./speed.js";
import { initStack } from "./stack.js";
import { initKv } from "./kv.js";
import { initEcho } from "./echo.js";
import { initSlices } from "./slices.js";
import { initTree } from "./tree.js";
import { initReceipts } from "./receipts.js";
import { Phone } from "./phone.js";

// A figure that fails shouldn't take the rest of the page down with it.
for (const init of [initHero, initBringup, initSpeed, initStack, initKv, initEcho, initSlices, initTree, initReceipts, initTheme, initReadingPie, initClosing, initPayoffFallback]) {
  try {
    init();
  } catch (e) {
    console.error(`${init.name} failed`, e);
  }
}

function initTheme() {
  const button = $("#theme-toggle");
  const current = () =>
    document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const label = () => (button.textContent = current() === "dark" ? "Light" : "Dark");
  label();
  button.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("pie-post-theme", next);
    } catch {}
    label();
  });
}

// Reading progress, as thirteen slices, because the model was thirteen slices.
function initReadingPie() {
  const wrap = $("#reading-pie");
  const svg = $("svg", wrap);
  const C = 20, R = 18, N = 13;
  const slices = [];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2;
    const d = `M ${C} ${C} L ${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)} Z`;
    const path = svgEl("path", { d, fill: "var(--paper-2)", stroke: "var(--paper)", "stroke-width": 0.8 });
    svg.append(path);
    slices.push(path);
  }
  let frame = 0;
  const draw = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    const past = scrollY > innerHeight * 0.8;
    wrap.classList.toggle("on", past);
    $("#crashbar").classList.toggle("on", past);
    slices.forEach((s, i) => s.setAttribute("fill", i < Math.round(p * N) ? "var(--orange)" : "var(--paper-2)"));
  };
  addEventListener("scroll", () => (frame ||= requestAnimationFrame(draw)), { passive: true });
  draw();
}

// If someone scrolls past Figure 4 without tapping, the payoff still shows.
function initPayoffFallback() {
  const payoff = $("#payoff");
  const next = $("#says");
  new IntersectionObserver(([e], io) => {
    if (e.isIntersecting) {
      payoff.classList.add("always");
      io.disconnect();
    }
  }, { rootMargin: "0px 0px 300px 0px" }).observe(next);
}

// The last thing on the page: the phone that wouldn't open, opening.
function initClosing() {
  const section = $("#closing");
  const line = $("[data-line]", section);
  const phone = new Phone($("#closing-phone"));
  phone.onTap(async () => {
    await phone.open("");
    phone.setStatus("Ready.");
  });
  whenNear(section, async () => {
    if (!reducedMotion()) await sleep(350);
    await phone.open("");
    phone.setStatus("Ready.");
    phone.root.classList.add("tapped");
    const n = crashes.count;
    line.textContent = n
      ? `It opens now. You crashed it ${n} time${n === 1 ? "" : "s"} on the way here. Thanks for sticking with it.`
      : "It opens now. You never crashed it once, which is more than I can say.";
  }, "-30% 0px");
}
