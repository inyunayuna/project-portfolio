// A single writing cursor follows the document from top to bottom.
const CHARACTER_DELAY = 15; // About 36 characters/second, without a duration cap.

export function mountTextReveal(container, onLayout = () => {}) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  let paragraphs = [];
  let index = 0;
  let observer;
  let timer;

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
    clearTimeout(timer);
    observer?.disconnect();
    paragraphs.forEach(restore);
    paragraphs = [];
    onLayout();
  };

  const waitForNext = () => {
    const entry = paragraphs[index];
    if (!entry) return;
    // Only the next paragraph has an insertion point. Later paragraphs occupy
    // no space, so each new line physically pushes the content below it down.
    entry.element.hidden = false;
    entry.element.classList.add("text-reveal-waiting");
    onLayout();
    observer.observe(entry.element);
  };

  const type = entry => {
    if (paragraphs[index] !== entry) return;
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
      onLayout();
      timer = setTimeout(() => type(entry), CHARACTER_DELAY);
      return;
    }
    restore(entry);
    index++;
    onLayout();
    waitForNext();
  };

  const refresh = () => {
    complete();
    if (motion.matches || !("IntersectionObserver" in window)) return;
    index = 0;
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
      element.hidden = true;
      element.inert = true;
      return { element, parts, part: 0 };
    });
    observer = new IntersectionObserver(entries => {
      const entry = paragraphs[index];
      if (entry && entries.some(item => item.target === entry.element && item.isIntersecting)) {
        observer.unobserve(entry.element);
        type(entry);
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    waitForNext();
  };

  motion.addEventListener("change", () => { if (motion.matches) complete(); });
  window.addEventListener("beforeprint", complete);
  window.addEventListener("pagehide", complete);
  window.addEventListener("pageshow", event => {
    if (event.persisted) refresh();
  });
  return refresh;
}
