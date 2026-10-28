// Visible paragraphs write independently so scrolling never waits for earlier text.
const CHARACTER_DELAY = 16; // About 36 characters/second, without a duration cap.

export function mountTextReveal(container, onLayout = () => {}) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  let paragraphs = [];
  let observer;
  let layoutFrame;

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
    cancelAnimationFrame(layoutFrame);
    layoutFrame = null;
    observer?.disconnect();
    paragraphs.forEach(restore);
    paragraphs = [];
    onLayout();
  };

  const type = entry => {
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
  };

  const refresh = () => {
    complete();
    if (motion.matches || !("IntersectionObserver" in window)) return;
    paragraphs = [...container.querySelectorAll(".content-text p, .note-body p")].map(element => {
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
      // Keep a small observable insertion point without reserving the full text height.
      element.hidden = false;
      element.classList.add("text-reveal-waiting");
      element.inert = true;
      return { element, parts, part: 0, started: false, timer: null };
    });
    const byElement = new Map(paragraphs.map(entry => [entry.element, entry]));
    observer = new IntersectionObserver(entries => {
      for (const item of entries) {
        const entry = byElement.get(item.target);
        if (!entry || entry.started || !item.isIntersecting) continue;
        entry.started = true;
        observer.unobserve(entry.element);
        type(entry);
      }
    }, { threshold: 0, rootMargin: "0px" });
    onLayout();
    paragraphs.forEach(entry => observer.observe(entry.element));
  };

  motion.addEventListener("change", () => { if (motion.matches) complete(); });
  window.addEventListener("beforeprint", complete);
  window.addEventListener("pagehide", complete);
  window.addEventListener("pageshow", event => {
    if (event.persisted) refresh();
  });
  return refresh;
}
