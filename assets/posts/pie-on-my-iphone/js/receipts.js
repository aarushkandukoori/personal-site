// Tap a number, see where it came from. data/receipts.json is generated from
// the raw logs by tools/build_data.py, so nothing here was typed by hand.
import { $, $$, el } from "./core.js";

const DATA = new URL("../data/receipts.json", import.meta.url);

export async function initReceipts() {
  const box = $("#receipt");
  const value = $("[data-value]", box);
  const what = $("[data-what]", box);
  const raw = $("[data-raw]", box);
  const source = $("[data-source]", box);
  let data = null;
  let opener = null;

  const close = (refocus) => {
    box.hidden = true;
    if (refocus) opener?.focus({ preventScroll: true });
    opener = null;
  };

  async function open(button) {
    try {
      data ??= await (await fetch(DATA)).json();
    } catch {
      return; // no receipts without the data, and the number is still on the page
    }
    const r = data[button.dataset.r];
    if (!r) return;
    opener = button;
    value.textContent = button.textContent;
    what.textContent = r.what;
    raw.textContent = r.raw;
    source.replaceChildren(
      "Source: ",
      r.link ? el("a", { href: r.link, text: r.source, target: "_blank", rel: "noopener" }) : r.source,
    );
    box.hidden = false;
    $(".receipt-close", box).focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const num = e.target.closest(".num");
    if (num) {
      open(num);
      return;
    }
    if (!box.hidden && !box.contains(e.target)) close(false);
  });
  $(".receipt-close", box).addEventListener("click", () => close(true));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close(true);
  });
}
