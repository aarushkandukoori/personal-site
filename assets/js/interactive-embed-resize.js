(function () {
  function resizeFrame(frame, height) {
    const next = Math.max(height, 320);
    frame.style.height = `${next}px`;
    frame.style.minHeight = `${next}px`;
    frame.setAttribute("scrolling", "no");
  }

  function readFrameHeight(frame) {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return 0;
      return Math.ceil(doc.documentElement.getBoundingClientRect().height);
    } catch (_) {
      return 0;
    }
  }

  function bindFrame(frame) {
    frame.setAttribute("scrolling", "no");

    frame.addEventListener("load", () => {
      const height = readFrameHeight(frame);
      if (height) resizeFrame(frame, height + 8);
    });
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "chirpy-interactive-height") return;

    document.querySelectorAll("iframe.interactive-embed").forEach((frame) => {
      if (frame.contentWindow === event.source) {
        resizeFrame(frame, data.height + 8);
      }
    });
  });

  function init() {
    document.querySelectorAll("iframe.interactive-embed").forEach(bindFrame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", () => {
    document.querySelectorAll("iframe.interactive-embed").forEach((frame) => {
      const height = readFrameHeight(frame);
      if (height) resizeFrame(frame, height + 8);
    });
  });
})();
