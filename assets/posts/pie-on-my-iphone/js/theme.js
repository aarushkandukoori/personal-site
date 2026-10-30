// Runs before the page draws, so a saved theme never flashes the wrong colors.
try {
  const saved = localStorage.getItem("pie-post-theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
} catch {}
