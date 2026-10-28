// Consecutive text blocks share one cursor; visually separated regions start independently.
const CHARACTER_DELAY = 16; // Milliseconds between characters; smaller values type faster.

export function mountTextReveal(container, onLayout = () => {}) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  let paragraphs = [];
  let observer;
  let layoutFrame;
  let scrollFrame;
  let regions = [];

  const scheduleLayout = () => {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null;
      onLayout();
    });
  };

  const restore = entry => {
    for (const part of entry.parts) {
      if (part.node.nodeType === Node.TEXT_NODE) part.node.data = part.text;
      else part.node.hidden = false;
    }
    entry.element.hidden = false;
    entry.element.inert = false;
    entry.element.classList.remove("text-reveal-waiting");
  };

  const complete = () => {
    for (const entry of paragraphs) clearTimeout(entry.timer);
    cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
    regions.forEach(region => { region.done = true; });
    regions = [];
    cancelAnimationFrame(layoutFrame);
    layoutFrame = null;
    observer?.disconnect();
    paragraphs.forEach(restore);
    paragraphs = [];
    onLayout();
  };

  const type = entry => {
    if (entry.region.done) return;
    entry.element.hidden = false;
    entry.element.classList.remove("text-reveal-waiting");
    while (entry.part < entry.parts.length) {
      const part = entry.parts[entry.part];
      if (part.node.nodeType !== Node.TEXT_NODE) {
        part.node.hidden = false;
        entry.part++;
        continue;
      }
      if (part.position === part.characters.length) {
        entry.part++;
        continue;
      }
      part.node.appendData(part.characters[part.position++]);
      scheduleLayout();
      entry.timer = setTimeout(() => type(entry), CHARACTER_DELAY);
      return;
    }
    restore(entry);
    entry.timer = null;
    scheduleLayout();
    if (entry.next) type(entry.next);
    else entry.region.done = true;
  };

  const refresh = () => {
    complete();
    if (motion.matches || !("IntersectionObserver" in window)) return;
    // Adjacent content-text blocks form a single region. Media/embeds break the
    // sequence; each separate note card is its own visual region.
    regions = [];
    let previousBlock;
    for (const block of container.querySelectorAll(".content-text, .note-body")) {
      const continues = block.matches(".content-text")
        && previousBlock?.matches(".content-text")
        && block.previousElementSibling === previousBlock;
      if (!continues) regions.push({ elements: [], endBlock: block, done: false });
      const region = regions.at(-1);
      region.endBlock = block;
      region.elements.push(...block.querySelectorAll("p"));
      previousBlock = block;
    }
    const byElement = new Map();
    paragraphs = regions.flatMap(region => region.elements).map(element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      const parts = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.data;
          const characters = segmenter
            ? [...segmenter.segment(text)].map(part => part.segment) : Array.from(text);
          parts.push({ node, text, characters, position: 0 });
          node.data = "";
        } else if (node.tagName === "BR") {
          parts.push({ node });
          node.hidden = true;
        }
      }
      // Only each region's first paragraph needs an observable insertion point.
      element.hidden = true;
      element.classList.add("text-reveal-waiting");
      element.inert = true;
      return { element, parts, part: 0, started: false, timer: null };
    });
    const entriesByElement = new Map(paragraphs.map(entry => [entry.element, entry]));
    for (const region of regions) {
      const entries = region.elements.map(element => entriesByElement.get(element));
      region.entries = entries;
      if (!entries.length) { region.done = true; continue; }
      entries.forEach((entry, index) => {
        entry.region = region;
        entry.next = entries[index + 1];
      });
      const first = entries[0];
      first.element.hidden = false;
      byElement.set(first.element, first);
    }
    observer = new IntersectionObserver(entries => {
      for (const item of entries) {
        const entry = byElement.get(item.target);
        if (!entry || entry.region.done || entry.started || !item.isIntersecting) continue;
        entry.started = true;
        observer.unobserve(entry.element);
        type(entry);
      }
    }, { threshold: 0, rootMargin: "0px" });
    onLayout();
    byElement.forEach(entry => observer.observe(entry.element));
  };

  const finishPassedRegions = () => {
    scrollFrame = null;
    // Only finish regions entirely above the viewport, not ones still being read
    // or ones waiting below it. A small margin avoids firing at the screen edge.
    const passed = regions.filter(region => !region.done
      && region.endBlock.getBoundingClientRect().bottom < -24);
    if (!passed.length) return;
    const bottomBefore = container.getBoundingClientRect().bottom;
    for (const region of passed) {
      region.done = true;
      observer?.unobserve(region.entries[0].element);
      for (const entry of region.entries) {
        clearTimeout(entry.timer);
        entry.timer = null;
        entry.started = true;
        restore(entry);
      }
    }
    // Measure after grid snapping too. Completing text above the reader adds
    // height; move by precisely that amount to keep the downstream text in place.
    onLayout();
    const addedHeight = container.getBoundingClientRect().bottom - bottomBefore;
    if (addedHeight) window.scrollBy({ top: addedHeight, behavior: "instant" });
  };

  window.addEventListener("scroll", () => {
    if (scrollFrame || !regions.some(region => !region.done)) return;
    scrollFrame = requestAnimationFrame(finishPassedRegions);
  }, { passive: true });

  motion.addEventListener("change", () => { if (motion.matches) complete(); });
  window.addEventListener("beforeprint", complete);
  window.addEventListener("pagehide", complete);
  window.addEventListener("pageshow", event => {
    if (event.persisted) refresh();
  });
  return refresh;
}
