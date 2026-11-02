// The opening: a phone you can crash, in front of the 1000 slots that did it.
import { $, Console, cssVar, sleep, reducedMotion, crashes } from "./core.js";
import { Phone } from "./phone.js";

// Word for word from the phone's console log, August 26.
const CRASH_LOG = [
  ["failed to create memory pool mapping", "err"],
  ["0: mmap failed to reserve 0x3e800000000 bytes", "err"],
  ["1: Cannot allocate memory (os error 12)", "err"],
];

export function initHero() {
  const log = new Console($("#hero-console"));
  const phone = new Phone($("#hero-phone"));
  const slots = slotsBackground($("#hero-slots"));
  const hint = $("#tap-hint");

  const hints = [
    "That's all it does. Tap it again.",
    "Still no error on the screen.",
    "Scroll down. Let's fix it.",
  ];

  phone.onTap(async () => {
    log.line("launching org.pie-project.voice", "dim");
    await phone.open("starting the engine...");
    await sleep(reducedMotion() ? 200 : 420);
    for (const [text, kind] of CRASH_LOG) log.line(text, kind);
    const box = phone.root.getBoundingClientRect();
    const hero = $(".hero").getBoundingClientRect();
    slots.ripple(box.left + box.width / 2 - hero.left, box.top + box.height / 2 - hero.top);
    await phone.crash();
    hint.textContent = hints[Math.min(crashes.count - 1, hints.length - 1)];
  });

  // Tilt toward the pointer, a little. Skipped on touch and for reduced motion.
  if (!reducedMotion() && matchMedia("(hover: hover)").matches) {
    const device = $("#hero-phone");
    addEventListener(
      "pointermove",
      (e) => {
        const r = device.getBoundingClientRect();
        if (r.bottom < 0) return;
        const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        device.style.transform = `rotateY(${(dx * 16).toFixed(2)}deg) rotateX(${(-dy * 12).toFixed(2)}deg)`;
      },
      { passive: true },
    );
  }
}

// The hero's background is the bug itself: one faint square per Wasmtime slot,
// 1000 of them. A crash sends a red ring through them.
function slotsBackground(canvas) {
  const ctx = canvas.getContext("2d");
  let cols, rows, w, h, cell, wave = null;

  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The grid that holds 1000 squares at this shape.
    cols = Math.max(10, Math.round(Math.sqrt((1000 * w) / h)));
    rows = Math.ceil(1000 / cols);
    cell = Math.max(w / cols, h / rows);
    draw(performance.now());
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    const gap = Math.max(2, cell * 0.08);
    let drawn = 0;
    const radius = wave ? (now - wave.t) * 1.1 : 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols && drawn < 1000; c++, drawn++) {
        const x = c * cell;
        const y = r * cell;
        let alpha = 0.045;
        let color = "255,255,255";
        if (wave) {
          const d = Math.hypot(x + cell / 2 - wave.x, y + cell / 2 - wave.y);
          const band = 1 - Math.abs(d - radius) / 140;
          if (band > 0) {
            color = "255,70,55";
            alpha = 0.045 + band * 0.55;
          }
        }
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.fillRect(x + gap / 2, y + gap / 2, cell - gap, cell - gap);
      }
    }
    if (wave) {
      if (radius > Math.hypot(w, h) + 200) wave = null;
      else requestAnimationFrame(draw);
    }
  }

  new ResizeObserver(layout).observe(canvas);
  layout();

  return {
    ripple(x, y) {
      if (reducedMotion()) return;
      wave = { x, y, t: performance.now() };
      requestAnimationFrame(draw);
    },
  };
}
