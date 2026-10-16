// CSS owns the fixed grid. JavaScript only rounds wrapped row heights to cells.
const aligners = new Set();

export function mountGridAlignment() {
  const root = document.documentElement;
  const main = document.querySelector(".main-area");
  if (!main) return;
  let lastWidth = -1;
  let lastCell = -1;

  const onResize = () => {
    const width = main.clientWidth;
    const cell = parseFloat(getComputedStyle(root).getPropertyValue("--grid-cell"));
    if (!(width > 0 && cell > 0)) return;
    if (width === lastWidth && cell === lastCell) return;
    lastWidth = width;
    lastCell = cell;
    for (const align of aligners) align();
  };

  onResize();
  // ResizeObserver runs before paint. No animation-frame delay or per-row observer.
  new ResizeObserver(onResize).observe(main);
  window.addEventListener("resize", onResize, { passive: true });

  const alignFonts = () => {
    for (const align of aligners) align();
  };
  document.fonts.ready.then(alignFonts);
  document.fonts.addEventListener("loadingdone", alignFonts);
}

export function alignRowsToGrid(container) {
  const align = () => {
    const cell = parseFloat(getComputedStyle(container).getPropertyValue("--grid-cell"));
    if (!(cell > 0)) return;
    const rows = [...container.querySelectorAll(".list-row, .project-header")];

    // Read natural heights in one batch and restore snapped heights before paint.
    rows.forEach(row => row.style.removeProperty("min-height"));
    const heights = rows.map(row => {
      const height = row.getBoundingClientRect().height;
      return Math.ceil((height - 0.01) / cell) * cell;
    });
    rows.forEach((row, index) => {
      row.style.minHeight = `${heights[index]}px`;
    });
  };

  aligners.add(align);
  return align;
}
