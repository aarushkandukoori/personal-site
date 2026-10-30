// Figure 5: the reply from the real screenshot, replayed at the measured speed.
import { $, whenNear } from "./core.js";
import { Phone } from "./phone.js";

// Word for word from the phone (tour2/03-answered.png). The stats line too.
const QUESTION = "What is one good reason to run a language model on a phone?";
const REPLY =
  "One good reason is that language models are fast and lightweight, allowing them to process large amounts of data—such as text from millions of devices or the entire internet—in milliseconds without significant power consumption. This efficiency makes them ideal for real-time applications like smart home controls, voice assistants, and mobile messaging where speed matters more than raw processing power.";
const MEASURED = { ttft: 0.24, tokens: 68, tps: 75.6, stats: "0.24 s to first token · 76 tok/s · 0 of 111 prompt tokens reused" };

export function initSpeed() {
  const fig = $("#fig-speed");
  const phone = new Phone($("[data-phone]", fig), { locked: true });
  let run = 0;

  async function play(slow) {
    const mine = ++run;
    await phone.chat({ question: QUESTION, reply: REPLY, ...MEASURED, slow, signal: { stale: () => mine !== run } });
  }

  whenNear(
    fig,
    async () => {
      await phone.open("");
      play(1);
    },
    "-20% 0px",
  );
  $("[data-again]", fig).addEventListener("click", () => play(1));
  $("[data-slow]", fig).addEventListener("click", () => play(10));
}
